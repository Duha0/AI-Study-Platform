"""Subject endpoints. Every query is scoped to the current user."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_owned_subject
from app.core.database import get_db
from app.models.models import Material, MaterialProgress, Subject, User
from app.schemas.schemas import MaterialOut, SubjectCreate, SubjectDetail, SubjectOut, SubjectUpdate

router = APIRouter(prefix="/api/subjects", tags=["subjects"])


def _subject_stats(db: Session, subject: Subject) -> dict:
    """Material count + completion counts for the card progress bars."""
    materials = db.scalars(select(Material).where(Material.subject_id == subject.id)).all()
    rows = {
        r.material_id: r
        for r in db.scalars(
            select(MaterialProgress).where(
                MaterialProgress.material_id.in_([m.id for m in materials] or [-1])
            )
        )
    }
    completed = sum(
        1 for m in materials if (rows.get(m.id) and rows[m.id].completion_status == "completed")
    )
    return {"material_count": len(materials), "completed_materials": completed}


@router.get("", response_model=list[SubjectOut])
def list_subjects(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    subjects = db.scalars(select(Subject).where(Subject.user_id == current_user.id)).all()
    return [
        SubjectOut(
            id=s.id,
            name=s.name,
            description=s.description,
            color=s.color,
            created_at=s.created_at,
            **_subject_stats(db, s),
        )
        for s in subjects
    ]


@router.post("", response_model=SubjectOut, status_code=201)
def create_subject(
    payload: SubjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    subject = Subject(
        user_id=current_user.id,
        name=payload.name.strip(),
        description=payload.description.strip(),
        color="#3B7C99",
    )
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return SubjectOut(
        id=subject.id,
        name=subject.name,
        description=subject.description,
        color=subject.color,
        created_at=subject.created_at,
        material_count=0,
        completed_materials=0,
    )


@router.get("/{subject_id}", response_model=SubjectDetail)
def get_subject(
    subject_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    subject = get_owned_subject(db, current_user, subject_id)
    stats = _subject_stats(db, subject)
    materials = db.scalars(
        select(Material).where(Material.subject_id == subject.id).order_by(Material.id.desc())
    ).all()
    progress_rows = {
        r.material_id: r
        for r in db.scalars(
            select(MaterialProgress).where(
                MaterialProgress.material_id.in_([m.id for m in materials] or [-1])
            )
        )
    }
    materials_out = []
    for m in materials:
        out = MaterialOut.model_validate(m)
        row = progress_rows.get(m.id)
        out.completion_status = row.completion_status if row else "not-started"
        materials_out.append(out)
    detail = SubjectDetail(
        id=subject.id,
        name=subject.name,
        description=subject.description,
        color=subject.color,
        created_at=subject.created_at,
        materials=materials_out,
        **stats,
    )
    return detail


@router.patch("/{subject_id}", response_model=SubjectOut)
def update_subject(
    subject_id: int,
    payload: SubjectUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    subject = get_owned_subject(db, current_user, subject_id)
    if payload.name is not None:
        subject.name = payload.name.strip()
    if payload.description is not None:
        subject.description = payload.description.strip()
    db.add(subject)
    db.commit()
    db.refresh(subject)
    stats = _subject_stats(db, subject)
    return SubjectOut(
        id=subject.id,
        name=subject.name,
        description=subject.description,
        color=subject.color,
        created_at=subject.created_at,
        **stats,
    )


@router.delete("/{subject_id}", status_code=204)
def delete_subject(
    subject_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    subject = get_owned_subject(db, current_user, subject_id)
    db.delete(subject)
    db.commit()
