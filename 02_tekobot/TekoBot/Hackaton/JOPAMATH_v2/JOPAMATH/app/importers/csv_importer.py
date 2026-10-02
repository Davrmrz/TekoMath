import csv
import io
import re
from typing import List, Dict, Optional
from app.core.contexts import detect_context, ContextType
from app.importers.base import BaseImporter, ImportResult, ImportedItem


class CSVImporter(BaseImporter):
    """Parses CSV and can translate one or several textual columns per row."""

    # Exact names are safest. Broad substring matching (especially 'es') caused
    # columns such as 'respuesta_a' to be selected accidentally in v1.0.
    EXACT_CANDIDATES = {
        "texto_es", "texto", "es", "espanol", "español", "spanish",
        "dialogo", "diálogo", "pregunta", "consigna", "instruccion", "instrucción",
        "source", "text", "content", "mensaje", "message", "pista", "hint",
        "feedback", "retroalimentacion", "retroalimentación", "titulo", "título",
        "title", "subtitulo", "subtítulo", "subtitle", "descripcion", "descripción",
        "description", "label", "placeholder", "respuesta", "answer", "opcion", "opción"
    }
    TEXT_PREFIXES = (
        "texto_", "dialogo_", "diálogo_", "pregunta_", "consigna_", "instruccion_",
        "instrucción_", "mensaje_", "pista_", "feedback_", "titulo_", "título_",
        "subtitulo_", "subtítulo_", "descripcion_", "descripción_", "respuesta_",
        "answer_", "opcion_", "opción_", "label_", "placeholder_"
    )
    TECHNICAL_COLUMNS = {
        "id", "uuid", "key", "clave", "codigo", "código", "version", "versión",
        "url", "href", "src", "path", "ruta", "slug", "filename", "archivo",
        "asset", "icon", "imagen", "image", "contexto", "context", "tipo", "registro"
    }

    @staticmethod
    def _norm(name: str) -> str:
        return re.sub(r"\s+", "_", (name or "").strip().lower())

    def detect_delimiter(self, sample: str) -> str:
        try:
            return csv.Sniffer().sniff(sample, delimiters=[",", ";", "\t", "|"]).delimiter
        except Exception:
            first_line = sample.splitlines()[0] if sample else ""
            if ";" in first_line:
                return ";"
            if "\t" in first_line:
                return "\t"
            if "|" in first_line:
                return "|"
            return ","

    def detect_source_columns(self, fieldnames: List[str]) -> List[str]:
        detected: List[str] = []
        for original in fieldnames:
            col = self._norm(original)
            if col in self.TECHNICAL_COLUMNS:
                continue
            if col in self.EXACT_CANDIDATES or col.startswith(self.TEXT_PREFIXES):
                detected.append(original)
        if detected:
            return detected

        # Conservative fallback: first non-technical column, preserving v1 behavior
        # without ever matching the substring 'es' inside unrelated words.
        for original in fieldnames:
            if self._norm(original) not in self.TECHNICAL_COLUMNS:
                return [original]
        return fieldnames[:1]

    def detect_source_column(self, fieldnames: List[str]) -> Optional[str]:
        cols = self.detect_source_columns(fieldnames)
        return cols[0] if cols else None

    @staticmethod
    def _normalize_requested_columns(value) -> List[str]:
        if not value:
            return []
        if isinstance(value, str):
            return [c.strip() for c in value.split(",") if c.strip()]
        return [str(c).strip() for c in value if str(c).strip()]

    def parse(self, content_bytes: bytes, filename: str, **kwargs) -> ImportResult:
        text = content_bytes.decode("utf-8-sig")
        delimiter = kwargs.get("delimiter") or self.detect_delimiter(text[:4096])
        reader = csv.DictReader(io.StringIO(text), delimiter=delimiter)
        fieldnames = reader.fieldnames or []

        requested = self._normalize_requested_columns(kwargs.get("source_columns"))
        if not requested and kwargs.get("source_column"):
            requested = self._normalize_requested_columns(kwargs.get("source_column"))

        if requested:
            missing = [c for c in requested if c not in fieldnames]
            if missing:
                raise ValueError(
                    "Columnas no encontradas en el CSV: " + ", ".join(missing) +
                    ". Disponibles: " + ", ".join(fieldnames)
                )
            source_cols = requested
        else:
            source_cols = self.detect_source_columns(fieldnames)

        if not source_cols:
            raise ValueError("No se pudo detectar ninguna columna de texto en el archivo CSV.")

        context_col = next(
            (f for f in fieldnames if self._norm(f) in {"contexto", "context", "tipo", "registro"}),
            None
        )

        rows: List[Dict[str, str]] = []
        items: List[ImportedItem] = []
        counter = 0

        for row_idx, row in enumerate(reader):
            rows.append(dict(row))
            for source_col in source_cols:
                source_val = (row.get(source_col) or "").strip()
                if not source_val:
                    continue

                if context_col and row.get(context_col):
                    raw_ctx = (row.get(context_col) or "").strip().upper()
                    try:
                        ctx = ContextType(raw_ctx)
                    except ValueError:
                        ctx = detect_context(f"row_{row_idx}:{source_col}", source_val)
                else:
                    ctx = detect_context(f"row_{row_idx}:{source_col}", source_val)

                items.append(ImportedItem(
                    key_path=f"row_{row_idx}:{source_col}",
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
                "source_column": source_cols[0],
                "source_columns": source_cols
            },
            detected_delimiter=delimiter,
            detected_source_column=source_cols[0],
            detected_source_columns=source_cols
        )
