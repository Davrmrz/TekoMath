import json
from typing import List, Dict, Any, Tuple
from app.core.contexts import detect_context, ContextType
from app.importers.base import BaseImporter, ImportResult, ImportedItem

class JSONImporter(BaseImporter):
    """
    Parses JSON files recursively. Preserves exact object keys, arrays,
    and data types (numbers, booleans, nulls). Extracts all translatable string leaves.
    """

    def parse(self, content_bytes: bytes, filename: str, **kwargs) -> ImportResult:
        text = content_bytes.decode("utf-8")
        data = json.loads(text)

        items: List[ImportedItem] = []
        counter = 0

        def traverse(node: Any, current_path: str):
            nonlocal counter
            if isinstance(node, dict):
                for k, v in node.items():
                    path = f"{current_path}.{k}" if current_path else k
                    traverse(v, path)
            elif isinstance(node, list):
                for i, elem in enumerate(node):
                    path = f"{current_path}[{i}]"
                    traverse(elem, path)
            elif isinstance(node, str):
                val = node.strip()
                # Exclude purely technical single-word ids or pure version strings if desired,
                # but preserve everything educational.
                if val:
                    ctx = detect_context(current_path, val)
                    items.append(ImportedItem(
                        key_path=current_path,
                        source_text=node,
                        context=ctx,
                        item_index=counter
                    ))
                    counter += 1

        traverse(data, "")

        return ImportResult(
            filename=filename,
            file_format="json",
            items=items,
            raw_metadata={"template": data}
        )
