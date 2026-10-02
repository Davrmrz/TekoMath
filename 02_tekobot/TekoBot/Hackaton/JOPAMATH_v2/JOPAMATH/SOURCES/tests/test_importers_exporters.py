import json
import hashlib
from pathlib import Path
import pytest
from app.importers import get_importer_for_file
from app.exporters import export_project, evaluate_project_export_readiness
from app.database.models import Project, TranslationUnit

def test_mandatory_6_and_12_json_structure_and_keys_intact(tmp_path):
    original_dict = {
        "menu": {
            "btn_start": "Comenzar",
            "btn_retry": "Intentá nuevamente"
        },
        "score_limit": 100,
        "is_active": True,
        "items": ["Pista 1", "Pista 2"]
    }
    raw_bytes = json.dumps(original_dict, ensure_ascii=False, indent=2).encode("utf-8")

    importer = get_importer_for_file("test.json")
    import_res = importer.parse(raw_bytes, "test.json")

    assert len(import_res.items) == 4
    assert any(it.key_path == "menu.btn_start" for it in import_res.items)
    assert any(it.key_path == "items[0]" for it in import_res.items)

    # Simulate localized project and units
    proj = Project(
        name="JSON Test",
        original_filename="test.json",
        file_format="json",
        raw_metadata=json.dumps(import_res.raw_metadata, ensure_ascii=False)
    )
    units = [
        TranslationUnit(key_path="menu.btn_start", source_text="Comenzar", target_text="Eñepyrũ", status="HUMAN_VALIDATED"),
        TranslationUnit(key_path="menu.btn_retry", source_text="Intentá nuevamente", target_text="Eha'ã jey", status="HUMAN_VALIDATED"),
        TranslationUnit(key_path="items[0]", source_text="Pista 1", target_text="Pista peteĩha", status="HUMAN_VALIDATED"),
        TranslationUnit(key_path="items[1]", source_text="Pista 2", target_text="Pista mokõiha", status="HUMAN_VALIDATED")
    ]

    export_res = export_project(proj, units, tmp_path, allow_preliminary=False)
    output_path = Path(export_res.output_filepath)
    assert output_path.exists()

    with open(output_path, "r", encoding="utf-8") as f:
        exported_dict = json.load(f)

    # 6. Keys strictly identical
    assert list(exported_dict.keys()) == list(original_dict.keys())
    assert list(exported_dict["menu"].keys()) == list(original_dict["menu"].keys())
    assert exported_dict["score_limit"] == 100
    assert exported_dict["is_active"] is True

    # 12. Localized string values updated
    assert exported_dict["menu"]["btn_start"] == "Eñepyrũ"
    assert exported_dict["items"][0] == "Pista peteĩha"

def test_mandatory_13_csv_preserves_columns(tmp_path):
    csv_content = "id,categoria,texto_es,dificultad\n1,Mat,Calculá sen(30°),Fácil\n2,Geo,Observá el triángulo,Media\n".encode("utf-8")

    importer = get_importer_for_file("dialogos.csv")
    res = importer.parse(csv_content, "dialogos.csv")

    assert len(res.items) == 2
    assert res.detected_source_column == "texto_es"

    proj = Project(
        name="CSV Test",
        original_filename="dialogos.csv",
        file_format="csv",
        raw_metadata=json.dumps(res.raw_metadata, ensure_ascii=False)
    )
    units = [
        TranslationUnit(key_path="row_0:texto_es", source_text="Calculá sen(30°)", target_text="Ecalcula sen(30°)", status="HUMAN_VALIDATED"),
        TranslationUnit(key_path="row_1:texto_es", source_text="Observá el triángulo", target_text="Emaña triángulo rehe", status="HUMAN_VALIDATED")
    ]

    export_res = export_project(proj, units, tmp_path)
    output_path = Path(export_res.output_filepath)
    assert output_path.exists()

    with open(output_path, "r", encoding="utf-8-sig") as f:
        lines = f.readlines()

    header = lines[0].strip().split(",")
    # All original columns preserved + jopara column added
    assert "id" in header
    assert "categoria" in header
    assert "texto_es" in header
    assert "dificultad" in header
    assert "jopara" in header
    assert "Ecalcula sen(30°)" in lines[1]

def test_mandatory_14_txt_processing(tmp_path):
    txt_content = "Línea 1 en español.\n\nLínea 2 con fórmula sen(30°).\n".encode("utf-8")
    importer = get_importer_for_file("doc.txt")
    res = importer.parse(txt_content, "doc.txt")

    assert len(res.items) == 2

    proj = Project(
        name="TXT Test",
        original_filename="doc.txt",
        file_format="txt",
        raw_metadata=json.dumps(res.raw_metadata, ensure_ascii=False)
    )
    units = [
        TranslationUnit(key_path="line_1", source_text="Línea 1 en español.", target_text="Mbo'epy peteĩha.", status="HUMAN_VALIDATED"),
        TranslationUnit(key_path="line_3", source_text="Línea 2 con fórmula sen(30°).", target_text="Mbo'epy mokõiha fórmula sen(30°).", status="HUMAN_VALIDATED")
    ]

    export_res = export_project(proj, units, tmp_path)
    output_path = Path(export_res.output_filepath)
    assert output_path.exists()

    with open(output_path, "r", encoding="utf-8") as f:
        content = f.read()

    assert "Mbo'epy peteĩha." in content
    assert "sen(30°)" in content

def test_mandatory_17_validation_error_blocks_production(tmp_path):
    proj = Project(name="Error Proj", original_filename="doc.txt", file_format="txt", raw_metadata='{"raw_lines": ["texto"]}')
    units = [
        TranslationUnit(key_path="line_1", source_text="Hola", target_text="", status="VALIDATION_ERROR", validation_error="Texto vacío")
    ]

    # Without allow_preliminary, must raise ValueError
    with pytest.raises(ValueError, match="Exportación bloqueada"):
        export_project(proj, units, tmp_path, allow_preliminary=False)

    # With allow_preliminary=True, allows preliminary export
    res = export_project(proj, units, tmp_path, allow_preliminary=True)
    assert res.is_preliminary is True

def test_mandatory_19_original_file_strictly_unmodified(tmp_path):
    orig_file = tmp_path / "original.json"
    content = b'{"clave": "Valor original intacto", "formula": "sen(30\xc2\xb0)"}'
    orig_file.write_bytes(content)
    orig_hash = hashlib.sha256(orig_file.read_bytes()).hexdigest()

    importer = get_importer_for_file("original.json")
    res = importer.parse(orig_file.read_bytes(), "original.json")

    proj = Project(
        name="Integrity Check",
        original_filename="original.json",
        file_format="json",
        raw_metadata=json.dumps(res.raw_metadata)
    )
    units = [
        TranslationUnit(key_path="clave", source_text="Valor original intacto", target_text="Valor pyahu", status="HUMAN_VALIDATED"),
        TranslationUnit(key_path="formula", source_text="sen(30°)", target_text="sen(30°)", status="HUMAN_VALIDATED")
    ]

    out_dir = tmp_path / "output"
    out_dir.mkdir()
    export_project(proj, units, out_dir)

    # Verify original file byte-for-byte sha256 hash has not changed at all
    post_hash = hashlib.sha256(orig_file.read_bytes()).hexdigest()
    assert orig_hash == post_hash, "El archivo original fue alterado!"
