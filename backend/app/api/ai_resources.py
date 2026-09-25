"""Summary and flashcard generation endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_owned_material
from app.core.database import get_db
from app.models.models import Flashcard, Summary, User
from app.schemas.schemas import FlashcardOut, SummaryOut
from app.services.ai import provider
from app.services.ai import service as ai_service

router = APIRouter(prefix="/api/materials", tags=["ai-resources"])


def _require_ready(material) -> None:
    if material.status != "ready":
        raise HTTPException(
            status_code=409,
            detail="This material isn't ready yet. Wait for processing to finish or re-upload the PDF.",
        )


# --------------------------------------------------------------------------- summary


@router.get("/{material_id}/summary", response_model=SummaryOut)
def get_summary(
    material_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    material = get_owned_material(db, current_user, material_id)
    summary = db.scalar(select(Summary).where(Summary.material_id == material.id))
    if summary is None:
        raise HTTPException(status_code=404, detail="No summary has been generated yet.")
    return summary


@router.post("/{material_id}/summary", response_model=SummaryOut)
def generate_summary(
    material_id: int,
    regenerate: bool = Query(False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    material = get_owned_material(db, current_user, material_id)
    _require_ready(material)

    existing = db.scalar(select(Summary).where(Summary.material_id == material.id))
    if existing is not None and not regenerate:
        return existing

    try:
        summary = ai_service.generate_summary(db, material)
    except provider.AIServiceError as exc:
        db.rollback()
        status_code = 503 if exc.not_configured else 502
        raise HTTPException(status_code=status_code, detail=str(exc)) from exc
    return summary


# --------------------------------------------------------------------------- flashcards


@router.get("/{material_id}/flashcards", response_model=list[FlashcardOut])
def get_flashcards(
    material_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    material = get_owned_material(db, current_user, material_id)
    cards = db.scalars(
        select(Flashcard)
        .where(Flashcard.material_id == material.id)
        .order_by(Flashcard.position)
    ).all()
    return cards


@router.post("/{material_id}/flashcards", response_model=list[FlashcardOut])
def generate_flashcards(
    material_id: int,
    regenerate: bool = Query(False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    material = get_owned_material(db, current_user, material_id)
    _require_ready(material)

    existing = db.scalars(select(Flashcard).where(Flashcard.material_id == material.id)).all()
    if existing and not regenerate:
        return existing

    try:
        cards = ai_service.generate_flashcards(db, material)
    except provider.AIServiceError as exc:
        db.rollback()
        status_code = 503 if exc.not_configured else 502
        raise HTTPException(status_code=status_code, detail=str(exc)) from exc
    return cards
