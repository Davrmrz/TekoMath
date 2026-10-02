import os
import json
import shutil
import logging
from pathlib import Path
from contextlib import asynccontextmanager
from typing import Optional, List, Dict, Any

from fastapi import (
    FastAPI, Request, Depends, HTTPException, UploadFile, File, Form, status
)
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.config import settings
from app.database.connection import get_db, init_db
from app.database.models import Project, TranslationUnit, GlossaryItem, TranslationMemory, AppSetting
from app.core.contexts import ContextType, detect_context
from app.core.provenance import ProvenanceManager
from app.core.glossary import GlossaryService
from app.core.memory import MemoryService
from app.core.translator import TranslatorCoordinator
from app.importers import get_importer_for_file
from app.exporters import export_project, evaluate_project_export_readiness
from app.providers import get_provider

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    settings.ensure_directories()
    init_db()
    logger.info("MateJopara Localization Tool initialized successfully.")
    yield
    logger.info("Shutting down MateJopara Localization Tool.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan
)

# Static and Templates
STATIC_DIR = settings.BASE_DIR / "app" / "static"
TEMPLATES_DIR = settings.BASE_DIR / "app" / "templates"

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
templates = Jinja2Templates(directory=TEMPLATES_DIR)

def mask_secret(secret: Optional[str]) -> str:
    if not secret:
        return ""
    if len(secret) <= 8:
        return "********"
    return f"{secret[:4]}...{secret[-4:]}"

# ==============================================================================
# VIEW ROUTES
# ==============================================================================

@app.get("/", response_class=HTMLResponse)
async def dashboard_view(request: Request, db: Session = Depends(get_db)):
    projects = db.query(Project).order_by(Project.created_at.desc()).all()
    total_units = db.query(TranslationUnit).count()
    human_val = db.query(TranslationUnit).filter(TranslationUnit.status == "HUMAN_VALIDATED").count()
    tm_match = db.query(TranslationUnit).filter(TranslationUnit.status == "TM_MATCH").count()
    auto_gen = db.query(TranslationUnit).filter(TranslationUnit.status == "AUTO_GENERATED").count()
    val_err = db.query(TranslationUnit).filter(TranslationUnit.status == "VALIDATION_ERROR").count()

    stats = {
        "total_projects": len(projects),
        "total_units": total_units,
        "human_validated": human_val,
        "tm_matches": tm_match,
        "auto_generated": auto_gen,
        "validation_errors": val_err
    }

    return templates.TemplateResponse(
        request=request,
        name="dashboard.html",
        context={
            "active_page": "dashboard",
            "stats": stats,
            "projects": projects[:10]
        }
    )

@app.get("/import", response_class=HTMLResponse)
async def import_view(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="import.html",
        context={"active_page": "import"}
    )

@app.get("/translations", response_class=HTMLResponse)
async def translations_index_view(request: Request, db: Session = Depends(get_db)):
    latest_project = db.query(Project).order_by(Project.created_at.desc()).first()
    if latest_project:
        return RedirectResponse(url=f"/translations/{latest_project.id}", status_code=status.HTTP_302_FOUND)
    return RedirectResponse(url="/import", status_code=status.HTTP_302_FOUND)

