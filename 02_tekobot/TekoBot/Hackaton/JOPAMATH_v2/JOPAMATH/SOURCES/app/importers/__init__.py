from typing import Optional
from app.importers.base import BaseImporter, ImportResult, ImportedItem
from app.importers.json_importer import JSONImporter
from app.importers.csv_importer import CSVImporter
from app.importers.txt_importer import TXTImporter

def get_importer_for_file(filename: str) -> BaseImporter:
    lower = filename.lower()
    if lower.endswith(".json"):
        return JSONImporter()
    elif lower.endswith(".csv"):
        return CSVImporter()
    elif lower.endswith(".txt"):
        return TXTImporter()
    else:
        raise ValueError(f"Formato de archivo no soportado: {filename}. Formatos admitidos: .json, .csv, .txt")

__all__ = [
    "BaseImporter",
    "ImportResult",
    "ImportedItem",
    "JSONImporter",
    "CSVImporter",
    "TXTImporter",
    "get_importer_for_file"
]
