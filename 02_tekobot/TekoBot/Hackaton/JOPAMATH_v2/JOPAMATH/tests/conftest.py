import os
import sys
import tempfile
import pytest
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

# Ensure workspace root is in sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from app.config import settings
from app.database.models import Base, GlossaryItem, TranslationMemory, Project, TranslationUnit
from app.database.connection import get_db
from app.main import app

@pytest.fixture(scope="session")
def test_engine():
    # Use SQLite in-memory or a temporary db file for tests
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    return engine

@pytest.fixture(scope="function")
def db_session(test_engine):
    connection = test_engine.connect()
    transaction = connection.begin()
    Session = sessionmaker(bind=connection)
    session = Session()

    # Seed initial test glossary items
    starter_items = [
        GlossaryItem(
            id="g_test_1",
            source_term="seno",
            preferred_output="seno",
            status="KEEP_SPANISH",
            contexts_json='["MATH_CONTENT", "ALL"]',
            sources_json='["MEC_STUDENT"]',
            reason="Término curricular trigonométrico"
        ),
        GlossaryItem(
            id="g_test_2",
            source_term="hipotenusa",
            preferred_output="hipotenusa",
            status="KEEP_SPANISH",
            contexts_json='["MATH_CONTENT", "ALL"]',
            sources_json='["MEC_STUDENT"]',
            reason="Término curricular"
        ),
        GlossaryItem(
            id="g_test_3",
            source_term="cateto opuesto",
            preferred_output="cateto opuesto",
            status="KEEP_SPANISH",
            contexts_json='["MATH_CONTENT", "ALL"]',
            sources_json='["MEC_STUDENT"]',
            reason="Término curricular"
        ),
        GlossaryItem(
            id="g_test_4",
            source_term="triángulo",
            preferred_output="triángulo",
            status="PREFERRED",
            contexts_json='["ALL"]',
            sources_json='["PARAGUAYAN_SPANISH"]',
            reason="Uso natural en jopara escolar"
        ),
        GlossaryItem(
            id="g_test_5",
            source_term="palabra_prohibida_test",
            preferred_output="termino_arcaico_prohibido",
            status="FORBIDDEN",
            contexts_json='["ALL"]',
            sources_json='["MATEJOPARA_GLOSSARY"]',
            reason="Demostración de término FORBIDDEN"
        )
    ]
    for item in starter_items:
        session.add(item)
    session.commit()

    yield session

    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
