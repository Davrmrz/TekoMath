import pytest
from app.core.protector import ContentProtector

def test_mandatory_1_sen_30_preserved():
    protector = ContentProtector()
    text = "Calculá sen(30°) para continuar la lección."
    res = protector.protect(text)

    assert "sen(30°)" not in res.protected_text
    assert "[[MJ_PROTECTED_" in res.protected_text

    # Restoration
    restored = protector.restore(res.protected_text, res.item_map)
    assert restored == text
    assert "sen(30°)" in restored

def test_mandatory_2_pi_halves_preserved():
    protector = ContentProtector()
    text = "El ángulo equivale a π/2 radianes."
    res = protector.protect(text)

    assert "π/2" not in res.protected_text
    restored = protector.restore(res.protected_text, res.item_map)
    assert restored == text
    assert "π/2" in restored

def test_mandatory_3_sqrt_preserved():
    protector = ContentProtector()
    text = "El valor obtenido es √3/2."
    res = protector.protect(text)

    assert "√3/2" not in res.protected_text
    restored = protector.restore(res.protected_text, res.item_map)
    assert restored == text
    assert "√3/2" in restored

def test_mandatory_4_placeholder_nombre_preserved():
    protector = ContentProtector()
    text = "Hola, {nombre}. Resolvé el ejercicio."
    res = protector.protect(text)

    assert "{nombre}" not in res.protected_text
    restored = protector.restore(res.protected_text, res.item_map)
    assert restored == text
    assert "{nombre}" in restored

def test_mandatory_5_url_preserved():
    protector = ContentProtector()
    text = "Consulta más pistas en https://matejopara.edu.py/ayuda y finaliza."
    res = protector.protect(text)

    assert "https://matejopara.edu.py/ayuda" not in res.protected_text
    restored = protector.restore(res.protected_text, res.item_map)
    assert restored == text
    assert "https://matejopara.edu.py/ayuda" in restored

def test_various_placeholders_and_katex():
    protector = ContentProtector()
    text = "Usuario {{user}} tiene %score% puntos en [player_name] con fórmula $\\frac{x}{2}$."
    res = protector.protect(text)

    assert "{{user}}" not in res.protected_text
    assert "%score%" not in res.protected_text
    assert "[player_name]" not in res.protected_text
    assert "$\\frac{x}{2}$" not in res.protected_text

    restored = protector.restore(res.protected_text, res.item_map)
    assert restored == text

def test_powers_and_equations():
    protector = ContentProtector()
    text = "Si x² + 2 = 11, entonces sen(α) = 3/5."
    res = protector.protect(text)
    restored = protector.restore(res.protected_text, res.item_map)
    assert restored == text

def test_restoration_resilient_to_llm_whitespace():
    protector = ContentProtector()
    text = "Hola, {nombre}."
    res = protector.protect(text)
    token = list(res.item_map.keys())[0]

    # Simulate LLM adding spaces inside token: [[ MJ_PROTECTED_0001 ]]
    simulated_llm_out = f"Mba'éichapa, [[ MJ_PROTECTED_0001 ]]."
    restored = protector.restore(simulated_llm_out, res.item_map)
    assert "{nombre}" in restored
    assert restored == "Mba'éichapa, {nombre}."
