from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from pathlib import Path
from pydantic import BaseModel
from app.database.models import Project, TranslationUnit

class ExportSummary(BaseModel):
    total_units: int
    human_validated: int
    auto_generated: int
    tm_match: int
    needs_review: int
    validation_error: int
    rejected: int
    is_production_ready: bool
    blocking_reasons: List[str]

class ExportResult(BaseModel):
    output_filepath: str
    audit_json_path: str
    audit_html_path: str
    summary: ExportSummary
    is_preliminary: bool

class BaseExporter(ABC):
    @abstractmethod
    def export(
        self,
        project: Project,
        units: List[TranslationUnit],
        output_dir: Path,
        allow_preliminary: bool = False
    ) -> str:
        """Exports the localized file, returning the saved absolute filepath."""
        pass
