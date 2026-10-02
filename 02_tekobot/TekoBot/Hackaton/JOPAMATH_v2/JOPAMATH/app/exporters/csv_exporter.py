import csv
import json
import re
from pathlib import Path
from typing import List, Dict, Tuple
from app.database.models import Project, TranslationUnit
from app.exporters.base import BaseExporter


class CSVExporter(BaseExporter):
    """Preserves original CSV columns and writes one localized column per source text column."""

    @staticmethod
    def _safe_suffix(column: str) -> str:
        value = re.sub(r"[^0-9A-Za-z_À-ÿ]+", "_", column.strip()).strip("_").lower()
        return value or "texto"

    def export(self, project: Project, units: List[TranslationUnit], output_dir: Path,
               allow_preliminary: bool = False) -> str:
        metadata = json.loads(project.raw_metadata or "{}")
        fieldnames = list(metadata.get("fieldnames", []))
        rows = [dict(r) for r in metadata.get("rows", [])]
        delimiter = metadata.get("delimiter", ",")
        source_cols = list(metadata.get("source_columns") or [])
        if not source_cols and metadata.get("source_column"):
            source_cols = [metadata.get("source_column")]

        if not source_cols:
            raise ValueError("El proyecto CSV no contiene columnas fuente registradas.")

        target_by_source: Dict[str, str] = {}
        if len(source_cols) == 1:
            target_by_source[source_cols[0]] = "jopara"
        else:
            for col in source_cols:
                target_by_source[col] = f"jopara_{self._safe_suffix(col)}"

        for target_col in target_by_source.values():
            if target_col not in fieldnames:
                fieldnames.append(target_col)

        unit_map: Dict[Tuple[int, str], TranslationUnit] = {}
        for unit in units:
            m = re.match(r"^row_(\d+):(.*)$", unit.key_path)
            if m:
                unit_map[(int(m.group(1)), m.group(2))] = unit

        for idx, row in enumerate(rows):
            for source_col, target_col in target_by_source.items():
                unit = unit_map.get((idx, source_col))
                if unit:
                    if unit.status in ("HUMAN_VALIDATED", "TM_MATCH") or allow_preliminary:
                        row[target_col] = unit.target_text if unit.target_text else unit.source_text
                    else:
                        row[target_col] = unit.source_text
                else:
                    row[target_col] = ""

        stem = Path(project.original_filename).stem
        output_path = output_dir / f"{stem}_jopara.csv"
        output_dir.mkdir(parents=True, exist_ok=True)
        with open(output_path, "w", encoding="utf-8-sig", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames, delimiter=delimiter, extrasaction="ignore")
            writer.writeheader()
            writer.writerows(rows)
        return str(output_path.resolve())