@app.get("/translations/{project_id}", response_class=HTMLResponse)
async def translations_project_view(project_id: str, request: Request, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado.")

    units = db.query(TranslationUnit).filter(TranslationUnit.project_id == project_id).order_by(TranslationUnit.item_index.asc()).all()

    return templates.TemplateResponse(
        request=request,
        name="translations.html",
        context={
            "active_page": "translations",
            "project": project,
            "units": units
        }
    )

@app.get("/review/{project_id}", response_class=HTMLResponse)
async def review_view(project_id: str, request: Request, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado.")

    units = db.query(TranslationUnit).filter(TranslationUnit.project_id == project_id).order_by(TranslationUnit.item_index.asc()).all()

    return templates.TemplateResponse(
        request=request,
        name="review.html",
        context={
            "active_page": "review",
            "project": project,
            "units": units
        }
    )

@app.get("/glossary", response_class=HTMLResponse)
async def glossary_view(request: Request, db: Session = Depends(get_db)):
    items = GlossaryService.list_items(db)
    return templates.TemplateResponse(
        request=request,
        name="glossary.html",
        context={
            "active_page": "glossary",
            "items": items
        }
    )

@app.get("/memory", response_class=HTMLResponse)
async def memory_view(request: Request, db: Session = Depends(get_db)):
    entries = MemoryService.list_entries(db)
    return templates.TemplateResponse(
        request=request,
        name="memory.html",
        context={
            "active_page": "memory",
            "entries": entries
        }
    )

@app.get("/sources", response_class=HTMLResponse)
async def sources_view(request: Request):
    sources = ProvenanceManager.get_sources()
    return templates.TemplateResponse(
        request=request,
        name="sources.html",
        context={
            "active_page": "sources",
            "sources": sources
        }
    )

@app.get("/export/{project_id}", response_class=HTMLResponse)
async def export_view(project_id: str, request: Request, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado.")

    units = db.query(TranslationUnit).filter(TranslationUnit.project_id == project_id).all()
    summary = evaluate_project_export_readiness(units)

    return templates.TemplateResponse(
        request=request,
        name="export.html",
        context={
            "active_page": "export",
            "project": project,
            "summary": summary,
            "export_result": None
        }
    )

@app.get("/settings", response_class=HTMLResponse)
async def settings_view(request: Request, db: Session = Depends(get_db)):
    def get_setting(k: str, default: str) -> str:
        s = db.query(AppSetting).filter(AppSetting.key == k).first()
        return s.value if s and s.value else default

    active_provider = get_setting("DEFAULT_PROVIDER", settings.DEFAULT_PROVIDER)
    gemini_key = get_setting("GEMINI_API_KEY", settings.GEMINI_API_KEY)
    gemini_model = get_setting("GEMINI_MODEL", settings.GEMINI_MODEL)
    openai_key = get_setting("OPENAI_API_KEY", settings.OPENAI_API_KEY)
    openai_url = get_setting("OPENAI_BASE_URL", settings.OPENAI_BASE_URL)
    openai_model = get_setting("OPENAI_MODEL", settings.OPENAI_MODEL)
    max_retries = get_setting("MAX_RETRIES", str(settings.MAX_RETRIES))
    prompt_version = get_setting("PROMPT_VERSION", settings.PROMPT_VERSION)

    return templates.TemplateResponse(
        request=request,
        name="settings.html",
        context={
            "active_page": "settings",
            "active_provider": active_provider,
            "gemini_key_masked": mask_secret(gemini_key),
            "gemini_model": gemini_model,
            "openai_key_masked": mask_secret(openai_key),
            "openai_url": openai_url,
            "openai_model": openai_model,
            "max_retries": max_retries,
            "prompt_version": prompt_version
        }
    )

# ==============================================================================
# API ENDPOINTS
# ==============================================================================

@app.post("/api/upload")
async def upload_file_endpoint(
    file: UploadFile = File(...),
    project_name: Optional[str] = Form(None),
    format: Optional[str] = Form("auto"),
    delimiter: Optional[str] = Form(None),
    source_column: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    filename = file.filename or "archivo_sin_nombre"
    content_bytes = await file.read()

    # Save to input/ without modifying original
    input_path = settings.INPUT_DIR / filename
    with open(input_path, "wb") as f:
        f.write(content_bytes)

    importer = get_importer_for_file(filename)
    try:
        import_res = importer.parse(
            content_bytes=content_bytes,
            filename=filename,
            delimiter=delimiter,
            source_column=source_column
        )
    except Exception as e:
        logger.error("Error al analizar archivo importado: %s", e)
        raise HTTPException(status_code=400, detail=f"Error al analizar el archivo: {str(e)}")

    p_name = project_name.strip() if project_name and project_name.strip() else Path(filename).stem
    project = Project(
        name=p_name,
        original_filename=filename,
        file_format=import_res.file_format,
        raw_metadata=json.dumps(import_res.raw_metadata, ensure_ascii=False),
        delimiter=import_res.detected_delimiter,
        source_column=import_res.detected_source_column
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    for it in import_res.items:
        u = TranslationUnit(
            project_id=project.id,
            item_index=it.item_index,
            key_path=it.key_path,
            source_text=it.source_text,
            context=it.context.value,
            status="NEW"
        )
        db.add(u)
    db.commit()

    logger.info("Imported %d units into project %s.", len(import_res.items), project.id)
    return RedirectResponse(url=f"/translations/{project.id}", status_code=status.HTTP_303_SEE_OTHER)

@app.post("/api/load-demo")
async def load_demo_endpoint(db: Session = Depends(get_db)):
    demo_file = settings.DATA_DIR / "demo" / "demo_es.json"
    if not demo_file.exists():
        raise HTTPException(status_code=404, detail="demo_es.json no encontrado.")

    with open(demo_file, "rb") as f:
        content_bytes = f.read()

    dest_input = settings.INPUT_DIR / "demo_es.json"
    with open(dest_input, "wb") as f:
        f.write(content_bytes)

    importer = get_importer_for_file("demo_es.json")
    import_res = importer.parse(content_bytes=content_bytes, filename="demo_es.json")

    project = Project(
        name="MateJopara Demo Curricular",
        original_filename="demo_es.json",
        file_format="json",
        raw_metadata=json.dumps(import_res.raw_metadata, ensure_ascii=False)
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    for it in import_res.items:
        u = TranslationUnit(
            project_id=project.id,
            item_index=it.item_index,
            key_path=it.key_path,
            source_text=it.source_text,
            context=it.context.value,
            status="NEW"
        )
        db.add(u)
    db.commit()

    return RedirectResponse(url=f"/translations/{project.id}", status_code=status.HTTP_303_SEE_OTHER)

@app.post("/api/projects/{project_id}/translate-all")
async def translate_all_endpoint(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado.")

    units = db.query(TranslationUnit).filter(TranslationUnit.project_id == project_id).all()
    if not units:
        return JSONResponse({"processed": 0, "message": "No hay unidades para procesar."})

    coordinator = TranslatorCoordinator(max_retries=settings.MAX_RETRIES)
    stats = await coordinator.translate_batch(db=db, units=units)

    return JSONResponse(stats)

@app.post("/api/projects/{project_id}/retry-errors")
async def retry_errors_endpoint(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado.")

    units = db.query(TranslationUnit).filter(
        TranslationUnit.project_id == project_id,
        TranslationUnit.status == "VALIDATION_ERROR"
    ).all()

    if not units:
        return JSONResponse({"processed": 0, "errors": 0, "message": "No existen unidades con error."})

    coordinator = TranslatorCoordinator(max_retries=settings.MAX_RETRIES)
    stats = await coordinator.translate_batch(db=db, units=units)
    return JSONResponse(stats)

@app.post("/api/units/{unit_id}/approve")
async def approve_unit_endpoint(unit_id: str, db: Session = Depends(get_db)):
    unit = db.query(TranslationUnit).filter(TranslationUnit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unidad no encontrada.")

    unit.status = "HUMAN_VALIDATED"
    db.commit()

    MemoryService.store(
        db=db,
        source_text=unit.source_text,
        target_text=unit.target_text,
        context=unit.context,
        approved_by="human_reviewer"
    )

    return JSONResponse({"status": "HUMAN_VALIDATED", "id": unit.id})

@app.post("/api/units/{unit_id}/reject")
async def reject_unit_endpoint(unit_id: str, db: Session = Depends(get_db)):
    unit = db.query(TranslationUnit).filter(TranslationUnit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unidad no encontrada.")

    unit.status = "REJECTED"
    db.commit()
    return JSONResponse({"status": "REJECTED", "id": unit.id})

class SaveEditRequest(BaseModel):
    text: str

@app.post("/api/units/{unit_id}/save-edit")
async def save_edit_endpoint(unit_id: str, payload: SaveEditRequest, db: Session = Depends(get_db)):
    unit = db.query(TranslationUnit).filter(TranslationUnit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unidad no encontrada.")

    unit.target_text = payload.text
    unit.human_edited = True

    coordinator = TranslatorCoordinator()
    try:
        prot_map = json.loads(unit.protected_items_json or "{}")
    except Exception:
        prot_map = {}

    constraints = GlossaryService.get_constraints(db, ContextType(unit.context), unit.source_text)
    val_res = coordinator.validator.validate(
        source_text=unit.source_text,
        target_text=payload.text,
        protected_item_map=prot_map,
        keep_spanish_terms=constraints.keep_spanish,
        forbidden_terms=constraints.forbidden
    )

    unit.validation_json = json.dumps(val_res.model_dump(), ensure_ascii=False)
    if val_res.is_valid:
        unit.validation_error = None
        if unit.status != "HUMAN_VALIDATED":
            unit.status = "AUTO_GENERATED"
    else:
        unit.status = "VALIDATION_ERROR"
        unit.validation_error = "; ".join(val_res.errors)

    db.commit()
    return JSONResponse({"status": unit.status, "target_text": unit.target_text})

@app.post("/api/units/{unit_id}/regenerate")
async def regenerate_unit_endpoint(unit_id: str, db: Session = Depends(get_db)):
    unit = db.query(TranslationUnit).filter(TranslationUnit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unidad no encontrada.")

    coordinator = TranslatorCoordinator(max_retries=settings.MAX_RETRIES)
    ctx_enum = ContextType(unit.context) if unit.context in ContextType.__members__ else ContextType.GENERAL

    res = await coordinator.translate_single(db=db, source_text=unit.source_text, context=ctx_enum)

    unit.target_text = res.target_text
    unit.status = res.status
    unit.provider_used = res.provider_used
    unit.model_used = res.model_used
    unit.protected_items_json = json.dumps(res.protected_items, ensure_ascii=False)
    unit.validation_json = json.dumps(res.validation.model_dump(), ensure_ascii=False)
    unit.validation_error = "; ".join(res.validation.errors) if res.validation.errors else None
    unit.glossary_terms_json = json.dumps(res.glossary_terms, ensure_ascii=False)
    unit.sources_json = json.dumps(res.sources, ensure_ascii=False)
    unit.retry_count = res.retry_count
    unit.human_edited = False
    db.commit()

    return JSONResponse({"status": unit.status, "target_text": unit.target_text})

class GlossaryCreateRequest(BaseModel):
    source_term: str
    preferred_output: str
    status: str = "PREFERRED"
    reason: Optional[str] = ""

@app.post("/api/glossary")
async def add_glossary_endpoint(
    source_term: str = Form(None),
    preferred_output: str = Form(None),
    status: str = Form("PREFERRED"),
    reason: Optional[str] = Form(""),
    req_body: Optional[GlossaryCreateRequest] = None,
    db: Session = Depends(get_db)
):
    s_term = req_body.source_term if req_body else source_term
    p_out = req_body.preferred_output if req_body else preferred_output
    stat = req_body.status if req_body else status
    reas = req_body.reason if req_body else reason

    if not s_term or not p_out:
        raise HTTPException(status_code=400, detail="source_term y preferred_output son requeridos.")

    item = GlossaryService.add_item(
        db=db,
        source_term=s_term,
        preferred_output=p_out,
        status=stat,
        reason=reas or ""
    )

    if req_body:
        return JSONResponse({"id": item.id, "source_term": item.source_term})
    return RedirectResponse(url="/glossary", status_code=status.HTTP_303_SEE_OTHER)

@app.delete("/api/glossary/{item_id}")
async def delete_glossary_endpoint(item_id: str, db: Session = Depends(get_db)):
    success = GlossaryService.delete_item(db, item_id)
    if not success:
        raise HTTPException(status_code=404, detail="Término no encontrado.")
    return JSONResponse({"success": True})

@app.delete("/api/memory/{entry_id}")
async def delete_memory_endpoint(entry_id: str, db: Session = Depends(get_db)):
    success = MemoryService.delete_entry(db, entry_id)
    if not success:
        raise HTTPException(status_code=404, detail="Entrada no encontrada.")
    return JSONResponse({"success": True})

@app.post("/api/projects/{project_id}/export")
async def export_project_endpoint(
    project_id: str,
    request: Request,
    allow_preliminary: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado.")

    units = db.query(TranslationUnit).filter(TranslationUnit.project_id == project_id).all()
    is_preliminary = allow_preliminary in ("true", "True", "1", "on")

    try:
        result = export_project(
            project=project,
            units=units,
            output_dir=settings.OUTPUT_DIR,
            allow_preliminary=is_preliminary
        )
    except Exception as e:
        logger.error("Error al exportar: %s", e)
        raise HTTPException(status_code=400, detail=str(e))

    summary = evaluate_project_export_readiness(units)
    return templates.TemplateResponse(
        request=request,
        name="export.html",
        context={
            "active_page": "export",
            "project": project,
            "summary": summary,
            "export_result": result
        }
    )

@app.get("/api/download/file")
async def download_file_endpoint(path: str):
    file_path = Path(path).resolve()
    if not str(file_path).startswith(str(settings.BASE_DIR.resolve())):
        raise HTTPException(status_code=403, detail="Acceso denegado a ruta externa.")
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Archivo no encontrado.")
    return FileResponse(path=str(file_path), filename=file_path.name)

@app.get("/output/report", response_class=HTMLResponse)
async def view_report_endpoint():
    report_file = settings.OUTPUT_DIR / "translation_report.html"
    if not report_file.exists():
        raise HTTPException(status_code=404, detail="Informe de auditoría aún no generado. Exporte un proyecto primero.")
    with open(report_file, "r", encoding="utf-8") as f:
        content = f.read()
    return HTMLResponse(content=content)

@app.post("/api/settings")
async def save_settings_endpoint(
    DEFAULT_PROVIDER: str = Form(...),
    GEMINI_API_KEY: Optional[str] = Form(None),
    GEMINI_MODEL: Optional[str] = Form(None),
    OPENAI_API_KEY: Optional[str] = Form(None),
    OPENAI_BASE_URL: Optional[str] = Form(None),
    OPENAI_MODEL: Optional[str] = Form(None),
    MAX_RETRIES: Optional[str] = Form("2"),
    db: Session = Depends(get_db)
):
    updates = {
        "DEFAULT_PROVIDER": DEFAULT_PROVIDER,
        "GEMINI_MODEL": GEMINI_MODEL,
        "OPENAI_BASE_URL": OPENAI_BASE_URL,
        "OPENAI_MODEL": OPENAI_MODEL,
        "MAX_RETRIES": MAX_RETRIES
    }
    if GEMINI_API_KEY and GEMINI_API_KEY.strip():
        updates["GEMINI_API_KEY"] = GEMINI_API_KEY.strip()
    if OPENAI_API_KEY and OPENAI_API_KEY.strip():
        updates["OPENAI_API_KEY"] = OPENAI_API_KEY.strip()

    for k, v in updates.items():
        if v is not None:
            existing = db.query(AppSetting).filter(AppSetting.key == k).first()
            if existing:
                existing.value = str(v)
            else:
                db.add(AppSetting(key=k, value=str(v)))
    db.commit()

    return RedirectResponse(url="/settings", status_code=status.HTTP_303_SEE_OTHER)

@app.post("/api/settings/test-connection")
async def test_connection_endpoint(db: Session = Depends(get_db)):
    provider = get_provider(db=db)
    result = await provider.test_connection()
    return JSONResponse(result.model_dump())
