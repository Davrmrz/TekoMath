from typing import Optional
from sqlalchemy.orm import Session
from app.config import settings
from app.database.models import AppSetting
from app.providers.base import BaseLLMProvider, ProviderResponse, Tuple_TestResult
from app.providers.mock import MockProvider
from app.providers.gemini import GeminiProvider
from app.providers.openai_compatible import OpenAICompatibleProvider

def get_provider(provider_name: Optional[str] = None, db: Optional[Session] = None) -> BaseLLMProvider:
    """
    Factory to retrieve an initialized LLMProvider instance.
    Checks DB AppSetting overrides first, falling back to environment config.
    """
    prov_name = provider_name

    # Check database settings if db provided and provider_name not explicitly forced
    gemini_key = settings.GEMINI_API_KEY
    gemini_model = settings.GEMINI_MODEL
    openai_key = settings.OPENAI_API_KEY
    openai_url = settings.OPENAI_BASE_URL
    openai_model = settings.OPENAI_MODEL

    if db:
        def get_setting(key: str, default: str) -> str:
            s = db.query(AppSetting).filter(AppSetting.key == key).first()
            return s.value if s and s.value else default

        if not prov_name:
            prov_name = get_setting("DEFAULT_PROVIDER", settings.DEFAULT_PROVIDER)
        gemini_key = get_setting("GEMINI_API_KEY", gemini_key)
        gemini_model = get_setting("GEMINI_MODEL", gemini_model)
        openai_key = get_setting("OPENAI_API_KEY", openai_key)
        openai_url = get_setting("OPENAI_BASE_URL", openai_url)
        openai_model = get_setting("OPENAI_MODEL", openai_model)

    if not prov_name:
        prov_name = settings.DEFAULT_PROVIDER or "mock"

    prov_clean = prov_name.lower().strip()

    if prov_clean == "gemini":
        return GeminiProvider(api_key=gemini_key, model=gemini_model)
    elif prov_clean in ("openai", "openai_compatible"):
        return OpenAICompatibleProvider(api_key=openai_key, base_url=openai_url, model=openai_model)
    else:
        return MockProvider()

__all__ = [
    "BaseLLMProvider",
    "ProviderResponse",
    "Tuple_TestResult",
    "MockProvider",
    "GeminiProvider",
    "OpenAICompatibleProvider",
    "get_provider"
]
