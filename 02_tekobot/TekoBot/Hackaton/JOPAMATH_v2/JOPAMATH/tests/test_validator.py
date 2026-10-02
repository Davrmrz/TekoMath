import pytest
from app.core.validator import ContentValidator

def test_mandatory_7_keep_spanish_respected():
    validator = ContentValidator()
    source = "Identificá la hipotenusa y el cateto opuesto del triángulo."

    # Valid output: keeps "hipotenusa" and "cateto opuesto"
    valid_target = "Ehechakuaa la hipotenusa ha cateto opuesto triángulo rehegua."
    res_valid = validator.validate(
        source_text=source,
        target_text=valid_target,
        protected_item_map={},
        keep_spanish_terms=["hipotenusa", "cateto opuesto"]
    )
    assert res_valid.is_valid is True

    # Invalid output: translated or altered "hipotenusa" into made-up term
    invalid_target = "Ehechakuaa la tekotee ha cateto opuesto ko'ápe."
    res_invalid = validator.validate(
        source_text=source,
        target_text=invalid_target,
        protected_item_map={},
        keep_spanish_terms=["hipotenusa", "cateto opuesto"]
    )
    assert res_invalid.is_valid is False
    assert any("hipotenusa" in err for err in res_invalid.errors)

def test_mandatory_8_forbidden_term_detected():
    validator = ContentValidator()
    source = "Calculá el valor del ángulo."

    # Clean target
    clean_target = "Ecalcula ángulo repy."
    res_clean = validator.validate(
        source_text=source,
        target_text=clean_target,
        protected_item_map={},
        forbidden_terms=["termino_arcaico_prohibido"]
    )
    assert res_clean.is_valid is True

    # Target containing forbidden word
    forbidden_target = "Ecalcula termino_arcaico_prohibido repy."
    res_forbidden = validator.validate(
        source_text=source,
        target_text=forbidden_target,
        protected_item_map={},
        forbidden_terms=["termino_arcaico_prohibido"]
    )
    assert res_forbidden.is_valid is False
    assert any("termino_arcaico_prohibido" in err for err in res_forbidden.errors)

def test_mandatory_20_utf8_guarani_characters_and_puso():
    validator = ContentValidator()
    source = "Bienvenido a la clase."
    # Guaraní nasal vowels: ã, ẽ, ĩ, õ, ũ, ỹ, ñ, and the puso (glottal stop ’)
    guarani_target = "Tereg̃uahẽ porãite! Mba'éichapa reiko? Ñañembo'e hag̃ua: ã, ẽ, ĩ, õ, ũ, ỹ."

    res = validator.validate(
        source_text=source,
        target_text=guarani_target,
        protected_item_map={}
    )
    assert res.is_valid is True
    assert "ñ" in guarani_target
    assert "ã" in guarani_target
    assert "ẽ" in guarani_target
    assert "ĩ" in guarani_target
    assert "õ" in guarani_target
    assert "ũ" in guarani_target
    assert "ỹ" in guarani_target
    assert "'" in guarani_target or "’" in guarani_target

def test_unrestored_tokens_detected():
    validator = ContentValidator()
    source = "Calculá sen(30°)."
    target_with_token = "Ecalcula [[MJ_PROTECTED_0001]]."
    res = validator.validate(
        source_text=source,
        target_text=target_with_token,
        protected_item_map={"[[MJ_PROTECTED_0001]]": "sen(30°)"}
    )
    assert res.is_valid is False
    assert any("tokens de protección sin restaurar" in err for err in res.errors)

def test_missing_protected_value_detected():
    validator = ContentValidator()
    source = "Hola, {nombre}."
    target_without_placeholder = "Mba'éichapa, amigo."
    res = validator.validate(
        source_text=source,
        target_text=target_without_placeholder,
        protected_item_map={"[[MJ_PROTECTED_0001]]": "{nombre}"}
    )
    assert res.is_valid is False
    assert any("{nombre}" in err for err in res.errors)
