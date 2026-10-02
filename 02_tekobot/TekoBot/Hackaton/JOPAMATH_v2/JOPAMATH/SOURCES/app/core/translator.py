import json
import logging
from typing import List, Dict, Optional, Callable, Any
from sqlalchemy.orm import Session
from app.config import settings
from app.core.contexts import ContextType
from app.core.protector import ContentProtector
from app.core.validator import ContentValidator, ValidationResult
from app.core.glossary import GlossaryService, GlossaryConstraints
from app.core.memory import MemoryService
from app.core.provenance import ProvenanceManager
from app.database.models import TranslationUnit
from app.providers.base import BaseLLMProvider
from app.providers import get_provider

logger = logging.getLogger(__name__)

class TranslationPipelineResult:
    def __init__(
        self,
        source_text: str,
        target_text: str,
        status: str,
        context: ContextType,
        provider_used: str,
        model_used: str,
        protected_items: Dict[str, str],
        validation: ValidationResult,
        glossary_terms: List[str],
        sources: List[str],
        retry_count: int = 0
    ):
        self.source_text = source_text
        self.target_text = target_text
        self.status = status
        self.context = context
        self.provider_used = provider_used
        self.model_used = model_used
        self.protected_items = protected_items
        self.validation = validation
        self.glossary_terms = glossary_terms
        self.sources = sources
        self.retry_count = retry_count

