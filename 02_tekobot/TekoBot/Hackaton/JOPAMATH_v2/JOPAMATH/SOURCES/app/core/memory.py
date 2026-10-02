import hashlib
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from app.database.models import TranslationMemory

class MemoryService:
    @staticmethod
    def compute_hash(source_text: str, context: str) -> str:
        """Normalized hash of text + context for exact retrieval."""
        normalized = f"{source_text.strip().lower()}||{context.strip().upper()}"
        return hashlib.sha256(normalized.encode("utf-8")).hexdigest()

    @classmethod
    def lookup_exact(cls, db: Session, source_text: str, context: str) -> Optional[TranslationMemory]:
        """
        Looks up an exact HUMAN_VALIDATED match in translation memory.
        If found, avoids LLM call and returns match.
        """
        if not source_text or not source_text.strip():
            return None
        h = cls.compute_hash(source_text, context)
        match = db.query(TranslationMemory).filter(
            TranslationMemory.source_hash == h,
            TranslationMemory.status == "HUMAN_VALIDATED"
        ).order_by(TranslationMemory.created_at.desc()).first()
        return match

    @classmethod
    def store(
        cls,
        db: Session,
        source_text: str,
        target_text: str,
        context: str,
        approved_by: str = "human_reviewer"
    ) -> TranslationMemory:
        """
        Stores an approved human translation into translation memory.
        Updates existing entry if hash matches.
        """
        h = cls.compute_hash(source_text, context)
        existing = db.query(TranslationMemory).filter(
            TranslationMemory.source_hash == h
        ).first()

        if existing:
            existing.target_text = target_text
            existing.status = "HUMAN_VALIDATED"
            existing.approved_by = approved_by
            db.commit()
            db.refresh(existing)
            return existing

        tm_entry = TranslationMemory(
            source_hash=h,
            source_text=source_text.strip(),
            target_text=target_text.strip(),
            context=context.strip().upper(),
            status="HUMAN_VALIDATED",
            approved_by=approved_by,
            quality_score=1.0
        )
        db.add(tm_entry)
        db.commit()
        db.refresh(tm_entry)
        return tm_entry

    @staticmethod
    def list_entries(db: Session, query: Optional[str] = None) -> List[TranslationMemory]:
        q = db.query(TranslationMemory)
        if query:
            pat = f"%{query}%"
            q = q.filter((TranslationMemory.source_text.ilike(pat)) | (TranslationMemory.target_text.ilike(pat)))
        return q.order_by(TranslationMemory.created_at.desc()).all()

    @staticmethod
    def delete_entry(db: Session, entry_id: str) -> bool:
        entry = db.query(TranslationMemory).filter(TranslationMemory.id == entry_id).first()
        if not entry:
            return False
        db.delete(entry)
        db.commit()
        return True
