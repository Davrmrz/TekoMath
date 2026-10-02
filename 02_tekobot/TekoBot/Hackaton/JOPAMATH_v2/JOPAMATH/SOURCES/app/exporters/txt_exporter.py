import json
from pathlib import Path
from typing import List, Dict
from app.database.models import Project, TranslationUnit
from app.exporters.base import BaseExporter

class TXTExporter(BaseExporter):
    """
    Exports localized text files line by line, preserving empty lines
    and original document layout.
    """

    def export(
        self,
        project: Project,
        units: List[TranslationUnit],
        output_dir: Path,
        allow_preliminary: bool = False
    ) -> str:
        metadata = json.loads(project.raw_metadata or "{}")
        raw_lines = list(metadata.get("raw_lines", []))

        unit_map: Dict[int, TranslationUnit] = {}
        for unit in units:
            if unit.key_path.startswith("line_"):
                try:
                    line_idx = int(unit.key_path.replace("line_", "")) - 1
                    unit_map[line_idx] = unit
                except Exception:
                    pass

        output_lines = []
        for idx, orig_line in enumerate(raw_lines):
            unit = unit_map.get(idx)
            if unit:
                if unit.status in ("HUMAN_VALIDATED", "TM_MATCH") or allow_preliminary:
                    output_lines.append(unit.target_text if unit.target_text else unit.source_text)
                else:
                    output_lines.append(unit.source_text)
            else:
                output_lines.append(orig_line)

        stem = Path(project.original_filename).stem
        output_filename = f"{stem}_jopara.txt"
        output_path = output_dir / output_filename

        with open(output_path, "w", encoding="utf-8") as f:
            f.write("\n".join(output_lines) + "\n")

        return str(output_path.resolve())
