import json
import logging
from pathlib import Path
from contextlib import contextmanager
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.config import settings
from app.database.models import Base, GlossaryItem, AppSetting

logger = logging.getLogger(__name__)

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {},
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency for database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@contextmanager
def get_db_context() -> Generator[Session, None, None]:
    """Context manager for background tasks and scripts."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db() -> None:
    """Create all tables and seed default glossary and settings if empty."""
    Base.metadata.create_all(bind=engine)
    seed_starter_glossary()
    seed_default_settings()

def seed_starter_glossary() -> None:
    """Seed data/starter_glossary.json if glossary table is empty."""
    db = SessionLocal()
    try:
        count = db.query(GlossaryItem).count()
        if count == 0 and settings.DATA_DIR.joinpath("starter_glossary.json").exists():
            glossary_file = settings.DATA_DIR / "starter_glossary.json"
            with open(glossary_file, "r", encoding="utf-8") as f:
                items = json.load(f)

            for item in items:
                db_item = GlossaryItem(
                    id=item.get("id"),
                    source_term=item.get("source_term"),
                    preferred_output=item.get("preferred_output"),
                    status=item.get("status", "PREFERRED"),
                    contexts_json=json.dumps(item.get("contexts", ["ALL"]), ensure_ascii=False),
                    sources_json=json.dumps(item.get("sources", ["MATEJOPARA_GLOSSARY"]), ensure_ascii=False),
                    reason=item.get("reason", ""),
                    notes=item.get("notes", "")
                )
                db.add(db_item)
            db.commit()
            logger.info("Starter glossary seeded with %d items.", len(items))
    except Exception as e:
        db.rollback()
        logger.error("Error seeding starter glossary: %s", e)
    finally:
        db.close()

def seed_default_settings() -> None:
    """Seed default runtime settings from environment if not present."""
    db = SessionLocal()
    try:
        defaults = {
            "DEFAULT_PROVIDER": settings.DEFAULT_PROVIDER,
            "GEMINI_MODEL": settings.GEMINI_MODEL,
            "GEMINI_API_KEY": settings.GEMINI_API_KEY,
            "OPENAI_MODEL": settings.OPENAI_MODEL,
            "OPENAI_API_KEY": settings.OPENAI_API_KEY,
            "OPENAI_BASE_URL": settings.OPENAI_BASE_URL,
            "MAX_RETRIES": str(settings.MAX_RETRIES),
            "PROMPT_VERSION": settings.PROMPT_VERSION
        }
        for key, val in defaults.items():
            existing = db.query(AppSetting).filter(AppSetting.key == key).first()
            if not existing:
                db.add(AppSetting(key=key, value=str(val)))
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error("Error seeding default settings: %s", e)
    finally:
        db.close()
