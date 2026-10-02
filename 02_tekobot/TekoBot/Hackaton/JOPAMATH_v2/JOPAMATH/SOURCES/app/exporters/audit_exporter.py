import json
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Dict, Any
from app.database.models import Project, TranslationUnit
from app.core.provenance import ProvenanceManager

class AuditExporter:
    """
    Generates structured translation audit records:
    1. translation_audit.json
    2. translation_report.html
    """

    @staticmethod
    def generate_audit(project: Project, units: List[TranslationUnit], output_dir: Path) -> Dict[str, str]:
        audit_records: List[Dict[str, Any]] = []

        status_counts = {
            "HUMAN_VALIDATED": 0,
            "TM_MATCH": 0,
            "AUTO_GENERATED": 0,
            "NEEDS_REVIEW": 0,
            "VALIDATION_ERROR": 0,
            "REJECTED": 0,
            "NEW": 0
        }

        for u in units:
            status_counts[u.status] = status_counts.get(u.status, 0) + 1

            try:
                protected_items = json.loads(u.protected_items_json or "{}")
            except Exception:
                protected_items = {}

            try:
                validation_info = json.loads(u.validation_json or "{}")
            except Exception:
                validation_info = {}

            try:
                glossary_terms = json.loads(u.glossary_terms_json or "[]")
            except Exception:
                glossary_terms = []

            try:
                sources = json.loads(u.sources_json or "[]")
            except Exception:
                sources = []

            attributions = ProvenanceManager.build_attribution(sources, u.status == "HUMAN_VALIDATED")

            record = {
                "id": u.id,
                "project_id": project.id,
                "source_file": project.original_filename,
                "key_path": u.key_path,
                "source_text": u.source_text,
                "target_text": u.target_text,
                "context": u.context,
                "status": u.status,
                "provider": u.provider_used or "None",
                "model": u.model_used or "None",
                "sources": sources,
                "attributions": attributions,
                "glossary_terms": glossary_terms,
                "protected_elements": protected_items,
                "validation": validation_info,
                "validation_error": u.validation_error,
                "human_edited": u.human_edited,
                "retry_count": u.retry_count,
                "timestamp": u.updated_at.isoformat() if u.updated_at else datetime.now(timezone.utc).isoformat()
            }
            audit_records.append(record)

        stem = Path(project.original_filename).stem
        json_path = output_dir / f"{stem}_translation_audit.json"
        html_path = output_dir / f"{stem}_translation_report.html"

        # Also write canonical translation_audit.json and translation_report.html
        canonical_json = output_dir / "translation_audit.json"
        canonical_html = output_dir / "translation_report.html"

        # 1. Save JSON audit
        audit_payload = {
            "project_name": project.name,
            "source_file": project.original_filename,
            "exported_at": datetime.now(timezone.utc).isoformat(),
            "total_units": len(units),
            "status_summary": status_counts,
            "records": audit_records
        }

        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(audit_payload, f, ensure_ascii=False, indent=2)
        with open(canonical_json, "w", encoding="utf-8") as f:
            json.dump(audit_payload, f, ensure_ascii=False, indent=2)

        # 2. Build HTML report
        html_content = AuditExporter._build_html_report(project, units, audit_records, status_counts)
        with open(html_path, "w", encoding="utf-8") as f:
            f.write(html_content)
        with open(canonical_html, "w", encoding="utf-8") as f:
            f.write(html_content)

        return {
            "audit_json": str(json_path.resolve()),
            "audit_html": str(html_path.resolve()),
            "canonical_json": str(canonical_json.resolve()),
            "canonical_html": str(canonical_html.resolve())
        }

    @staticmethod
    def _build_html_report(
        project: Project,
        units: List[TranslationUnit],
        records: List[Dict[str, Any]],
        counts: Dict[str, int]
    ) -> str:
        rows_html = []
        for r in records:
            badge_class = f"badge-{r['status'].lower()}"
            val_status = "Válida" if not r.get("validation_error") else f"Error: {r['validation_error']}"
            val_class = "val-ok" if not r.get("validation_error") else "val-err"

            attrib_chips = " ".join([f"<span class='chip'>{a}</span>" for a in r.get("attributions", [])])
            prot_count = len(r.get("protected_elements", {}))

            rows_html.append(f"""
            <tr>
                <td><code>{r['key_path']}</code></td>
                <td><span class="context-tag">{r['context']}</span></td>
                <td class="text-source">{r['source_text']}</td>
                <td class="text-target">{r['target_text'] or '<em class="empty">Sin propuesta</em>'}</td>
                <td><span class="badge {badge_class}">{r['status']}</span></td>
                <td class="{val_class}">{val_status}</td>
                <td><small>{r['provider']} ({r['model']})</small></td>
                <td>{attrib_chips}</td>
                <td><small>{prot_count} elem.</small></td>
            </tr>
            """)

        total = len(units)
        return f"""<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Informe de Auditoría de Localización - {project.name}</title>
    <style>
        :root {{
            --bg-dark: #07110D;
            --primary: #2D6A4F;
            --accent: #52B788;
            --text-main: #1F2937;
            --surface: #FFFFFF;
            --border: #E5E7EB;
        }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #F8FAFC;
            color: var(--text-main);
            margin: 0;
            padding: 30px;
        }}
        .header {{
            background: linear-gradient(135deg, var(--bg-dark), var(--primary));
            color: white;
            padding: 24px 32px;
            border-radius: 12px;
            margin-bottom: 24px;
        }}
        .header h1 {{ margin: 0 0 8px 0; font-size: 24px; }}
        .header p {{ margin: 0; opacity: 0.9; font-size: 14px; }}
        .metrics-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 16px;
            margin-bottom: 24px;
        }}
        .metric-card {{
            background: var(--surface);
            padding: 16px;
            border-radius: 8px;
            border: 1px solid var(--border);
            text-align: center;
        }}
        .metric-val {{ font-size: 24px; font-weight: bold; color: var(--primary); }}
        .metric-lbl {{ font-size: 12px; color: #6B7280; text-transform: uppercase; margin-top: 4px; }}
        .table-container {{
            background: var(--surface);
            border-radius: 8px;
            border: 1px solid var(--border);
            overflow-x: auto;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
        }}
        th, td {{
            padding: 12px 14px;
            text-align: left;
            border-bottom: 1px solid var(--border);
        }}
        th {{
            background-color: #F1F5F9;
            color: #334155;
            font-weight: 600;
        }}
        tr:hover {{ background-color: #F8FAFC; }}
        .badge {{
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: bold;
        }}
        .badge-human_validated {{ background: #D1FAE5; color: #065F46; }}
        .badge-tm_match {{ background: #DBEAFE; color: #1E40AF; }}
        .badge-auto_generated {{ background: #FEF3C7; color: #92400E; }}
        .badge-needs_review {{ background: #FED7AA; color: #9A3412; }}
        .badge-validation_error {{ background: #FEE2E2; color: #991B1B; }}
        .badge-rejected {{ background: #F3F4F6; color: #4B5563; }}
        .context-tag {{
            background: #E0E7FF;
            color: #3730A3;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 11px;
        }}
        .chip {{
            display: inline-block;
            background: #E2E8F0;
            color: #334155;
            padding: 2px 6px;
            border-radius: 12px;
            font-size: 10px;
            margin: 2px;
        }}
        .val-ok {{ color: #059669; font-weight: 500; }}
        .val-err {{ color: #DC2626; font-weight: bold; }}
        .empty {{ color: #9CA3AF; }}
        code {{ font-family: monospace; font-size: 12px; color: #0F172A; }}
    </style>
</head>
<body>
    <div class="header">
        <h1>Informe de Auditoría y Localización MateJopara</h1>
        <p>Proyecto: <strong>{project.name}</strong> | Archivo fuente: <strong>{project.original_filename}</strong> | Total Unidades: <strong>{total}</strong></p>
    </div>

    <div class="metrics-grid">
        <div class="metric-card"><div class="metric-val">{total}</div><div class="metric-lbl">Total Unidades</div></div>
        <div class="metric-card"><div class="metric-val" style="color: #059669;">{counts.get('HUMAN_VALIDATED', 0)}</div><div class="metric-lbl">Aprobadas (Humano)</div></div>
        <div class="metric-card"><div class="metric-val" style="color: #2563EB;">{counts.get('TM_MATCH', 0)}</div><div class="metric-lbl">Memoria Exacta</div></div>
        <div class="metric-card"><div class="metric-val" style="color: #D97706;">{counts.get('AUTO_GENERATED', 0)}</div><div class="metric-lbl">Propuesta IA</div></div>
        <div class="metric-card"><div class="metric-val" style="color: #EA580C;">{counts.get('NEEDS_REVIEW', 0)}</div><div class="metric-lbl">Requiere Revisión</div></div>
        <div class="metric-card"><div class="metric-val" style="color: #DC2626;">{counts.get('VALIDATION_ERROR', 0)}</div><div class="metric-lbl">Errores Técnicos</div></div>
        <div class="metric-card"><div class="metric-val" style="color: #4B5563;">{counts.get('REJECTED', 0)}</div><div class="metric-lbl">Rechazadas</div></div>
    </div>

    <div class="table-container">
        <table>
            <thead>
                <tr>
                    <th>Ruta/Clave</th>
                    <th>Contexto</th>
                    <th>Texto Original (Español)</th>
                    <th>Propuesta Jopara</th>
                    <th>Estado</th>
                    <th>Validación Técnica</th>
                    <th>Proveedor / Modelo</th>
                    <th>Trazabilidad / Fuentes</th>
                    <th>Protección</th>
                </tr>
            </thead>
            <tbody>
                {''.join(rows_html)}
            </tbody>
        </table>
    </div>
</body>
</html>"""
