from typing import Optional
from app.core.contexts import ContextType, CONTEXT_DESCRIPTIONS
from app.core.glossary import GlossaryConstraints

SYSTEM_PROMPT = """Eres el motor de localización lingüística de MateJopara.
Transforma el texto recibido en una propuesta de jopara pedagógico natural para estudiantes paraguayos.
No traduzcas palabra por palabra.
Conserva significado, intención y dificultad didáctica.
No agregues información ajena al texto original.
No resuelvas ejercicios no resueltos en la entrada.
No modifiques elementos protegidos con el formato [[MJ_PROTECTED_XXXX]].
Respeta rigurosamente los términos marcados como KEEP_SPANISH.
Evita absolutamente los términos marcados como FORBIDDEN.
No inventes deliberadamente neologismos ni terminología técnica guaraní artificial.
Si no existe seguridad sobre una traducción especializada, conserva el término español.
El contexto pedagógico controla el registro.
- HINT debe seguir siendo una pista, no una solución.
- FEEDBACK debe orientar formativamente sin castigar.
- UI debe ser breve y claro.
- MATH_CONTENT debe preservar rigurosamente terminología, números y expresiones.
Devuelve ÚNICAMENTE el contenido localizado, sin encabezados, sin saludos y sin explicaciones."""

def build_user_prompt(
    protected_text: str,
    context: ContextType,
    constraints: GlossaryConstraints,
    retry_feedback: Optional[str] = None
) -> str:
    parts = []
    parts.append(f"CONTEXTO: {context.value} ({CONTEXT_DESCRIPTIONS.get(context, '')})")

    if constraints.keep_spanish:
        parts.append(f"TÉRMINOS OBLIGATORIOS EN ESPAÑOL (KEEP_SPANISH): {', '.join(constraints.keep_spanish)}")

    if constraints.preferred:
        pref_str = ", ".join([f"'{k}' -> '{v}'" for k, v in constraints.preferred.items()])
        parts.append(f"SUGERENCIAS PREFERIDAS: {pref_str}")

    if constraints.forbidden:
        parts.append(f"TÉRMINOS PROHIBIDOS (FORBIDDEN): {', '.join(constraints.forbidden)}")

    if retry_feedback:
        parts.append(f"ATENCIÓN - CORRECCIÓN OBLIGATORIA DEL INTENTO PREVIO: {retry_feedback}")

    parts.append("\nTEXTO A LOCALIZAR:")
    parts.append(protected_text)
    parts.append("\nPROPUESTA EN JOPARA PEDAGÓGICO:")

    return "\n".join(parts)
