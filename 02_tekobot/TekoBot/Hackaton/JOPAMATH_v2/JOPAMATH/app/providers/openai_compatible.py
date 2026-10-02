import re
import httpx
from typing import Optional, Dict, Any
from app.config import settings
from app.core.contexts import ContextType
from app.core.glossary import GlossaryConstraints
from app.core.prompts import SYSTEM_PROMPT, build_user_prompt
from app.providers.base import BaseLLMProvider, ProviderResponse, Tuple_TestResult
from app.providers.http_utils import post_with_retry

class OpenAICompatibleProvider(BaseLLMProvider):
    """
    OpenAI-compatible Provider supporting OpenAI, Groq, Ollama, vLLM, LM Studio, etc.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        model: Optional[str] = None
    ):
        self.api_key = api_key or settings.OPENAI_API_KEY
        self.base_url = (base_url or settings.OPENAI_BASE_URL or "https://api.openai.com/v1").rstrip("/")
        self.model = model or settings.OPENAI_MODEL or "gpt-4o-mini"

    @property
    def name(self) -> str:
        return "openai_compatible"

    @property
    def is_configured(self) -> bool:
        # If pointing to local ollama, api_key might be dummy or empty, but standard requires key or custom base_url
        if "localhost" in self.base_url or "127.0.0.1" in self.base_url:
            return True
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
            raise ValueError("OPENAI_API_KEY no configurada. Configure la clave en Ajustes o en el archivo .env.")

        user_content = build_user_prompt(protected_text, context, constraints, retry_feedback)
        url = f"{self.base_url}/chat/completions"

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key or 'dummy'}"
        }

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_content}
            ],
            "temperature": 0.1,
            "max_tokens": 2048
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await post_with_retry(
                client, url, headers=headers, json=payload,
                max_attempts=settings.HTTP_RETRY_ATTEMPTS,
                base_delay=settings.HTTP_RETRY_BASE_DELAY,
                max_delay=settings.HTTP_RETRY_MAX_DELAY
            )
            if response.status_code != 200:
                raise RuntimeError(f"Error de OpenAI API ({response.status_code}): {response.text}")

            data = response.json()
            choices = data.get("choices", [])
            if not choices:
                raise RuntimeError(f"Proveedor no retornó respuestas: {data}")

            raw_text = choices[0].get("message", {}).get("content", "").strip()

            # Clean code fence wrapping
            raw_text = re.sub(r"^```[a-zA-Z]*\n?", "", raw_text)
            raw_text = re.sub(r"\n?```$", "", raw_text).strip()

            usage = data.get("usage", {})
            prompt_tokens = usage.get("prompt_tokens", 0)
            completion_tokens = usage.get("completion_tokens", 0)

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
                message="Falta OPENAI_API_KEY. Configure su clave en Ajustes o en .env."
            )

        url = f"{self.base_url}/chat/completions"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key or 'dummy'}"
        }
        payload = {
            "model": self.model,
            "messages": [{"role": "user", "content": "Ping"}],
            "max_tokens": 5
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await post_with_retry(
                    client, url, headers=headers, json=payload, max_attempts=2, base_delay=0.5, max_delay=1.0
                )
                if resp.status_code == 200:
                    return Tuple_TestResult(
                        success=True,
                        message=f"Conexión exitosa con {self.base_url} ({self.model}).",
                        details={"model": self.model, "endpoint": self.base_url}
                    )
                else:
                    return Tuple_TestResult(
                        success=False,
                        message=f"Fallo al conectar con OpenAI ({resp.status_code}): {resp.text}"
                    )
        except Exception as e:
            return Tuple_TestResult(
                success=False,
                message=f"Error de red al conectar con OpenAI ({self.base_url}): {str(e)}"
            )
