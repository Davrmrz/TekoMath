import csv
import io
from typing import List, Dict, Any, Optional
from app.core.contexts import detect_context, ContextType
from app.importers.base import BaseImporter, ImportResult, ImportedItem

class CSVImporter(BaseImporter):
    """
    Parses CSV files, detects delimiters, identifies translatable columns,
    and preserves all other table columns.
    """

    CANDIDATE_COLUMNS = [
        "texto_es", "texto", "es", "spanish", "dialogo", "pregunta",
        "consigna", "instruccion", "source", "text", "content"
    ]

    def detect_delimiter(self, sample: str) -> str:
        try:
            sniffer = csv.Sniffer()
            dialect = sniffer.sniff(sample, delimiters=[",", ";", "\t", "|"])
            return dialect.delimiter
        except Exception:
            # Fallback heuristics
            first_line = sample.splitlines()[0] if sample else ""
            if ";" in first_line:
                return ";"
            elif "\t" in first_line:
                return "\t"
            return ","

    def detect_source_column(self, fieldnames: List[str]) -> Optional[str]:
        field_lower = [f.lower().strip() for f in fieldnames]
        for candidate in self.CANDIDATE_COLUMNS:
            for idx, col in enumerate(field_lower):
                if candidate == col or candidate in col:
                    return fieldnames[idx]
        return fieldnames[0] if fieldnames else None

    def parse(self, content_bytes: bytes, filename: str, **kwargs) -> ImportResult:
        # Detect encoding: standard UTF-8 or with BOM
        text = content_bytes.decode("utf-8-sig")
        sample = text[:2048]
        delimiter = kwargs.get("delimiter") or self.detect_delimiter(sample)

        reader = csv.DictReader(io.StringIO(text), delimiter=delimiter)
        fieldnames = reader.fieldnames or []

        source_col = kwargs.get("source_column") or self.detect_source_column(fieldnames)
        if not source_col:
            raise ValueError("No se pudo detectar ninguna columna de texto en el archivo CSV.")

        # Check if there is an explicit context column
        context_col = None
        for f in fieldnames:
            if f.lower().strip() in ("contexto", "context", "tipo", "registro"):
                context_col = f
                break

        rows: List[Dict[str, str]] = []
        items: List[ImportedItem] = []
        counter = 0

        for row_idx, row in enumerate(reader):
            rows.append(row)
            source_val = row.get(source_col, "").strip()
            if not source_val:
                continue

            # Context resolution
            if context_col and row.get(context_col):
                raw_ctx = row.get(context_col, "").strip().upper()
                ctx = ContextType(raw_ctx) if raw_ctx in ContextType.__members__ else detect_context(f"row_{row_idx}", source_val)
            else:
                ctx = detect_context(f"row_{row_idx}", source_val)

            key_path = f"row_{row_idx}:{source_col}"
            items.append(ImportedItem(
                key_path=key_path,
                source_text=source_val,
                context=ctx,
                item_index=counter
            ))
            counter += 1

        return ImportResult(
            filename=filename,
            file_format="csv",
            items=items,
            raw_metadata={
                "fieldnames": fieldnames,
                "rows": rows,
                "delimiter": delimiter,
                "source_column": source_col
            },
            detected_delimiter=delimiter,
            detected_source_column=source_col
        )
