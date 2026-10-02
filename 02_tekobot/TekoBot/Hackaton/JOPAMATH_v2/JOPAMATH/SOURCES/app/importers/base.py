from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from app.core.contexts import ContextType

class ImportedItem(BaseModel):
    key_path: str
    source_text: str
    context: ContextType
    item_index: int

class ImportResult(BaseModel):
    filename: str
    file_format: str
    items: List[ImportedItem]
    raw_metadata: Dict[str, Any]
    detected_delimiter: Optional[str] = None
    detected_source_column: Optional[str] = None

class BaseImporter(ABC):
    @abstractmethod
    def parse(self, content_bytes: bytes, filename: str, **kwargs) -> ImportResult:
        pass
