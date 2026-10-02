import json
from pathlib import Path
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from app.config import settings

class SourceReference(BaseModel):
    id: str
    name: str
    url: str
    role: str
    notes: Optional[str] = None

class ProvenanceManager:
    """Manages linguistic citations and provenance metadata."""

    _sources_cache: Optional[List[SourceReference]] = None

    @classmethod
    def get_sources(cls) -> List[SourceReference]:
        if cls._sources_cache is not None:
            return cls._sources_cache

        sources_file = settings.DATA_DIR / "sources.json"
        if not sources_file.exists():
            return []

        try:
            with open(sources_file, "r", encoding="utf-8") as f:
                data = json.load(f)
            cls._sources_cache = [SourceReference(**item) for item in data]
            return cls._sources_cache
        except Exception:
            return []

    @classmethod
    def get_source_by_id(cls, source_id: str) -> Optional[SourceReference]:
        for src in cls.get_sources():
            if src.id == source_id:
                return src
        return None

    @classmethod
    def build_attribution(cls, source_ids: List[str], human_validated: bool) -> List[str]:
        """
        Builds honest, standard attributions adhering to project philosophy:
        - Never 'Traducción oficial de la SPL'.
        - Use descriptive references.
        """
        labels = []
        if "MEC_STUDENT" in source_ids or "MEC_TEACHER" in source_ids:
            labels.append("Terminología matemática: MEC")
        if "SPL_DICTIONARY" in source_ids or "SPL_DICTIONARIES" in source_ids:
            labels.append("Referencia léxica: SPL")
        if "COREGUAPA" in source_ids:
            labels.append("Referencia contextual: COREGUAPA")
        if "GUARANI_ACADEMY" in source_ids:
            labels.append("Referencia ortográfica: Academia Lengua Guaraní")
        if "PARAGUAYAN_SPANISH" in source_ids:
            labels.append("Uso lingüístico: Castellano Paraguayo")
        if "MATEJOPARA_GLOSSARY" in source_ids:
            labels.append("Criterio pedagógico: Glosario MateJopara")

        status_label = "Validación humana: aprobada" if human_validated else "Validación humana: pendiente"
        labels.append(status_label)
        return labels
