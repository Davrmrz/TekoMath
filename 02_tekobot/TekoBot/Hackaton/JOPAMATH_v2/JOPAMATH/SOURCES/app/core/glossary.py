import json
import re
from typing import List, Dict, Optional, Tuple
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database.models import GlossaryItem
from app.core.contexts import ContextType

class GlossaryConstraints(BaseModel):
    keep_spanish: List[str] = []
    preferred: Dict[str, str] = {}
    forbidden: List[str] = []
    matched_term_ids: List[str] = []

class GlossaryService:
    @staticmethod
    def get_constraints(db: Session, context: ContextType, source_text: str) -> GlossaryConstraints:
        """
        Retrieves active glossary constraints relevant to the given source text and context.
        """
        constraints = GlossaryConstraints()
        if not source_text:
            return constraints

        items = db.query(GlossaryItem).all()
        source_lower = source_text.lower()

        for item in items:
            try:
                ctx_list = json.loads(item.contexts_json) if item.contexts_json else ["ALL"]
            except Exception:
                ctx_list = ["ALL"]

            # Check context applicability
            if "ALL" not in ctx_list and context.value not in ctx_list:
                continue

            term_lower = item.source_term.lower().strip()
            term_matches = bool(re.search(rf"\b{re.escape(term_lower)}\b", source_lower))

            if item.status == "KEEP_SPANISH":
                if term_matches:
                    constraints.keep_spanish.append(item.source_term)
                    constraints.matched_term_ids.append(item.id)
            elif item.status in ("PREFERRED", "HUMAN_VALIDATED"):
                if term_matches:
                    constraints.preferred[item.source_term] = item.preferred_output
                    constraints.matched_term_ids.append(item.id)
            elif item.status == "FORBIDDEN":
                # For forbidden, always add to check output
                constraints.forbidden.append(item.preferred_output)
                if term_matches:
                    constraints.matched_term_ids.append(item.id)

        return constraints

    @staticmethod
    def list_items(db: Session, query: Optional[str] = None, status: Optional[str] = None) -> List[GlossaryItem]:
        q = db.query(GlossaryItem)
        if status and status != "ALL":
            q = q.filter(GlossaryItem.status == status)
        if query:
            pattern = f"%{query}%"
            q = q.filter(
                (GlossaryItem.source_term.ilike(pattern)) |
                (GlossaryItem.preferred_output.ilike(pattern)) |
                (GlossaryItem.notes.ilike(pattern))
            )
        return q.order_by(GlossaryItem.source_term.asc()).all()

    @staticmethod
    def add_item(
        db: Session,
        source_term: str,
        preferred_output: str,
        status: str = "PREFERRED",
        contexts: Optional[List[str]] = None,
        sources: Optional[List[str]] = None,
        reason: str = "",
        notes: str = ""
    ) -> GlossaryItem:
        item = GlossaryItem(
            source_term=source_term.strip(),
            preferred_output=preferred_output.strip(),
            status=status,
            contexts_json=json.dumps(contexts or ["ALL"], ensure_ascii=False),
            sources_json=json.dumps(sources or ["MATEJOPARA_GLOSSARY"], ensure_ascii=False),
            reason=reason.strip(),
            notes=notes.strip()
        )
        db.add(item)
        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def update_item(
        db: Session,
        item_id: str,
        source_term: str,
        preferred_output: str,
        status: str,
        contexts: Optional[List[str]] = None,
        sources: Optional[List[str]] = None,
        reason: str = "",
        notes: str = ""
    ) -> Optional[GlossaryItem]:
        item = db.query(GlossaryItem).filter(GlossaryItem.id == item_id).first()
        if not item:
            return None
        item.source_term = source_term.strip()
        item.preferred_output = preferred_output.strip()
        item.status = status
        if contexts is not None:
            item.contexts_json = json.dumps(contexts, ensure_ascii=False)
        if sources is not None:
            item.sources_json = json.dumps(sources, ensure_ascii=False)
        item.reason = reason.strip()
        item.notes = notes.strip()
        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def delete_item(db: Session, item_id: str) -> bool:
        item = db.query(GlossaryItem).filter(GlossaryItem.id == item_id).first()
        if not item:
            return False
        db.delete(item)
        db.commit()
        return True
