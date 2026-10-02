import pytest
from app.core.memory import MemoryService
from app.core.glossary import GlossaryService
from app.core.contexts import ContextType
from app.core.translator import TranslatorCoordinator
from app.providers.mock import MockProvider

class SpyProvider(MockProvider):
    def __init__(self):
        super().__init__()
        self.call_count = 0

    async def translate(self, *args, **kwargs):
        self.call_count += 1
        return await super().translate(*args, **kwargs)

@pytest.mark.asyncio
async def test_mandatory_9_tm_exact_match_prevents_provider_call(db_session):
    # 1. Pre-store an approved translation into TM
    source_text = "Comenzar la aventura matemática"
    approved_target = "Eñepyrũ aventura matemática rehegua"
    context = "UI"

    MemoryService.store(
        db=db_session,
        source_text=source_text,
        target_text=approved_target,
        context=context,
        approved_by="linguist_evaluator"
    )

    # 2. Setup coordinator with SpyProvider
    spy = SpyProvider()
    coordinator = TranslatorCoordinator(provider=spy)

    # 3. Translate the exact same text and context
    result = await coordinator.translate_single(
        db=db_session,
        source_text=source_text,
        context=ContextType.UI
    )

    # 4. Assert TM_MATCH was returned and Provider was NOT called
    assert result.status == "TM_MATCH"
    assert result.target_text == approved_target
    assert spy.call_count == 0, f"Expected 0 calls to provider, but got {spy.call_count}"

def test_mandatory_21_sqlite_persistence(tmp_path):
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from app.database.models import Base, GlossaryItem, TranslationMemory

    db_file = tmp_path / "persistence_test.db"
    db_url = f"sqlite:///{db_file}"

    # Initial session 1: create tables and insert data
    engine1 = create_engine(db_url)
    Base.metadata.create_all(bind=engine1)
    Session1 = sessionmaker(bind=engine1)
    s1 = Session1()

    GlossaryService.add_item(
        db=s1,
        source_term="tangente",
        preferred_output="tangente",
        status="KEEP_SPANISH",
        reason="Trigonometría MEC"
    )
    MemoryService.store(
        db=s1,
        source_text="Ver ayuda",
        target_text="Ehecha pytyvõ",
        context="UI"
    )
    s1.close()
    engine1.dispose()

    # Re-open session 2 (simulating app restart)
    engine2 = create_engine(db_url)
    Session2 = sessionmaker(bind=engine2)
    s2 = Session2()

    # Verify persisted glossary item
    items = GlossaryService.list_items(s2, query="tangente")
    assert len(items) == 1
    assert items[0].source_term == "tangente"
    assert items[0].status == "KEEP_SPANISH"

    # Verify persisted translation memory
    tm_match = MemoryService.lookup_exact(s2, "Ver ayuda", "UI")
    assert tm_match is not None
    assert tm_match.target_text == "Ehecha pytyvõ"
    s2.close()
    engine2.dispose()
