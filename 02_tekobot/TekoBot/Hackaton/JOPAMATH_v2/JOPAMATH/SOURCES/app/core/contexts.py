import re
from enum import Enum
from typing import Optional

class ContextType(str, Enum):
    UI = "UI"
    INSTRUCTION = "INSTRUCTION"
    EXPLANATION = "EXPLANATION"
    HINT = "HINT"
    FEEDBACK = "FEEDBACK"
    DIALOGUE = "DIALOGUE"
    STORY = "STORY"
    MATH_CONTENT = "MATH_CONTENT"
    GENERAL = "GENERAL"

CONTEXT_DESCRIPTIONS = {
    ContextType.UI: "Textos breves de interfaz: botones, etiquetas, navegación.",
    ContextType.INSTRUCTION: "Consignas directas y enunciados de actividades.",
    ContextType.EXPLANATION: "Desarrollo conceptual con tono pedagógico.",
    ContextType.HINT: "Pistas que orientan al estudiante sin resolver el ejercicio.",
    ContextType.FEEDBACK: "Retroalimentación formativa y constructiva ante acierto o error.",
    ContextType.DIALOGUE: "Interacción natural y conversacional entre personajes o tutor.",
    ContextType.STORY: "Narrativa pedagógica o ambientación lúdica.",
    ContextType.MATH_CONTENT: "Contenido con fórmulas, terminología y rigor matemático.",
    ContextType.GENERAL: "Registro estándar neutro."
}

def detect_context(key_path: str = "", text: str = "") -> ContextType:
    """Infer context from key_path and text heuristics."""
    key_lower = key_path.lower()
    text_lower = text.lower()

    # 1. Math formulas / trigonometry takes high priority
    math_patterns = [r"\bsen\(", r"\bcos\(", r"\btan\(", r"hipotenusa", r"cateto", r"\bπ\b", r"\b√", r"\bángulo\b", r"\bradián", r"\bteorema\b"]
    if any(re.search(p, text_lower) for p in math_patterns):
        return ContextType.MATH_CONTENT

    # 2. Key path checks
    if any(k in key_lower for k in ["hint", "pista"]):
        return ContextType.HINT
    if any(k in key_lower for k in ["feedback", "retroalimentacion", "retro"]):
        return ContextType.FEEDBACK
    if any(k in key_lower for k in ["button", "btn", "title", "nav", "label", "menu", "header", "score", "tag"]):
        return ContextType.UI
    if any(k in key_lower for k in ["instruction", "consigna", "instruccion", "prompt", "exercise"]):
        return ContextType.INSTRUCTION
    if any(k in key_lower for k in ["dialogue", "dialogo", "char", "personaje", "chat"]):
        return ContextType.DIALOGUE
    if any(k in key_lower for k in ["story", "historia", "lore", "narrative"]):
        return ContextType.STORY

    # 3. Content heuristics
    if any(p in text_lower for p in ["pista", "recordá que", "fijate en", "observá cómo", "¿necesitás ayuda?"]):
        return ContextType.HINT
    if any(p in text_lower for p in ["¡bien hecho!", "excelente", "incorrecto", "revisá qué", "va bien", "procedimiento"]):
        return ContextType.FEEDBACK
    if any(p in text_lower for p in ["observá", "calculá", "identificá", "completá", "resolvé", "elegí", "marcá"]):
        return ContextType.INSTRUCTION
    if any(p in text_lower for p in ["¡hola", "¿cómo estás?", "profesor", "tutor", "amigo"]):
        return ContextType.DIALOGUE
    if len(text.strip()) < 30 and not any(c in text for c in [".", ";", "\n"]):
        return ContextType.UI

    return ContextType.GENERAL
