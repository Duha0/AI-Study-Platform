"""AI orchestration: prompt building, structured output validation, persistence.

Callers (API routers) hand this a material with extracted text and get back
validated, persisted Summary/Quiz/Flashcard rows — or an AIServiceError with
a user-actionable message.
"""

from pydantic import BaseModel, Field, ValidationError
from sqlalchemy.orm import Session

from app.models.models import Flashcard, Question, Quiz, Summary
from app.services.ai import prompts, provider


# --------------------------------------------------------------------------- validation models


class SummaryResult(BaseModel):
    intro: str = Field(min_length=1)
    points: list[str] = Field(min_length=1)


class QuizQuestionResult(BaseModel):
    prompt: str = Field(min_length=1)
    options: list[str] = Field(min_length=2, max_length=6)
    correct_index: int = Field(ge=0)
    explanation: str = ""


class QuizResult(BaseModel):
    questions: list[QuizQuestionResult] = Field(min_length=1, max_length=20)


class FlashcardResult(BaseModel):
    front: str = Field(min_length=1)
    back: str = Field(min_length=1)


class FlashcardsResult(BaseModel):
    cards: list[FlashcardResult] = Field(min_length=1, max_length=50)


# --------------------------------------------------------------------------- helpers


def _require_text(material) -> str:
    text = (material.extracted_text or "").strip()
    if not text:
        raise provider.AIServiceError(
            "This material has no extracted text to study from (it may have "
            "failed processing). Upload a text-based PDF and try again."
        )
    return text


def _normalize_option_letters(count: int) -> list[str]:
    return ["abcd"[i] if i < 4 else chr(ord("a") + i) for i in range(count)]


# --------------------------------------------------------------------------- public API


def generate_summary(db: Session, material) -> Summary:
    """Generate (or overwrite, when called for regeneration) the summary."""
    text = _require_text(material)
    system, user = prompts.build_summary_prompt(text)
    data = provider.generate_json(system, user)

    try:
        result = SummaryResult.model_validate(data)
    except ValidationError as exc:
        raise provider.AIServiceError("AI returned a summary in an unexpected format.") from exc

    summary = db.scalar(select_summary(material.id))
    if summary is None:
        summary = Summary(material_id=material.id)
    summary.intro = result.intro.strip()
    summary.points = [p.strip() for p in result.points if p.strip()]
    summary.model = provider._default_model()
    db.add(summary)
    db.commit()
    db.refresh(summary)
    return summary


def select_summary(material_id: int):
    from sqlalchemy import select

    return select(Summary).where(Summary.material_id == material_id)


def generate_quiz(db: Session, material, num_questions: int = 5) -> Quiz:
    """Generate (or overwrite) the quiz for a material."""
    text = _require_text(material)
    system, user = prompts.build_quiz_prompt(text, num_questions)
    data = provider.generate_json(system, user)

    try:
        result = QuizResult.model_validate(data)
    except ValidationError as exc:
        raise provider.AIServiceError("AI returned a quiz in an unexpected format.") from exc

    # Normalize/validate each question; drop nothing silently — malformed
    # shapes already failed validation above.
    letters = _normalize_option_letters(4)

    quiz = db.scalar(select_quiz(material.id))
    if quiz is None:
        quiz = Quiz(material_id=material.id)
        db.add(quiz)
        db.flush()
    else:
        # Regeneration replaces old questions; attempts keep their copies.
        for old in list(quiz.questions):
            db.delete(old)
        db.flush()

    for position, q in enumerate(result.questions):
        idx = q.correct_index
        if idx >= len(q.options):
            raise provider.AIServiceError("AI returned a quiz with an out-of-range answer.")
        db.add(
            Question(
                quiz_id=quiz.id,
                position=position,
                prompt=q.prompt.strip(),
                options=[{"id": letters[i], "text": opt.strip()} for i, opt in enumerate(q.options)],
                correct_option_id=letters[idx],
                explanation=(q.explanation or "").strip(),
            )
        )

    quiz.model = provider._default_model()
    db.add(quiz)
    db.commit()
    db.refresh(quiz)
    return quiz


def select_quiz(material_id: int):
    from sqlalchemy import select

    return select(Quiz).where(Quiz.material_id == material_id)


def generate_flashcards(db: Session, material, num_cards: int = 8) -> list[Flashcard]:
    """Generate (or overwrite) flashcards for a material."""
    text = _require_text(material)
    system, user = prompts.build_flashcards_prompt(text, num_cards)
    data = provider.generate_json(system, user)

    try:
        result = FlashcardsResult.model_validate(data)
    except ValidationError as exc:
        raise provider.AIServiceError("AI returned flashcards in an unexpected format.") from exc

    # Regeneration replaces old cards.
    db.query(Flashcard).filter(Flashcard.material_id == material.id).delete()
    db.flush()

    cards = [
        Flashcard(
            material_id=material.id,
            position=i,
            front=c.front.strip(),
            back=c.back.strip(),
        )
        for i, c in enumerate(result.cards)
    ]
    db.add_all(cards)
    db.commit()
    for card in cards:
        db.refresh(card)
    return cards
