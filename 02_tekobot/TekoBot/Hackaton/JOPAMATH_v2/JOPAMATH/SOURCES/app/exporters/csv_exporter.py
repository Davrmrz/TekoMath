import csv
import json
from pathlib import Path
from typing import List, Dict, Any
from app.database.models import Project, TranslationUnit
from app.exporters.base import BaseExporter

class CSVExporter(BaseExporter):
    """
    Reconstructs the original CSV, preserving all existing columns
    and populating the localized Jopara column.
    """

    def export(
        self,
        project: Project,
        units: List[TranslationUnit],
        output_dir: Path,
        allow_preliminary: bool = False
    ) -> str:
        metadata = json.loads(project.raw_metadata or "{}")
        fieldnames = list(metadata.get("fieldnames", []))
        rows = list(metadata.get("rows", []))
        delimiter = metadata.get("delimiter", ",")
        source_col = metadata.get("source_column")

        # Determine target column name
        target_col = "jopara"
        if target_col not in fieldnames:
            fieldnames.append(target_col)

        # Build index mapping row_idx -> unit
        unit_map: Dict[int, TranslationUnit] = {}
        for unit in units:
            if unit.key_path.startswith("row_"):
                try:
                    row_idx_str = unit.key_path.split(":")[0].replace("row_", "")
                    unit_map[int(row_idx_str)] = unit
                except Exception:
                    pass

        # Populate rows
        for idx, row in enumerate(rows):
            unit = unit_map.get(idx)
            if unit:
                if unit.status in ("HUMAN_VALIDATED", "TM_MATCH") or allow_preliminary:
                    row[target_col] = unit.target_text if unit.target_text else unit.source_text
                else:
                    row[target_col] = unit.source_text
            else:
                row[target_col] = ""

        stem = Path(project.original_filename).stem
        output_filename = f"{stem}_jopara.csv"
        output_path = output_dir / output_filename

        with open(output_path, "w", encoding="utf-8-sig", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames, delimiter=delimiter)
            writer.writeheader()
            writer.writerows(rows)

        return str(output_path.resolve())
