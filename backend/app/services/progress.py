"""Progress tracking helpers.

All progress math lives here — the frontend reads these results instead of
duplicating the calculation in React components.
"""

from collections import defaultdict

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.models import Material, MaterialProgress, Quiz, QuizAttempt, Subject, User


def ensure_progress_row(db: Session, material: Material) -> MaterialProgress:
    """Get or create the 1:1 progress row for a material."""
    row = db.scalar(select(MaterialProgress).where(MaterialProgress.material_id == material.id))
    if row is None:
        row = MaterialProgress(material_id=material.id, user_id=material.user_id)
        db.add(row)
        db.flush()
    return row


def mark_started(db: Session, material: Material) -> None:
    """Promote a material to in-progress (only from not-started)."""
    row = ensure_progress_row(db, material)
    if row.completion_status == "not-started":
        row.completion_status = "in-progress"
        db.add(row)


def record_quiz_attempt(
    db: Session, material: Material, score: int, total: int
) -> MaterialProgress:
    """Mark completed (quizzes complete a material) and store the score."""
    row = ensure_progress_row(db, material)
    row.completion_status = "completed"
    row.quiz_attempts += 1
    row.last_score = score
    row.last_total = total
    db.add(row)
    return row


def _avg(scores: list[tuple[int, int | None]]) -> int | None:
    """Average score percent from (score, total) pairs; None when no data."""
    pairs = [(s, t) for s, t in scores if s is not None and t]
    if not pairs:
        return None
    return round(sum(s / t for s, t in pairs) * 100 / len(pairs))


def get_user_progress(db: Session, user: User) -> dict:
    """Aggregate progress across every subject the user owns."""
    subjects = db.scalars(select(Subject).where(Subject.user_id == user.id)).all()

    subject_rows: list[dict] = []
    totals = defaultdict(int)
    all_scores: list[tuple[int, int | None]] = []

    for subject in subjects:
        materials = db.scalars(select(Material).where(Material.subject_id == subject.id)).all()
        progress_by_material = {
            row.material_id: row
            for row in db.scalars(
                select(MaterialProgress).where(
                    MaterialProgress.user_id == user.id,
                    MaterialProgress.material_id.in_([m.id for m in materials] or [-1]),
                )
            )
        }

        started = completed = attempts = 0
        scores: list[tuple[int, int | None]] = []
        for material in materials:
            row = progress_by_material.get(material.id)
            status = row.completion_status if row else "not-started"
            if status != "not-started":
                started += 1
            if status == "completed":
                completed += 1
            if row:
                attempts += row.quiz_attempts
                if row.last_score is not None and row.last_total:
                    scores.append((row.last_score, row.last_total))

        total = len(materials)
        subject_rows.append(
            {
                "subject_id": subject.id,
                "subject_name": subject.name,
                "total_materials": total,
                "started_materials": started,
                "completed_materials": completed,
                "percent": round(completed / total * 100) if total else 0,
                "quiz_attempts": attempts,
                "average_score_percent": _avg(scores),
            }
        )

        totals["total_materials"] += total
        totals["started_materials"] += started
        totals["completed_materials"] += completed
        totals["quiz_attempts"] += attempts
        all_scores.extend(scores)

    overall = totals["total_materials"]
    return {
        "totals": {
            "total_subjects": len(subjects),
            "total_materials": totals["total_materials"],
            "started_materials": totals["started_materials"],
            "completed_materials": totals["completed_materials"],
            "overall_percent": round(totals["completed_materials"] / overall * 100) if overall else 0,
            "quiz_attempts": totals["quiz_attempts"],
            "average_score_percent": _avg(all_scores),
        },
        "subjects": subject_rows,
    }


def quiz_attempt_count(db: Session, quiz_id: int, user_id: int) -> int:
    return db.scalar(
        select(func.count())
        .select_from(QuizAttempt)
        .where(QuizAttempt.quiz_id == quiz_id, QuizAttempt.user_id == user_id)
    ) or 0


def quiz_exists_for_material(db: Session, material_id: int) -> Quiz | None:
    return db.scalar(select(Quiz).where(Quiz.material_id == material_id))
