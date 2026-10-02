import re
from typing import List, Dict, Optional, Set
from pydantic import BaseModel

class ValidationCheck(BaseModel):
    name: str
    passed: bool
    message: str

class ValidationResult(BaseModel):
    is_valid: bool
    checks: List[ValidationCheck]
    errors: List[str]
    warnings: List[str]
    retry_feedback: Optional[str] = None

class ContentValidator:
    """
    Validates restored localization output against input source and constraints.
    Enforces strict mathematical, technical, and linguistic boundary conditions.
    """

    LLM_META_PATTERNS = [
        re.compile(r"^(?:aquí está|aquí tienes|traducción|propuesta|claro que sí|por supuesto|hola,\s*aquí)\b", re.IGNORECASE),
        re.compile(r"^(?:jopara:|español:|versión en jopara:)", re.IGNORECASE),
        re.compile(r"\b(?:espero que te sirva|espero haberte ayudado|como modelo de ia)\b", re.IGNORECASE),
        re.compile(r"```[a-z]*\s*", re.IGNORECASE)  # Unwanted markdown code fences
    ]

    # Specific double-encoded UTF-8 sequences (mojibake) and replacement characters
    MOJIBAKE_PATTERNS = [
        re.compile(r"(?:Ã±|Ã¡|Ã©|Ã­|Ã³|Ãº|Ã£|Ãµ|Ã‘|Ã‰|Ã“|Ãš|\ufffd)")
    ]

    def validate(
        self,
        source_text: str,
        target_text: str,
        protected_item_map: Dict[str, str],
        keep_spanish_terms: Optional[List[str]] = None,
        forbidden_terms: Optional[List[str]] = None
    ) -> ValidationResult:
        checks: List[ValidationCheck] = []
        errors: List[str] = []
        warnings: List[str] = []
        retry_feedbacks: List[str] = []

        # 1. Check non-empty
        if not target_text or not target_text.strip():
            msg = "El texto de salida está vacío."
            checks.append(ValidationCheck(name="non_empty", passed=False, message=msg))
            errors.append(msg)
            return ValidationResult(
                is_valid=False,
                checks=checks,
                errors=errors,
                warnings=warnings,
                retry_feedback="Genera una propuesta no vacía respetando los elementos protegidos."
            )
        checks.append(ValidationCheck(name="non_empty", passed=True, message="El texto contiene contenido válido."))

        # 2. Check no leftover protected tokens [[MJ_PROTECTED_...]]
        leftover_tokens = re.findall(r"\[\[\s*MJ_PROTECTED_\d+\s*\]\]", target_text)
        if leftover_tokens:
            msg = f"Se detectaron tokens de protección sin restaurar: {', '.join(leftover_tokens)}"
            checks.append(ValidationCheck(name="no_unrestored_tokens", passed=False, message=msg))
            errors.append(msg)
            retry_feedbacks.append("Conserva todos los tokens [[MJ_PROTECTED_XXXX]] exactamente sin modificarlos.")
        else:
            checks.append(ValidationCheck(name="no_unrestored_tokens", passed=True, message="Todos los tokens protegidos fueron restaurados."))

        # 3. Check exact presence of each protected item
        missing_protected = []
        for token, original_val in protected_item_map.items():
            if original_val not in target_text:
                missing_protected.append(original_val)

        if missing_protected:
            msg = f"Faltan elementos protegidos requeridos: {', '.join(missing_protected)}"
            checks.append(ValidationCheck(name="protected_elements_intact", passed=False, message=msg))
            errors.append(msg)
            retry_feedbacks.append(f"La respuesta anterior alteró o eliminó elementos protegidos: {', '.join(missing_protected)}. Debes conservarlos exactamente.")
        else:
            checks.append(ValidationCheck(name="protected_elements_intact", passed=True, message="Todos los elementos protegidos (fórmulas, variables, números, URLs) están intactos."))

        # 4. Check KEEP_SPANISH terms
        if keep_spanish_terms:
            missing_keep = []
            source_lower = source_text.lower()
            target_lower = target_text.lower()
            for term in keep_spanish_terms:
                term_lower = term.lower()
                # If term was in source text, it must be in target text
                if re.search(rf"\b{re.escape(term_lower)}\b", source_lower):
                    if not re.search(rf"\b{re.escape(term_lower)}\b", target_lower):
                        missing_keep.append(term)

            if missing_keep:
                msg = f"Se omitieron o alteraron términos KEEP_SPANISH: {', '.join(missing_keep)}"
                checks.append(ValidationCheck(name="keep_spanish_respected", passed=False, message=msg))
                errors.append(msg)
                retry_feedbacks.append(f"Debes conservar en español exactamente los siguientes términos técnicos: {', '.join(missing_keep)}.")
            else:
                checks.append(ValidationCheck(name="keep_spanish_respected", passed=True, message="Se respetaron todos los términos obligatorios en español (KEEP_SPANISH)."))

        # 5. Check FORBIDDEN terms
        if forbidden_terms:
            found_forbidden = []
            target_lower = target_text.lower()
            for term in forbidden_terms:
                term_lower = term.lower()
                if re.search(rf"\b{re.escape(term_lower)}\b", target_lower):
                    found_forbidden.append(term)

            if found_forbidden:
                msg = f"Se detectaron términos prohibidos (FORBIDDEN): {', '.join(found_forbidden)}"
                checks.append(ValidationCheck(name="forbidden_terms_absent", passed=False, message=msg))
                errors.append(msg)
                retry_feedbacks.append(f"No utilices los siguientes términos prohibidos: {', '.join(found_forbidden)}.")
            else:
                checks.append(ValidationCheck(name="forbidden_terms_absent", passed=True, message="No se encontraron términos prohibidos."))

        # 6. Check for LLM meta-text
        meta_detected = False
        for p in self.LLM_META_PATTERNS:
            if p.search(target_text.strip()):
                meta_detected = True
                break
        if meta_detected:
            msg = "Se detectó meta-comentario o encabezado del modelo de lenguaje."
            checks.append(ValidationCheck(name="no_llm_meta_text", passed=False, message=msg))
            warnings.append(msg)
            retry_feedbacks.append("Devuelve únicamente el texto traducido sin introducciones, saludos ni notas.")
        else:
            checks.append(ValidationCheck(name="no_llm_meta_text", passed=True, message="Sin meta-comentarios del LLM."))

        # 7. Check UTF-8 / Mojibake encoding
        mojibake_found = False
        for p in self.MOJIBAKE_PATTERNS:
            if p.search(target_text):
                mojibake_found = True
                break
        if mojibake_found:
            msg = "Se detectaron posibles caracteres corruptos de codificación (mojibake)."
            checks.append(ValidationCheck(name="encoding_clean", passed=False, message=msg))
            errors.append(msg)
            retry_feedbacks.append("Asegúrate de emitir codificación UTF-8 limpia con caracteres guaraníes válidos.")
        else:
            checks.append(ValidationCheck(name="encoding_clean", passed=True, message="Codificación de texto limpia y correcta."))

        is_valid = len(errors) == 0
        feedback = "; ".join(retry_feedbacks) if retry_feedbacks else None

        return ValidationResult(
            is_valid=is_valid,
            checks=checks,
            errors=errors,
            warnings=warnings,
            retry_feedback=feedback
        )
