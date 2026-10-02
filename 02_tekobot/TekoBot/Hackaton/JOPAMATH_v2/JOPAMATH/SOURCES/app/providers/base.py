from __future__ import annotations
from abc import ABC, abstractmethod
from typing import Optional, List, Dict
from pydantic import BaseModel
from app.core.contexts import ContextType
from app.core.glossary import GlossaryConstraints

class Tuple_TestResult(BaseModel):
    success: bool
    message: str
    details: Optional[Dict[str, str]] = None

class ProviderResponse(BaseModel):
    raw_text: str
    provider_name: str
    model_name: str
    prompt_tokens: int = 0
    completion_tokens: int = 0
    retry_attempt: int = 0

class BaseLLMProvider(ABC):
    """Abstract interface for all translation providers."""

    @property
    @abstractmethod
    def name(self) -> str:
        pass

    @property
    @abstractmethod
    def is_configured(self) -> bool:
        """Returns True if the provider has all required keys/settings to run."""
        pass

    @abstractmethod
    async def translate(
        self,
        protected_text: str,
        context: ContextType,
        constraints: GlossaryConstraints,
        retry_feedback: Optional[str] = None,
        retry_attempt: int = 0
    ) -> ProviderResponse:
        """
        Translates masked/protected text into pedagogical Jopara.
        """
        pass

    @abstractmethod
    async def test_connection(self) -> Tuple_TestResult:
        """Tests provider connectivity and authentication."""
        pass
