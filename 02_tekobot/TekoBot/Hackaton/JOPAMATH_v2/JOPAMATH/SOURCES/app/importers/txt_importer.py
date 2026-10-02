from typing import List, Dict, Any
from app.core.contexts import detect_context, ContextType
from app.importers.base import BaseImporter, ImportResult, ImportedItem

class TXTImporter(BaseImporter):
    """
    Parses plain text files line-by-line while preserving structural line integrity.
    """

    def parse(self, content_bytes: bytes, filename: str, **kwargs) -> ImportResult:
        text = content_bytes.decode("utf-8-sig")
        lines = text.splitlines()

        items: List[ImportedItem] = []
        counter = 0

        for line_idx, line in enumerate(lines):
            stripped = line.strip()
            if not stripped:
                continue

            ctx = detect_context(f"line_{line_idx + 1}", stripped)
            items.append(ImportedItem(
                key_path=f"line_{line_idx + 1}",
                source_text=stripped,
                context=ctx,
                item_index=counter
            ))
            counter += 1

        return ImportResult(
            filename=filename,
            file_format="txt",
            items=items,
            raw_metadata={"raw_lines": lines}
        )
