"""Quiz endpoints: generate (AI), retrieve (no answers leaked), submit (scored here)."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_owned_material
from app.core.database import get_db
from app.models.models import Material, Quiz, QuizAttempt, User
from app.schemas.schemas import (
    QuizAttemptOut,
    QuizOut,
    QuizQuestionResult,
    QuizSubmitRequest,
)
from app.services.ai import provider
from app.services.ai import service as ai_service
from app.services.progress import record_quiz_attempt

router = APIRouter(prefix="/api", tags=["quizzes"])


def _quiz_to_out(quiz: Quiz, latest_attempt: QuizAttempt | None) -> QuizOut:
    """Serialize without correct answers (taking view)."""
    return QuizOut(
        id=quiz.id,
        material_id=quiz.material_id,
        questions=[
            {
                "id": q.id,
                "position": q.position,
                "prompt": q.prompt,
                "options": q.options,
            }
            for q in quiz.questions
        ],
        latest_attempt=(
            QuizAttemptOut.model_validate(latest_attempt) if latest_attempt else None
        ),
    )


def _latest_attempt(db: Session, quiz_id: int, user_id: int) -> QuizAttempt | None:
    return db.scalar(
        select(QuizAttempt)
        .where(QuizAttempt.quiz_id == quiz_id, QuizAttempt.user_id == user_id)
        .order_by(QuizAttempt.id.desc())
        .limit(1)
    )


@router.post("/materials/{material_id}/quiz", response_model=QuizOut)
def generate_quiz(
    material_id: int,
    regenerate: bool = Query(False, description="Regenerate even if a quiz exists"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    material = get_owned_material(db, current_user, material_id)

    if material.status != "ready":
        raise HTTPException(
            status_code=409,
            detail="This material isn't ready yet. Wait for processing to finish or re-upload the PDF.",
        )

    existing = db.scalar(select(Quiz).where(Quiz.material_id == material.id))
    if existing is not None and not regenerate:
        return _quiz_to_out(existing, _latest_attempt(db, existing.id, current_user.id))

    try:
        quiz = ai_service.generate_quiz(db, material)
    except provider.AIServiceError as exc:
        # Roll back any partial quiz writes before surfacing the failure.
        db.rollback()
        status_code = 503 if exc.not_configured else 502
        raise HTTPException(status_code=status_code, detail=str(exc)) from exc

    return _quiz_to_out(quiz, _latest_attempt(db, quiz.id, current_user.id))


@router.get("/materials/{material_id}/quiz", response_model=QuizOut)
def get_quiz(
    material_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    material = get_owned_material(db, current_user, material_id)
    quiz = db.scalar(select(Quiz).where(Quiz.material_id == material.id))
    if quiz is None:
        raise HTTPException(status_code=404, detail="No quiz has been generated yet.")
    return _quiz_to_out(quiz, _latest_attempt(db, quiz.id, current_user.id))


@router.post("/quizzes/{quiz_id}/submit", response_model=QuizAttemptOut)
def submit_quiz(
    quiz_id: int,
    payload: QuizSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Score answers server-side; the frontend never sees correct answers
    before submission."""
    material = (
        db.scalar(
            select(Material)
            .join(Quiz, Quiz.material_id == Material.id)
            .where(Quiz.id == quiz_id, Material.user_id == current_user.id)
        )
    )
    if material is None:
        raise HTTPException(status_code=404, detail="Quiz not found")
    quiz = db.scalar(select(Quiz).where(Quiz.id == quiz_id))
    questions = {q.id: q for q in quiz.questions}

    # Validate every answer refers to a real question of this quiz with a
    # real option id; duplicates are ignored (first wins).
    results: list[QuizQuestionResult] = []
    seen: set[int] = set()
    score = 0
    for answer in payload.answers:
        if answer.question_id in seen:
            continue
        seen.add(answer.question_id)
        question = questions.get(answer.question_id)
        if question is None:
            raise HTTPException(status_code=400, detail="Unknown question in submission.")
        valid_ids = {opt["id"] for opt in question.options}
        if answer.selected_option_id not in valid_ids:
            raise HTTPException(status_code=400, detail="Unknown option in submission.")
        correct = answer.selected_option_id == question.correct_option_id
        if correct:
            score += 1
        results.append(
            QuizQuestionResult(
                questionId=question.id,
                selectedId=answer.selected_option_id,
                correct=correct,
                correctOptionId=question.correct_option_id,
                explanation=question.explanation or "",
            )
        )

    if len(results) != len(questions):
        raise HTTPException(
            status_code=400,
            detail="Please answer every question before submitting.",
        )

    total = len(questions)
    attempt = QuizAttempt(
        quiz_id=quiz.id,
        user_id=current_user.id,
        score=score,
        total=total,
        details=[r.model_dump() for r in results],
    )
    db.add(attempt)
    db.flush()

    record_quiz_attempt(db, material, score, total)
    db.commit()
    db.refresh(attempt)
    return attempt
