import re
import httpx
from typing import Optional, Dict, Any
from app.config import settings
from app.core.contexts import ContextType
from app.core.glossary import GlossaryConstraints
from app.core.prompts import SYSTEM_PROMPT, build_user_prompt
from app.providers.base import BaseLLMProvider, ProviderResponse, Tuple_TestResult

class GeminiProvider(BaseLLMProvider):
    """
    Google Gemini Provider using REST API with httpx.
    """

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model = model or settings.GEMINI_MODEL or "gemini-1.5-flash"

    @property
    def name(self) -> str:
        return "gemini"

    @property
    def is_configured(self) -> bool:
        return bool(self.api_key and self.api_key.strip())

    async def translate(
        self,
        protected_text: str,
        context: ContextType,
        constraints: GlossaryConstraints,
        retry_feedback: Optional[str] = None,
        retry_attempt: int = 0
    ) -> ProviderResponse:
        if not self.is_configured:
            raise ValueError("GEMINI_API_KEY no configurada. Configure la clave en Ajustes o en el archivo .env.")

        user_content = build_user_prompt(protected_text, context, constraints, retry_feedback)
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"

        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": user_content}]
                }
            ],
            "systemInstruction": {
                "parts": [{"text": SYSTEM_PROMPT}]
            },
            "generationConfig": {
                "temperature": 0.1,
                "maxOutputTokens": 2048
            }
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=payload)
            if response.status_code != 200:
                raise RuntimeError(f"Error de Gemini API ({response.status_code}): {response.text}")

            data = response.json()
            candidates = data.get("candidates", [])
            if not candidates:
                raise RuntimeError(f"Gemini no retornó candidatos: {data}")

            parts = candidates[0].get("content", {}).get("parts", [])
            raw_text = parts[0].get("text", "").strip() if parts else ""

            # Clean code fence wrapping if present
            raw_text = re.sub(r"^```[a-zA-Z]*\n?", "", raw_text)
            raw_text = re.sub(r"\n?```$", "", raw_text).strip()

            usage = data.get("usageMetadata", {})
            prompt_tokens = usage.get("promptTokenCount", 0)
            completion_tokens = usage.get("candidatesTokenCount", 0)

            return ProviderResponse(
                raw_text=raw_text,
                provider_name=self.name,
                model_name=self.model,
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                retry_attempt=retry_attempt
            )

    async def test_connection(self) -> Tuple_TestResult:
        if not self.is_configured:
            return Tuple_TestResult(
                success=False,
                message="Falta GEMINI_API_KEY. Configure su clave en Ajustes o en .env."
            )

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
        payload = {
            "contents": [{"role": "user", "parts": [{"text": "Responde únicamente 'OK'."}]}],
            "generationConfig": {"temperature": 0.0, "maxOutputTokens": 10}
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(url, json=payload)
                if resp.status_code == 200:
                    return Tuple_TestResult(
                        success=True,
                        message=f"Conexión exitosa con Gemini ({self.model}).",
                        details={"model": self.model, "status": "authenticated"}
                    )
                else:
                    return Tuple_TestResult(
                        success=False,
                        message=f"Fallo al autenticar con Gemini ({resp.status_code}): {resp.text}"
                    )
        except Exception as e:
            return Tuple_TestResult(
                success=False,
                message=f"Error de red al conectar con Gemini: {str(e)}"
            )
