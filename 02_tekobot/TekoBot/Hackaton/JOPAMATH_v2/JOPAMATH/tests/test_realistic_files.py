import csv
import io
import json
from pathlib import Path
from app.config import settings
from app.database.models import Project, TranslationUnit


def test_realistic_web_i18n_http_flow(client, db_session):
    original = {
        "home.title": "Bienvenido a MateJopara",
        "home.start": "Comenzar",
        "exercise.retry": "Intentá nuevamente",
        "nested": {"hint.text": "Necesito una pista"}
    }
    raw = json.dumps(original, ensure_ascii=False).encode("utf-8")
    resp = client.post(
        "/api/upload",
        files={"file": ("web_es_regression.json", raw, "application/json")},
        data={"project_name": "Web Regression"},
        follow_redirects=False,
    )
    assert resp.status_code == 303
    project_id = resp.headers["location"].rsplit("/", 1)[-1]
    units = db_session.query(TranslationUnit).filter(TranslationUnit.project_id == project_id).all()
    assert len(units) == 4
    assert {u.key_path for u in units} >= {"/home.title", "/home.start", "/exercise.retry", "/nested/hint.text"}

    translated = client.post(f"/api/projects/{project_id}/translate-all")
    assert translated.status_code == 200
    assert translated.json()["processed"] == 4

    exported = client.post(f"/api/projects/{project_id}/export", data={"allow_preliminary": "true"})
    assert exported.status_code == 200
    out_path = settings.OUTPUT_DIR / "web_es_regression_jopara.json"
    data = json.loads(out_path.read_text(encoding="utf-8"))
    assert list(data.keys()) == list(original.keys())
    assert "title" not in data
    assert set(data["nested"].keys()) == {"hint.text"}
    assert all(isinstance(v, str) and v for k, v in data.items() if k != "nested")


def test_realistic_game_multicolumn_csv_http_flow(client, db_session):
    raw = (
        "id,personaje,contexto,dialogo,pregunta,respuesta_a,respuesta_b,pista\n"
        "1,Tutor,DIALOGUE,Hola,¿Cuánto es 2+2?,Cuatro,Cinco,Sumá dos más dos\n"
    ).encode("utf-8")
    resp = client.post(
        "/api/upload",
        files={"file": ("game_regression.csv", raw, "text/csv")},
        data={"project_name": "Game Regression", "source_columns": "dialogo,pregunta,respuesta_a,respuesta_b,pista"},
        follow_redirects=False,
    )
    assert resp.status_code == 303
    project_id = resp.headers["location"].rsplit("/", 1)[-1]
    units = db_session.query(TranslationUnit).filter(TranslationUnit.project_id == project_id).all()
    assert len(units) == 5
    assert {u.key_path for u in units} == {
        "row_0:dialogo", "row_0:pregunta", "row_0:respuesta_a", "row_0:respuesta_b", "row_0:pista"
    }

    translated = client.post(f"/api/projects/{project_id}/translate-all")
    assert translated.status_code == 200
    assert translated.json()["processed"] == 5

    exported = client.post(f"/api/projects/{project_id}/export", data={"allow_preliminary": "true"})
    assert exported.status_code == 200
    out_path = settings.OUTPUT_DIR / "game_regression_jopara.csv"
    with open(out_path, "r", encoding="utf-8-sig", newline="") as f:
        rows = list(csv.DictReader(f))
    assert len(rows) == 1
    row = rows[0]
    for col in ["dialogo", "pregunta", "respuesta_a", "respuesta_b", "pista"]:
        assert f"jopara_{col}" in row
        assert row[f"jopara_{col}"]
