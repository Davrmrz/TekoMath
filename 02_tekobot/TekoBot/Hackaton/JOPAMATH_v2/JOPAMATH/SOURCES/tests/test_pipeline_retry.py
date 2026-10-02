import pytest
from app.core.contexts import ContextType
from app.core.translator import TranslatorCoordinator
from app.database.models import TranslationUnit, Project
from app.providers.mock import MockProvider
from app.providers.base import BaseLLMProvider, ProviderResponse, Tuple_TestResult

class SpyProvider(MockProvider):
    def __init__(self):
        super().__init__()
        self.call_count = 0

    async def translate(self, *args, **kwargs):
        self.call_count += 1
        return await super().translate(*args, **kwargs)

class BrokenOnFirstAttemptProvider(MockProvider):
    """Simulates a provider that fails validation on attempt 0 and fixes it on attempt 1."""
    def __init__(self):
        super().__init__()
        self.attempts_seen = []

    async def translate(self, protected_text, context, constraints, retry_feedback=None, retry_attempt=0):
        self.attempts_seen.append(retry_attempt)
        if retry_attempt == 0 and not retry_feedback:
            # Drop a protected element to cause validation failure
            return ProviderResponse(
                raw_text="Salida alterada sin el marcador",
                provider_name="broken-sim",
                model_name="sim-v1",
                retry_attempt=0
            )
        # Attempt 1: fix after feedback
        return await super().translate(protected_text, context, constraints, retry_feedback, retry_attempt)

class FlakyProvider(BaseLLMProvider):
    """Simulates a provider that crashes on specific items."""
    @property
    def name(self): return "flaky"
    @property
    def is_configured(self): return True
    async def translate(self, protected_text, context, constraints, retry_feedback=None, retry_attempt=0):
        if "CRASH_ME" in protected_text:
            raise RuntimeError("Fallo de conexión simulado con el modelo.")
        return ProviderResponse(raw_text=protected_text, provider_name="flaky", model_name="sim")
    async def test_connection(self):
        return Tuple_TestResult(success=True, message="OK")

@pytest.mark.asyncio
async def test_mandatory_10_automatic_output_never_human_validated(db_session):
    coordinator = TranslatorCoordinator(provider=MockProvider())
    res = await coordinator.translate_single(
        db=db_session,
        source_text="Observá el triángulo.",
        context=ContextType.INSTRUCTION
    )
    # MUST be AUTO_GENERATED, never HUMAN_VALIDATED
    assert res.status == "AUTO_GENERATED"
    assert res.status != "HUMAN_VALIDATED"

@pytest.mark.asyncio
async def test_mandatory_11_human_approval_creates_human_validated(db_session, client):
    # Create project and unit
    proj = Project(name="Test Proj", original_filename="test.json", file_format="json")
    db_session.add(proj)
    db_session.commit()

    unit = TranslationUnit(
        project_id=proj.id,
        key_path="p1",
        source_text="Comenzar",
        target_text="Eñepyrũ",
        context="UI",
        status="AUTO_GENERATED"
    )
    db_session.add(unit)
    db_session.commit()

    # Trigger human approval endpoint
    resp = client.post(f"/api/units/{unit.id}/approve")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "HUMAN_VALIDATED"

    # Verify unit in DB has status HUMAN_VALIDATED
    db_session.refresh(unit)
    assert unit.status == "HUMAN_VALIDATED"

@pytest.mark.asyncio
async def test_mandatory_16_retry_repairs_output(db_session):
    repairing_provider = BrokenOnFirstAttemptProvider()
    coordinator = TranslatorCoordinator(provider=repairing_provider, max_retries=2)

    source = "Calculá sen(30°)."
    res = await coordinator.translate_single(
        db=db_session,
        source_text=source,
        context=ContextType.MATH_CONTENT
    )

    # Verifies retry occurred and succeeded
    assert res.status == "AUTO_GENERATED"
    assert "sen(30°)" in res.target_text
    assert len(repairing_provider.attempts_seen) > 1
    assert res.retry_count >= 1

@pytest.mark.asyncio
async def test_mandatory_15_provider_error_does_not_break_batch(db_session):
    proj = Project(name="Batch Proj", original_filename="test.json", file_format="json")
    db_session.add(proj)
    db_session.commit()

    u1 = TranslationUnit(project_id=proj.id, key_path="k1", source_text="Texto normal 1", status="NEW")
    u2 = TranslationUnit(project_id=proj.id, key_path="k2", source_text="CRASH_ME error fatal", status="NEW")
    u3 = TranslationUnit(project_id=proj.id, key_path="k3", source_text="Texto normal 2", status="NEW")
    db_session.add_all([u1, u2, u3])
    db_session.commit()

    coordinator = TranslatorCoordinator(provider=FlakyProvider())
    stats = await coordinator.translate_batch(db=db_session, units=[u1, u2, u3])

    assert stats["processed"] == 3
    assert stats["errors"] == 1
    assert stats["auto_generated"] == 2

    db_session.refresh(u2)
    assert u2.status == "VALIDATION_ERROR"
    assert "Fallo de conexión" in u2.validation_error

@pytest.mark.asyncio
async def test_mandatory_18_batch_deduplication(db_session):
    proj = Project(name="Dedup Proj", original_filename="test.json", file_format="json")
    db_session.add(proj)
    db_session.commit()

    units = [
        TranslationUnit(project_id=proj.id, key_path=f"btn_{i}", source_text="Volver al inicio", context="UI", status="NEW")
        for i in range(10)
    ]
    db_session.add_all(units)
    db_session.commit()

    spy = SpyProvider()
    coordinator = TranslatorCoordinator(provider=spy)
    stats = await coordinator.translate_batch(db=db_session, units=units)

    # 10 identical units should only call provider once, 9 reused from cache
    assert stats["processed"] == 10
    assert stats["reused_duplicates"] == 9
    assert spy.call_count == 1
