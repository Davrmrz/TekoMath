import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy import (
    Column, String, Text, Integer, Float, Boolean, DateTime, ForeignKey, Index
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

def utcnow() -> datetime:
    return datetime.now(timezone.utc)

class Project(Base):
    __tablename__ = "projects"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_format = Column(String(20), nullable=False)  # "json", "csv", "txt"
    raw_metadata = Column(Text, nullable=True)         # JSON-serialized layout
    delimiter = Column(String(10), nullable=True, default=",")
    source_column = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    units = relationship("TranslationUnit", back_populates="project", cascade="all, delete-orphan")

class TranslationUnit(Base):
    __tablename__ = "translation_units"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    item_index = Column(Integer, nullable=False, default=0)
    key_path = Column(String(255), nullable=False)
    source_text = Column(Text, nullable=False)
    target_text = Column(Text, nullable=False, default="")
    context = Column(String(50), nullable=False, default="GENERAL")
    status = Column(String(50), nullable=False, default="NEW")
    # NEW | TM_MATCH | AUTO_GENERATED | NEEDS_REVIEW | VALIDATION_ERROR | HUMAN_VALIDATED | REJECTED

    provider_used = Column(String(50), nullable=True)
    model_used = Column(String(50), nullable=True)

    protected_items_json = Column(Text, nullable=True, default="{}")
    validation_json = Column(Text, nullable=True, default="{}")
    validation_error = Column(Text, nullable=True)
    human_edited = Column(Boolean, default=False)
    glossary_terms_json = Column(Text, nullable=True, default="[]")
    sources_json = Column(Text, nullable=True, default="[]")
    retry_count = Column(Integer, default=0)

    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    project = relationship("Project", back_populates="units")

    __table_args__ = (
        Index("idx_proj_status", "project_id", "status"),
    )

class GlossaryItem(Base):
    __tablename__ = "glossary_items"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    source_term = Column(String(255), nullable=False, index=True)
    preferred_output = Column(String(255), nullable=False)
    status = Column(String(50), nullable=False, default="PREFERRED")
    # HUMAN_VALIDATED | PREFERRED | KEEP_SPANISH | FORBIDDEN | CANDIDATE
    contexts_json = Column(Text, nullable=False, default='["ALL"]')
    sources_json = Column(Text, nullable=False, default='["MATEJOPARA_GLOSSARY"]')
    reason = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

class TranslationMemory(Base):
    __tablename__ = "translation_memory"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    source_hash = Column(String(64), nullable=False, index=True)
    source_text = Column(Text, nullable=False)
    target_text = Column(Text, nullable=False)
    context = Column(String(50), nullable=False, default="GENERAL")
    status = Column(String(50), nullable=False, default="HUMAN_VALIDATED")
    approved_by = Column(String(100), default="human_reviewer")
    quality_score = Column(Float, default=1.0)
    created_at = Column(DateTime, default=utcnow)

    __table_args__ = (
        Index("idx_tm_hash_ctx", "source_hash", "context"),
    )

class AppSetting(Base):
    __tablename__ = "app_settings"

    key = Column(String(100), primary_key=True)
    value = Column(Text, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)
