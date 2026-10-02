import json
from typing import List, Any
from app.core.contexts import detect_context
from app.importers.base import BaseImporter, ImportResult, ImportedItem


def _escape_pointer_segment(segment: str) -> str:
    """RFC 6901 escaping: '~' -> '~0', '/' -> '~1'."""
    return str(segment).replace("~", "~0").replace("/", "~1")


class JSONImporter(BaseImporter):
    """
    Parses JSON recursively while preserving literal object keys, including keys
    containing dots, brackets, slashes or tildes. New imports use RFC 6901 JSON
    Pointer paths instead of ambiguous dotted paths.
    """

    def parse(self, content_bytes: bytes, filename: str, **kwargs) -> ImportResult:
        text = content_bytes.decode("utf-8-sig")
        data = json.loads(text)

        items: List[ImportedItem] = []
        counter = 0

        def traverse(node: Any, segments: List[str]):
            nonlocal counter
            if isinstance(node, dict):
                for k, v in node.items():
                    traverse(v, segments + [_escape_pointer_segment(k)])
            elif isinstance(node, list):
                for i, elem in enumerate(node):
                    traverse(elem, segments + [str(i)])
            elif isinstance(node, str):
                if node.strip():
                    pointer = "/" + "/".join(segments)
                    # Human-readable hint for context inference; pointer itself stays exact.
                    ctx = detect_context(pointer, node.strip())
                    items.append(ImportedItem(
                        key_path=pointer,
                        source_text=node,
                        context=ctx,
                        item_index=counter
                    ))
                    counter += 1

        # JSON may itself be a top-level string. RFC 6901 uses the empty pointer for root.
        if isinstance(data, str):
            if data.strip():
                items.append(ImportedItem(
                    key_path="",
                    source_text=data,
                    context=detect_context("$", data.strip()),
                    item_index=0
                ))
        else:
            traverse(data, [])

        return ImportResult(
            filename=filename,
            file_format="json",
            items=items,
            raw_metadata={"template": data, "path_format": "json_pointer_v1"}
        )
