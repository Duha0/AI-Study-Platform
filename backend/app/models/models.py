"""SQLAlchemy models.

Layout follows the product domain:
User ─ subjects ─ materials ─┬─ summary
                             ├─ quiz ─ questions (+ optional attempts)
                             ├─ flashcards
                             └─ progress (1:1 per material)

Every user-owned row carries a user_id FK so ownership checks can be
enforced at the query level, never just by trusting a client-provided id.
"""

from datetime import datetime, timezone

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

UTC = timezone.utc


def utcnow() -> datetime:
    return datetime.now(UTC)


# --- Enum values (kept as plain strings so they serialize cleanly to JSON) ---
MATERIAL_STATUSES = ("uploading", "processing", "ready", "failed")
COMPLETION_STATUSES = ("not-started", "in-progress", "completed")


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(255), default="")
    password_hash: Mapped[str] = mapped_column(String(255))
    # Onboarding/profile fields (the UI already collects these).
    study_level: Mapped[str] = mapped_column(String(64), default="")
    studying: Mapped[str] = mapped_column(String(255), default="")
    onboarding_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    subjects: Mapped[list["Subject"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )


class Subject(Base):
    __tablename__ = "subjects"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text, default="")
    color: Mapped[str] = mapped_column(String(16), default="#3B7C99")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    user: Mapped[User] = relationship(back_populates="subjects")
    materials: Mapped[list["Material"]] = relationship(
        back_populates="subject", cascade="all, delete-orphan"
    )


class Material(Base):
    __tablename__ = "materials"

    id: Mapped[int] = mapped_column(primary_key=True)
    subject_id: Mapped[int] = mapped_column(ForeignKey("subjects.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)

    filename: Mapped[str] = mapped_column(String(512))
    stored_name: Mapped[str] = mapped_column(String(512))  # name on disk inside uploads_dir
    size_bytes: Mapped[int] = mapped_column(Integer, default=0)
    # upload | processing | ready | failed
    status: Mapped[str] = mapped_column(
        Enum(*MATERIAL_STATUSES, name="material_status"), default="processing"
    )
    # Human-facing explanation when extraction fails (scanned/empty/corrupt).
    status_message: Mapped[str] = mapped_column(Text, default="")
    extracted_text: Mapped[str] = mapped_column(Text, default="")  # long — kept out of list payloads
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    subject: Mapped[Subject] = relationship(back_populates="materials")
    summary: Mapped["Summary | None"] = relationship(
        back_populates="material", uselist=False, cascade="all, delete-orphan"
    )
    quiz: Mapped["Quiz | None"] = relationship(
        back_populates="material", uselist=False, cascade="all, delete-orphan"
    )
    flashcards: Mapped[list["Flashcard"]] = relationship(
        back_populates="material", cascade="all, delete-orphan"
    )
    progress: Mapped["MaterialProgress | None"] = relationship(
        back_populates="material", uselist=False, cascade="all, delete-orphan"
    )


class Summary(Base):
    """One generated summary per material (regeneration overwrites it)."""

    __tablename__ = "summaries"

    id: Mapped[int] = mapped_column(primary_key=True)
    material_id: Mapped[int] = mapped_column(
        ForeignKey("materials.id", ondelete="CASCADE"), unique=True, index=True
    )
    intro: Mapped[str] = mapped_column(Text, default="")
    points: Mapped[list] = mapped_column(JSON, default=list)
    model: Mapped[str] = mapped_column(String(255), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    material: Mapped[Material] = relationship(back_populates="summary")


class Quiz(Base):
    """One generated quiz per material; a material's latest attempt is cached
    on `last_attempt` so the UI can show the latest score cheaply."""

    __tablename__ = "quizzes"

    id: Mapped[int] = mapped_column(primary_key=True)
    material_id: Mapped[int] = mapped_column(
        ForeignKey("materials.id", ondelete="CASCADE"), unique=True, index=True
    )
    model: Mapped[str] = mapped_column(String(255), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    material: Mapped[Material] = relationship(back_populates="quiz")
    questions: Mapped[list["Question"]] = relationship(
        back_populates="quiz", cascade="all, delete-orphan", order_by="Question.position"
    )
    attempts: Mapped[list["QuizAttempt"]] = relationship(
        back_populates="quiz", cascade="all, delete-orphan"
    )


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[int] = mapped_column(primary_key=True)
    quiz_id: Mapped[int] = mapped_column(ForeignKey("quizzes.id", ondelete="CASCADE"), index=True)
    position: Mapped[int] = mapped_column(Integer)  # 0-based ordering
    prompt: Mapped[str] = mapped_column(Text)
    # [{"id": "a", "text": "..."}, ...] — stable option ids "a".."d"
    options: Mapped[list] = mapped_column(JSON, default=list)
    # Never included in quiz-taking API responses; only used for scoring and
    # post-submission explanations.
    correct_option_id: Mapped[str] = mapped_column(String(8))
    explanation: Mapped[str] = mapped_column(Text, default="")

    quiz: Mapped[Quiz] = relationship(back_populates="questions")


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id: Mapped[int] = mapped_column(primary_key=True)
    quiz_id: Mapped[int] = mapped_column(ForeignKey("quizzes.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    score: Mapped[int] = mapped_column(Integer)  # correct count
    total: Mapped[int] = mapped_column(Integer)  # question count
    # Per-question outcomes for review: [{"questionId", "selectedId", "correct", "correctOptionId", "explanation"}]
    details: Mapped[list] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    quiz: Mapped[Quiz] = relationship(back_populates="attempts")


class Flashcard(Base):
    __tablename__ = "flashcards"

    id: Mapped[int] = mapped_column(primary_key=True)
    material_id: Mapped[int] = mapped_column(ForeignKey("materials.id", ondelete="CASCADE"), index=True)
    position: Mapped[int] = mapped_column(Integer)
    front: Mapped[str] = mapped_column(Text)
    back: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    material: Mapped[Material] = relationship(back_populates="flashcards")


class MaterialProgress(Base):
    """1:1 with Material — one row per material so upserts are trivial and
    progress math is a couple of SQL counts instead of duplicated client logic."""

    __tablename__ = "material_progress"
    __table_args__ = (UniqueConstraint("material_id", name="uq_progress_material"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    material_id: Mapped[int] = mapped_column(ForeignKey("materials.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    # not-started | in-progress | completed
    completion_status: Mapped[str] = mapped_column(
        Enum(*COMPLETION_STATUSES, name="completion_status"), default="not-started"
    )
    quiz_attempts: Mapped[int] = mapped_column(Integer, default=0)
    last_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    last_total: Mapped[int | None] = mapped_column(Integer, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    material: Mapped[Material] = relationship(back_populates="progress")
