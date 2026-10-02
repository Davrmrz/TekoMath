import re
from typing import Optional, Dict
from app.core.contexts import ContextType
from app.core.glossary import GlossaryConstraints
from app.providers.base import BaseLLMProvider, ProviderResponse, Tuple_TestResult

class MockProvider(BaseLLMProvider):
    """
    Offline, deterministic, pedagogical mock localization engine.
    Allows complete application operation and automated tests without an API key or internet.
    """

    EXACT_MAPPINGS: Dict[str, str] = {
        "Comenzar": "Eñepyrũ",
        "Volver al inicio": "Ejevy ñepyrũme",
        "Intentá nuevamente": "Eha'ã jey",
        "Necesito una pista": "Aikotevẽ peteĩ pista",
        "Observá el triángulo.": "Emaña triángulo rehe.",
        "Identificá la hipotenusa.": "Ehechakuaa la hipotenusa.",
        "MateJopara - Aprendizaje de Matemática": "MateJopara - Mbo'epy Matemática rehegua",
        "Guardar y continuar": "Eñongatu ha esegi",
        "¡Bienvenido a MateJopara!": "¡Tereg̃uahẽ porãite MateJopara-pe!",
    }

    VERB_REPLACEMENTS = [
        (r"\bObservá con atención\b", "Emaña porãke"),
        (r"\bObservá\b", "Emaña"),
        (r"\bCalculá el valor de\b", "Ecalcula valor"),
        (r"\bCalculá\b", "Ecalcula"),
        (r"\bIdentificá\b", "Ehechakuaa"),
        (r"\bRecordá que\b", "Nemandu'áke"),
        (r"\bVerificá\b", "Everifika"),
        (r"\bRevisá\b", "Ehecha jey"),
        (r"\bHola,\b", "Mba'éichapa,"),
        (r"\bSi necesitás una pista\b", "Reikotevẽramo peteĩ pista"),
        (r"\bhacé clic en el botón de ayuda\b", "ecliquea botón pytyvõ reheguápe"),
        (r"\bExcelente trabajo:\b", "Tembiapo porãite:"),
        (r"\bExcelente deducción.\b", "Ehesa'ỹijo porãite."),
        (r"\bVisitá\b", "Eike"),
        (r"\bPara más detalles visita\b", "Reikuaave hag̃ua eike"),
        (r"\bcon tu usuario\b", "nde usuario ndive"),
        (r"\bpara ver tu progreso\b", "rehecha hag̃ua nde progreso"),
        (r"\bpara desbloquear la siguiente lección\b", "emboguejy hag̃ua mbo'epy oúva"),
        (r"\bmide exactamente\b", "omedi porãite"),
        (r"\bunidades y el\b", "unidades ha la"),
        (r"\by el cateto opuesto mide\b", "ha cateto opuesto katu omedi"),
        (r"\bLa hipotenusa mide\b", "La hipotenusa omedi"),
        (r"\bFijate en el lado opuesto al ángulo recto.\b", "Emaña ángulo recto renondépe."),
        (r"\bAhora aplicá la fórmula\b", "Ko'ág̃a eipuru la fórmula"),
        (r"\bpara continuar\b", "resegi hag̃ua"),
        (r"\b¡Bienvenido a la clase de geometría!\b", "¡Tereg̃uahẽ porã geometría mbo'epýpe!"),
        (r"\bProfesor, ¿cuánto vale la hipotenusa de este triángulo\?\b", "Mbo'ehára, ¿mboýpa ovale ko triángulo hipotenusa?"),
        (r"\bTu procedimiento va bien.\b", "Nde procedimiento oho porã."),
        (r"\bRevisá qué lado está frente al ángulo.\b", "Ehecha jey máva ládopa oĩ ángulo renondépe."),
        (r"\bsabiendo que el\b", "reikuaávo la"),
        (r"\bcateto adyacente mide\b", "cateto adyacente omedi"),
        (r"\by la hipotenusa mide\b", "ha hipotenusa katu omedi"),
        (r"\bSi el cateto opuesto mide\b", "Cateto opuesto omedíramo"),
        (r"\bha cateto opuesto\b", "ha cateto opuesto"),
        (r"\bPuntaje actual:\b", "Puntaje ko'ág̃agua:"),
    ]

    @property
    def name(self) -> str:
        return "mock"

    @property
    def is_configured(self) -> bool:
        return True

    async def translate(
        self,
        protected_text: str,
        context: ContextType,
        constraints: GlossaryConstraints,
        retry_feedback: Optional[str] = None,
        retry_attempt: int = 0
    ) -> ProviderResponse:
        # Check special test trigger for simulating retry flow
        if "[TRIGGER_RETRY_TEST]" in protected_text:
            if retry_attempt == 0 and not retry_feedback:
                # Deliberately corrupt the first protected token to trigger retry
                corrupted = protected_text.replace("[TRIGGER_RETRY_TEST]", "Tekoha")
                # Drop [[MJ_PROTECTED_0001]] to fail validation
                corrupted = re.sub(r"\[\[MJ_PROTECTED_0001\]\]", "ELEMENTO_ALTERADO", corrupted)
                return ProviderResponse(
                    raw_text=corrupted,
                    provider_name=self.name,
                    model_name="mock-deterministic",
                    prompt_tokens=10,
                    completion_tokens=10,
                    retry_attempt=retry_attempt
                )
            else:
                # Repaired version on retry
                cleaned = protected_text.replace("[TRIGGER_RETRY_TEST]", "Tekoha oñemoheñóiva")
                return ProviderResponse(
                    raw_text=cleaned,
                    provider_name=self.name,
                    model_name="mock-deterministic",
                    prompt_tokens=15,
                    completion_tokens=15,
                    retry_attempt=retry_attempt
                )

        # Check exact mapping for unmodified text
        if protected_text in self.EXACT_MAPPINGS:
            result = self.EXACT_MAPPINGS[protected_text]
            return ProviderResponse(
                raw_text=result,
                provider_name=self.name,
                model_name="mock-deterministic",
                prompt_tokens=len(protected_text.split()),
                completion_tokens=len(result.split()),
                retry_attempt=retry_attempt
            )

        # Transform using pedagogical jopara rules
        output = protected_text
        for pattern, repl in self.VERB_REPLACEMENTS:
            output = re.sub(pattern, repl, output)

        # Apply preferred glossary substitutions if source term is in text
        if constraints.preferred:
            for src_term, pref_val in constraints.preferred.items():
                output = re.sub(rf"\b{re.escape(src_term)}\b", pref_val, output, flags=re.IGNORECASE)

        # Ensure KEEP_SPANISH terms stay exact
        if constraints.keep_spanish:
            for keep_term in constraints.keep_spanish:
                output = re.sub(rf"\b{re.escape(keep_term)}\b", keep_term, output, flags=re.IGNORECASE)

        # Ensure FORBIDDEN terms are avoided
        if constraints.forbidden:
            for forb_term in constraints.forbidden:
                output = output.replace(forb_term, "")

        return ProviderResponse(
            raw_text=output,
            provider_name=self.name,
            model_name="mock-deterministic",
            prompt_tokens=len(protected_text.split()),
            completion_tokens=len(output.split()),
            retry_attempt=retry_attempt
        )

    async def test_connection(self) -> Tuple_TestResult:
        return Tuple_TestResult(
            success=True,
            message="MockProvider está activo y listo para operar de manera local y determinista.",
            details={"mode": "offline", "status": "operational"}
        )
