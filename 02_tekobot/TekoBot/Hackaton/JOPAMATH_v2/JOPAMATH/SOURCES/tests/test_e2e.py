import json
import hashlib
from pathlib import Path
import pytest
from app.config import settings
from app.database.models import Project, TranslationUnit, TranslationMemory

@pytest.mark.asyncio
async def test_mandatory_22_full_end_to_end_flow(client, db_session):
    # 1. Verify demo file exists and record initial hash
    demo_file = settings.DATA_DIR / "demo" / "demo_es.json"
    assert demo_file.exists(), "demo_es.json must exist"
    initial_demo_hash = hashlib.sha256(demo_file.read_bytes()).hexdigest()

    # 2. Trigger demo load via API
    resp_load = client.post("/api/load-demo", follow_redirects=False)
    assert resp_load.status_code == 303
    redirect_url = resp_load.headers["location"]
    project_id = redirect_url.split("/")[-1]

    # Verify project in DB
    project = db_session.query(Project).filter(Project.id == project_id).first()
    assert project is not None
    assert project.original_filename == "demo_es.json"

    # Verify units created
    units = db_session.query(TranslationUnit).filter(TranslationUnit.project_id == project_id).all()
    assert len(units) > 5

    # 3. Execute batch translation
    resp_batch = client.post(f"/api/projects/{project_id}/translate-all")
    assert resp_batch.status_code == 200
    batch_data = resp_batch.json()
    assert batch_data["processed"] == len(units)
    assert batch_data["errors"] == 0

    # 4. Check units: all protected elements intact
    units_after = db_session.query(TranslationUnit).filter(TranslationUnit.project_id == project_id).all()
    for u in units_after:
        assert u.status in ("AUTO_GENERATED", "TM_MATCH", "NEEDS_REVIEW")
        assert u.target_text != ""
        # Check specific formulas survived
        if "sen(30°)" in u.source_text:
            assert "sen(30°)" in u.target_text
        if "{nombre}" in u.source_text:
            assert "{nombre}" in u.target_text
        if "π/2" in u.source_text:
            assert "π/2" in u.target_text
        if "√3/2" in u.source_text:
            assert "√3/2" in u.target_text

    # 5. Human Approval on a unit
    target_unit = next(u for u in units_after if "{nombre}" in u.source_text)
    resp_approve = client.post(f"/api/units/{target_unit.id}/approve")
    assert resp_approve.status_code == 200
    assert resp_approve.json()["status"] == "HUMAN_VALIDATED"

    # Verify Translation Memory has entry
    tm_entries = db_session.query(TranslationMemory).all()
    assert len(tm_entries) >= 1
    assert any(target_unit.source_text in e.source_text for e in tm_entries)

    # 6. Export Project
    resp_export = client.post(f"/api/projects/{project_id}/export", data={"allow_preliminary": "true"})
    assert resp_export.status_code == 200

    # Verify generated output files
    expected_output = settings.OUTPUT_DIR / "demo_es_jopara.json"
    audit_json = settings.OUTPUT_DIR / "translation_audit.json"
    audit_html = settings.OUTPUT_DIR / "translation_report.html"

    assert expected_output.exists(), "Localized JSON was not created!"
    assert audit_json.exists(), "translation_audit.json was not created!"
    assert audit_html.exists(), "translation_report.html was not created!"

    # Verify exported JSON is valid and preserves keys
    with open(expected_output, "r", encoding="utf-8") as f:
        exported_data = json.load(f)
    assert "navigation" in exported_data
    assert "start_button" in exported_data["navigation"]
    assert "exercises" in exported_data
    assert len(exported_data["exercises"]) == 3

    # Verify audit JSON content
    with open(audit_json, "r", encoding="utf-8") as f:
        audit_data = json.load(f)
    assert audit_data["total_units"] == len(units)
    assert len(audit_data["records"]) == len(units)

    # Verify audit HTML content
    with open(audit_html, "r", encoding="utf-8") as f:
        html_text = f.read()
    assert "Informe de Auditoría y Localización MateJopara" in html_text
    assert "<table" in html_text

    # 7. Verify original demo file is byte-for-byte identical
    post_demo_hash = hashlib.sha256(demo_file.read_bytes()).hexdigest()
    assert initial_demo_hash == post_demo_hash, "Original demo file was modified!"