class TranslatorCoordinator:
    """
    Coordinates end-to-end localization:
    TM Check -> Glossary -> Shielding -> LLM Provider -> Restoration -> Validation -> Retry Loop.
    """

    def __init__(
        self,
        provider: Optional[BaseLLMProvider] = None,
        max_retries: int = 2
    ):
        self.protector = ContentProtector()
        self.validator = ContentValidator()
        self.provider = provider
        self.max_retries = max_retries

    async def translate_single(
        self,
        db: Session,
        source_text: str,
        context: ContextType,
        provider_override: Optional[BaseLLMProvider] = None
    ) -> TranslationPipelineResult:
        active_provider = provider_override or self.provider or get_provider(db=db)

        # 1. Check exact Translation Memory
        tm_match = MemoryService.lookup_exact(db, source_text, context.value)
        if tm_match:
            logger.info("Translation Memory exact match hit for: %s", source_text[:40])
            val_res = self.validator.validate(
                source_text=source_text,
                target_text=tm_match.target_text,
                protected_item_map={}
            )
            return TranslationPipelineResult(
                source_text=source_text,
                target_text=tm_match.target_text,
                status="TM_MATCH",
                context=context,
                provider_used="TranslationMemory",
                model_used="TM-Exact",
                protected_items={},
                validation=val_res,
                glossary_terms=[],
                sources=["MATEJOPARA_TM"],
                retry_count=0
            )

        # 2. Extract glossary constraints
        constraints: GlossaryConstraints = GlossaryService.get_constraints(db, context, source_text)

        # 3. Protect sensitive elements
        prot_res = self.protector.protect(source_text)

        # Determine sources referenced
        sources = ["MEC_STUDENT", "SPL_DICTIONARY"]
        if constraints.matched_term_ids:
            sources.append("MATEJOPARA_GLOSSARY")

        # 4. LLM Generation and Retry Loop
        current_attempt = 0
        last_feedback: Optional[str] = None
        target_text = ""
        last_val_result = None
        prov_resp = None

        while current_attempt <= self.max_retries:
            try:
                prov_resp = await active_provider.translate(
                    protected_text=prot_res.protected_text,
                    context=context,
                    constraints=constraints,
                    retry_feedback=last_feedback,
                    retry_attempt=current_attempt
                )
            except Exception as e:
                logger.error("Provider error on attempt %d: %s", current_attempt, e)
                # If provider fails completely
                val_fail = ValidationResult(
                    is_valid=False,
                    checks=[],
                    errors=[f"Error del proveedor de IA: {str(e)}"],
                    warnings=[]
                )
                return TranslationPipelineResult(
                    source_text=source_text,
                    target_text="",
                    status="VALIDATION_ERROR",
                    context=context,
                    provider_used=active_provider.name,
                    model_used="error",
                    protected_items=prot_res.item_map,
                    validation=val_fail,
                    glossary_terms=constraints.keep_spanish + list(constraints.preferred.keys()),
                    sources=sources,
                    retry_count=current_attempt
                )

            # Restore protected items
            restored = self.protector.restore(prov_resp.raw_text, prot_res.item_map)

            # Validate
            val_result = self.validator.validate(
                source_text=source_text,
                target_text=restored,
                protected_item_map=prot_res.item_map,
                keep_spanish_terms=constraints.keep_spanish,
                forbidden_terms=constraints.forbidden
            )

            target_text = restored
            last_val_result = val_result

            if val_result.is_valid:
                break

            # Need retry if attempts remain
            current_attempt += 1
            last_feedback = val_result.retry_feedback
            logger.warning("Attempt %d failed validation: %s. Retrying...", current_attempt, val_result.errors)

        # 5. Determine final state (NEVER HUMAN_VALIDATED automatically!)
        if last_val_result.is_valid:
            if last_val_result.warnings:
                final_status = "NEEDS_REVIEW"
            else:
                final_status = "AUTO_GENERATED"
        else:
            final_status = "VALIDATION_ERROR"

        return TranslationPipelineResult(
            source_text=source_text,
            target_text=target_text,
            status=final_status,
            context=context,
            provider_used=prov_resp.provider_name if prov_resp else active_provider.name,
            model_used=prov_resp.model_name if prov_resp else "unknown",
            protected_items=prot_res.item_map,
            validation=last_val_result,
            glossary_terms=constraints.keep_spanish + list(constraints.preferred.keys()),
            sources=sources,
            retry_count=current_attempt
        )

    async def translate_batch(
        self,
        db: Session,
        units: List[TranslationUnit],
        provider_override: Optional[BaseLLMProvider] = None,
        progress_callback: Optional[Callable[[int, int, Dict[str, int]], Any]] = None
    ) -> Dict[str, Any]:
        """
        Translates a batch of units with deduplication and error resilience.
        Duplicate (source_text, context) entries are translated once and reused.
        """
        active_provider = provider_override or self.provider or get_provider(db=db)
        total = len(units)
        stats = {
            "processed": 0,
            "tm_matches": 0,
            "auto_generated": 0,
            "needs_review": 0,
            "errors": 0,
            "reused_duplicates": 0
        }

        # Cache for deduplication: (source_text, context) -> TranslationPipelineResult
        cache: Dict[str, TranslationPipelineResult] = {}

        for idx, unit in enumerate(units):
            cache_key = f"{unit.source_text.strip()}||{unit.context.strip().upper()}"

            if cache_key in cache:
                result = cache[cache_key]
                stats["reused_duplicates"] += 1
            else:
                ctx_enum = ContextType(unit.context) if unit.context in ContextType.__members__ else ContextType.GENERAL
                try:
                    result = await self.translate_single(
                        db=db,
                        source_text=unit.source_text,
                        context=ctx_enum,
                        provider_override=active_provider
                    )
                    cache[cache_key] = result
                except Exception as ex:
                    logger.error("Unexpected error in unit %s: %s", unit.id, ex)
                    unit.status = "VALIDATION_ERROR"
                    unit.validation_error = str(ex)
                    unit.validation_json = json.dumps({"errors": [str(ex)], "checks": []})
                    stats["errors"] += 1
                    stats["processed"] += 1
                    db.commit()
                    continue

            # Update TranslationUnit
            unit.target_text = result.target_text
            unit.status = result.status
            unit.provider_used = result.provider_used
            unit.model_used = result.model_used
            unit.protected_items_json = json.dumps(result.protected_items, ensure_ascii=False)
            unit.validation_json = json.dumps(result.validation.model_dump(), ensure_ascii=False)
            unit.validation_error = "; ".join(result.validation.errors) if result.validation.errors else None
            unit.glossary_terms_json = json.dumps(result.glossary_terms, ensure_ascii=False)
            unit.sources_json = json.dumps(result.sources, ensure_ascii=False)
            unit.retry_count = result.retry_count

            # Stats update
            stats["processed"] += 1
            if result.status == "TM_MATCH":
                stats["tm_matches"] += 1
            elif result.status == "AUTO_GENERATED":
                stats["auto_generated"] += 1
            elif result.status == "NEEDS_REVIEW":
                stats["needs_review"] += 1
            elif result.status == "VALIDATION_ERROR":
                stats["errors"] += 1

            db.commit()

            if progress_callback:
                progress_callback(stats["processed"], total, stats)

        return stats
