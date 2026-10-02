import re
import json
import copy
from pathlib import Path
from typing import List, Any
from app.database.models import Project, TranslationUnit
from app.exporters.base import BaseExporter

class JSONExporter(BaseExporter):
    """
    Reconstructs the original JSON structure with localized strings.
    Strictly preserves keys, types (ints, floats, bools, nulls), and formatting.
    """

    @staticmethod
    def _parse_tokens(path: str) -> List[Any]:
        tokens = []
        # Match either a property name or an index [0]
        for part in path.split("."):
            sub_matches = re.finditer(r"([^\[\]]+)|\[(\d+)\]", part)
            for m in sub_matches:
                if m.group(1) is not None:
                    tokens.append(m.group(1))
                elif m.group(2) is not None:
                    tokens.append(int(m.group(2)))
        return tokens

    def _set_value_at_path(self, root: Any, path: str, value: str) -> None:
        tokens = self._parse_tokens(path)
        if not tokens:
            return

        curr = root
        for i, token in enumerate(tokens[:-1]):
            if isinstance(token, str):
                if isinstance(curr, dict) and token in curr:
                    curr = curr[token]
            elif isinstance(token, int):
                if isinstance(curr, list) and 0 <= token < len(curr):
                    curr = curr[token]

        last_token = tokens[-1]
        if isinstance(last_token, str) and isinstance(curr, dict):
            curr[last_token] = value
        elif isinstance(last_token, int) and isinstance(curr, list):
            if 0 <= last_token < len(curr):
                curr[last_token] = value

    def export(
        self,
        project: Project,
        units: List[TranslationUnit],
        output_dir: Path,
        allow_preliminary: bool = False
    ) -> str:
        metadata = json.loads(project.raw_metadata or "{}")
        template = metadata.get("template")
        if template is None:
            raise ValueError("No se encontró plantilla original para exportar el JSON.")

        exported_tree = copy.deepcopy(template)

        for unit in units:
            # Determine appropriate text based on export mode
            if unit.status in ("HUMAN_VALIDATED", "TM_MATCH"):
                text_to_use = unit.target_text if unit.target_text else unit.source_text
            elif allow_preliminary:
                text_to_use = unit.target_text if unit.target_text else unit.source_text
            else:
                # Production mode without validation falls back to original source text
                text_to_use = unit.source_text

            self._set_value_at_path(exported_tree, unit.key_path, text_to_use)

        stem = Path(project.original_filename).stem
        output_filename = f"{stem}_jopara.json"
        output_path = output_dir / output_filename

        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(exported_tree, f, ensure_ascii=False, indent=2)

        return str(output_path.resolve())
