from pathlib import Path
from typing import List
from app.database.models import Project, TranslationUnit
from app.exporters.base import BaseExporter, ExportSummary, ExportResult
from app.exporters.json_exporter import JSONExporter
from app.exporters.csv_exporter import CSVExporter
from app.exporters.txt_exporter import TXTExporter
from app.exporters.audit_exporter import AuditExporter

def get_exporter_for_format(file_format: str) -> BaseExporter:
    fmt = file_format.lower().strip()
    if fmt == "json":
        return JSONExporter()
    elif fmt == "csv":
        return CSVExporter()
    elif fmt == "txt":
        return TXTExporter()
    else:
        raise ValueError(f"Formato de exportación no soportado: {file_format}")

def evaluate_project_export_readiness(units: List[TranslationUnit]) -> ExportSummary:
    total = len(units)
    human_val = sum(1 for u in units if u.status == "HUMAN_VALIDATED")
    auto_gen = sum(1 for u in units if u.status == "AUTO_GENERATED")
    tm_match = sum(1 for u in units if u.status == "TM_MATCH")
    needs_rev = sum(1 for u in units if u.status == "NEEDS_REVIEW")
    val_err = sum(1 for u in units if u.status == "VALIDATION_ERROR")
    rejected = sum(1 for u in units if u.status == "REJECTED")

    blocking_reasons = []
    if val_err > 0:
        blocking_reasons.append(f"Existen {val_err} unidades con error de validación técnica.")
    if (auto_gen + needs_rev) > 0:
        blocking_reasons.append(f"Existen {auto_gen + needs_rev} unidades sin validación humana.")
    if rejected > 0:
        blocking_reasons.append(f"Existen {rejected} unidades rechazadas.")

    is_production_ready = (val_err == 0 and (auto_gen + needs_rev) == 0 and rejected == 0)

    return ExportSummary(
        total_units=total,
        human_validated=human_val,
        auto_generated=auto_gen,
        tm_match=tm_match,
        needs_review=needs_rev,
        validation_error=val_err,
        rejected=rejected,
        is_production_ready=is_production_ready,
        blocking_reasons=blocking_reasons
    )

def export_project(
    project: Project,
    units: List[TranslationUnit],
    output_dir: Path,
    allow_preliminary: bool = False
) -> ExportResult:
    summary = evaluate_project_export_readiness(units)

    # By default block export if validation errors exist
    if summary.validation_error > 0 and not allow_preliminary:
        raise ValueError(
            f"Exportación bloqueada: el proyecto contiene {summary.validation_error} unidades con VALIDATION_ERROR. "
            "Corrija los errores antes de exportar o use la opción de exportación preliminar."
        )

    exporter = get_exporter_for_format(project.file_format)
    output_file = exporter.export(
        project=project,
        units=units,
        output_dir=output_dir,
        allow_preliminary=allow_preliminary
    )

    audit_paths = AuditExporter.generate_audit(project, units, output_dir)

    return ExportResult(
        output_filepath=output_file,
        audit_json_path=audit_paths["audit_json"],
        audit_html_path=audit_paths["audit_html"],
        summary=summary,
        is_preliminary=allow_preliminary
    )

__all__ = [
    "BaseExporter",
    "ExportSummary",
    "ExportResult",
    "JSONExporter",
    "CSVExporter",
    "TXTExporter",
    "AuditExporter",
    "get_exporter_for_format",
    "evaluate_project_export_readiness",
    "export_project"
]
