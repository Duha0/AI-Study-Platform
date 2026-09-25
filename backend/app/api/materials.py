"""Material endpoints: upload (with text extraction), detail, delete, start."""

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_owned_material, get_owned_subject
from app.core.config import get_settings
from app.core.database import get_db
from app.models.models import Material, User
from app.schemas.schemas import MaterialDetail, MaterialOut, UploadResponse
from app.services import local_file_storage
from app.services.pdf_extraction import EmptyExtractionError, ExtractionError, extract_pdf_text
from app.services.progress import mark_started

settings = get_settings()

router = APIRouter(prefix="/api/materials", tags=["materials"])

subjects_router = APIRouter(prefix="/api/subjects", tags=["materials"])


def _process_upload(db: Session, material: Material, content: bytes) -> None:
    """Extract text and update the material's status. Never raises."""
    try:
        material.extracted_text = extract_pdf_text(content)
        material.status = "ready"
        material.status_message = ""
    except EmptyExtractionError as exc:
        material.status = "failed"
        material.status_message = str(exc)
    except ExtractionError as exc:
        material.status = "failed"
        material.status_message = str(exc)
    except Exception:  # noqa: BLE001 — extraction must never crash the request
        material.status = "failed"
        material.status_message = "Something went wrong while reading this PDF."
    db.add(material)
    db.commit()
    db.refresh(material)


@subjects_router.post("/{subject_id}/materials", response_model=UploadResponse, status_code=201)
async def upload_material(
    subject_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    subject = get_owned_subject(db, current_user, subject_id)

    if (file.content_type or "") not in ("application/pdf",) and not (
        file.filename or ""
    ).lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="The selected file is empty.")
    if len(content) > settings.max_upload_bytes:
        limit_mb = settings.max_upload_bytes // (1024 * 1024)
        raise HTTPException(status_code=413, detail=f"File is too large. Maximum is {limit_mb} MB.")

    stored_name = local_file_storage.save_pdf(content)
    material = Material(
        subject_id=subject.id,
        user_id=current_user.id,
        filename=(file.filename or "upload.pdf")[:512],
        stored_name=stored_name,
        size_bytes=len(content),
        status="processing",
    )
    db.add(material)
    db.commit()
    db.refresh(material)

    _process_upload(db, material, content)
    return UploadResponse(
        message="Upload complete." if material.status == "ready" else "Processed with issues.",
        material=MaterialOut.model_validate(material),
    )


@router.get("/{material_id}", response_model=MaterialDetail)
def get_material(
    material_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    material = get_owned_material(db, current_user, material_id)
    detail = MaterialDetail.model_validate(material)
    detail.extracted_text_preview = (material.extracted_text or "")[:500]
    return detail


@router.delete("/{material_id}", status_code=204)
def delete_material(
    material_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    material = get_owned_material(db, current_user, material_id)
    local_file_storage.delete_file(material.stored_name)
    db.delete(material)
    db.commit()


@router.post("/{material_id}/start", response_model=MaterialOut)
def start_material(
    material_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Opening a material marks it in-progress (first open only)."""
    material = get_owned_material(db, current_user, material_id)
    mark_started(db, material)
    db.commit()
    db.refresh(material)
    return MaterialOut.model_validate(material)
