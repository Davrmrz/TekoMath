import re
import json
import copy
from pathlib import Path
from typing import List, Any
from app.database.models import Project, TranslationUnit
from app.exporters.base import BaseExporter


def _unescape_pointer_segment(segment: str) -> str:
    return segment.replace("~1", "/").replace("~0", "~")


class JSONExporter(BaseExporter):
    """
    Reconstructs the original JSON structure with localized strings.
    New projects use RFC 6901 JSON Pointer paths, so literal keys such as
    'home.title' are never mistaken for nested objects. Legacy dotted projects
    remain exportable for backward compatibility.
    """

    @staticmethod
    def _parse_legacy_tokens(path: str) -> List[Any]:
        tokens = []
        for part in path.split("."):
            sub_matches = re.finditer(r"([^\[\]]+)|\[(\d+)\]", part)
            for m in sub_matches:
                if m.group(1) is not None:
                    tokens.append(m.group(1))
                elif m.group(2) is not None:
                    tokens.append(int(m.group(2)))
        return tokens

    @staticmethod
    def _parse_pointer_tokens(path: str) -> List[str]:
        if path == "":
            return []
        if not path.startswith("/"):
            raise ValueError(f"JSON Pointer inválido: {path}")
        return [_unescape_pointer_segment(seg) for seg in path[1:].split("/")]

    def _set_pointer_value(self, root: Any, path: str, value: str) -> Any:
        tokens = self._parse_pointer_tokens(path)
        if not tokens:
            # Top-level JSON string.
            return value

        curr = root
        for token in tokens[:-1]:
            if isinstance(curr, dict):
                if token not in curr:
                    raise KeyError(f"Ruta JSON inexistente: {path}")
                curr = curr[token]
            elif isinstance(curr, list):
                try:
                    idx = int(token)
                except ValueError as exc:
                    raise KeyError(f"Índice JSON inválido en {path}: {token}") from exc
                if idx < 0 or idx >= len(curr):
                    raise IndexError(f"Índice fuera de rango en {path}: {idx}")
                curr = curr[idx]
            else:
                raise KeyError(f"Ruta JSON no navegable: {path}")

        last = tokens[-1]
        if isinstance(curr, dict):
            if last not in curr:
                raise KeyError(f"Clave JSON inexistente: {path}")
            curr[last] = value
        elif isinstance(curr, list):
            idx = int(last)
            if idx < 0 or idx >= len(curr):
                raise IndexError(f"Índice fuera de rango en {path}: {idx}")
            curr[idx] = value
        else:
            raise KeyError(f"Ruta JSON no navegable: {path}")
        return root

    def _set_legacy_value(self, root: Any, path: str, value: str) -> Any:
        """
        Backward-compatible resolver for projects imported by v1.0.
        It uses the actual JSON template to disambiguate literal dotted keys.
        Example: if the root really contains the key 'home.title', that exact key
        wins over interpreting it as {'home': {'title': ...}}.
        """
        def assign(node: Any, remaining: str) -> bool:
            if isinstance(node, dict):
                # Exact literal key wins, which repairs old flat i18n projects.
                if remaining in node:
                    node[remaining] = value
                    return True

                # Try real keys as prefixes, longest first, so keys containing dots
                # remain intact whenever the original template proves they exist.
                for key in sorted(node.keys(), key=lambda k: len(str(k)), reverse=True):
                    key_s = str(key)
                    if remaining.startswith(key_s + "."):
                        if assign(node[key], remaining[len(key_s) + 1:]):
                            return True
                    if remaining.startswith(key_s + "["):
                        if assign(node[key], remaining[len(key_s):]):
                            return True
                return False

            if isinstance(node, list):
                m = re.match(r"^\[(\d+)\](?:\.(.*))?$", remaining)
                if not m:
                    return False
                idx = int(m.group(1))
                if idx < 0 or idx >= len(node):
                    return False
                tail = m.group(2)
                if tail is None or tail == "":
                    node[idx] = value
                    return True
                return assign(node[idx], tail)
            return False

        if not assign(root, path):
            # Last-resort compatibility for ordinary old paths.
            tokens = self._parse_legacy_tokens(path)
            if not tokens:
                return root
            curr = root
            for token in tokens[:-1]:
                if isinstance(token, str) and isinstance(curr, dict) and token in curr:
                    curr = curr[token]
                elif isinstance(token, int) and isinstance(curr, list) and 0 <= token < len(curr):
                    curr = curr[token]
                else:
                    raise KeyError(f"Ruta JSON legacy inexistente: {path}")
            last = tokens[-1]
            if isinstance(last, str) and isinstance(curr, dict) and last in curr:
                curr[last] = value
            elif isinstance(last, int) and isinstance(curr, list) and 0 <= last < len(curr):
                curr[last] = value
            else:
                raise KeyError(f"Ruta JSON legacy inexistente: {path}")
        return root

    def export(self, project: Project, units: List[TranslationUnit], output_dir: Path,
               allow_preliminary: bool = False) -> str:
        metadata = json.loads(project.raw_metadata or "{}")
        template = metadata.get("template")
        if template is None:
            raise ValueError("No se encontró plantilla original para exportar el JSON.")

        path_format = metadata.get("path_format", "legacy_dotted")
        exported_tree = copy.deepcopy(template)

        for unit in units:
            if unit.status in ("HUMAN_VALIDATED", "TM_MATCH"):
                text_to_use = unit.target_text if unit.target_text else unit.source_text
            elif allow_preliminary:
                text_to_use = unit.target_text if unit.target_text else unit.source_text
            else:
                text_to_use = unit.source_text

            if path_format == "json_pointer_v1":
                exported_tree = self._set_pointer_value(exported_tree, unit.key_path, text_to_use)
            else:
                exported_tree = self._set_legacy_value(exported_tree, unit.key_path, text_to_use)

        stem = Path(project.original_filename).stem
        output_filename = f"{stem}_jopara.json"
        output_path = output_dir / output_filename
        output_dir.mkdir(parents=True, exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(exported_tree, f, ensure_ascii=False, indent=2)
        return str(output_path.resolve())
