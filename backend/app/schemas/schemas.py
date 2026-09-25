"""Pydantic request/response schemas.

Responses deliberately exclude `password_hash`, never expose quiz
`correct_option_id` during quiz-taking, and omit `extracted_text` from list
endpoints (it can be large; the detail endpoint returns a preview only).
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

# --------------------------------------------------------------------------- auth


class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=1, max_length=255)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class RegisterResponse(BaseModel):
    message: str
    user: "UserOut"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# --------------------------------------------------------------------------- users


class UserBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    full_name: str
    study_level: str
    studying: str
    onboarding_completed: bool


class UserOut(UserBase):
    pass


class OnboardingRequest(BaseModel):
    studying: str = Field(max_length=255)
    study_level: str = Field(max_length=64)


class ProfileUpdateRequest(BaseModel):
    full_name: str = Field(min_length=1, max_length=255)
    studying: str = Field(max_length=255)
    study_level: str = Field(max_length=64)


# --------------------------------------------------------------------------- subjects


class SubjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str = Field(default="", max_length=2000)


class SubjectUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=2000)


class SubjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str
    color: str
    created_at: datetime
    material_count: int = 0
    completed_materials: int = 0


class SubjectDetail(SubjectOut):
    materials: list["MaterialOut"] = []


# --------------------------------------------------------------------------- materials


class MaterialOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    subject_id: int
    filename: str
    size_bytes: int
    status: str
    status_message: str
    created_at: datetime
    # Joined from MaterialProgress when the material is served inside a
    # subject detail; None elsewhere.
    completion_status: str | None = None


class MaterialDetail(MaterialOut):
    extracted_text_preview: str = ""


class UploadResponse(BaseModel):
    message: str
    material: MaterialOut


# --------------------------------------------------------------------------- summaries


class SummaryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    material_id: int
    intro: str
    points: list[str]
    model: str
    created_at: datetime


class SummaryRegenerateRequest(BaseModel):
    regenerate: bool = False


# --------------------------------------------------------------------------- quizzes


class OptionOut(BaseModel):
    id: str
    text: str


class QuestionOut(BaseModel):
    id: int
    position: int
    prompt: str
    options: list[OptionOut]
    # Absent while taking the quiz; included in attempt results.
    correctOptionId: str | None = None
    explanation: str | None = None


class QuizOut(BaseModel):
    id: int
    material_id: int
    questions: list[QuestionOut]
    latest_attempt: "QuizAttemptOut | None" = None


class AnswerSubmission(BaseModel):
    question_id: int
    selected_option_id: str = Field(min_length=1, max_length=8)


class QuizSubmitRequest(BaseModel):
    answers: list[AnswerSubmission] = Field(min_length=1)


class QuizQuestionResult(BaseModel):
    questionId: int
    selectedId: str
    correct: bool
    correctOptionId: str
    explanation: str


class QuizAttemptOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    score: int
    total: int
    details: list[QuizQuestionResult]
    created_at: datetime


# --------------------------------------------------------------------------- flashcards


class FlashcardOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    position: int
    front: str
    back: str


# --------------------------------------------------------------------------- progress


class MaterialProgressOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    material_id: int
    completion_status: str
    quiz_attempts: int
    last_score: int | None
    last_total: int | None


class SubjectProgressOut(BaseModel):
    subject_id: int
    subject_name: str
    total_materials: int
    started_materials: int
    completed_materials: int
    percent: int
    quiz_attempts: int
    average_score_percent: int | None


class ProgressOut(BaseModel):
    totals: "ProgressTotals"
    subjects: list[SubjectProgressOut]


class ProgressTotals(BaseModel):
    total_subjects: int
    total_materials: int
    started_materials: int
    completed_materials: int
    overall_percent: int
    quiz_attempts: int
    average_score_percent: int | None


# Rebuild forward refs
RegisterResponse.model_rebuild()
QuizOut.model_rebuild()
ProgressOut.model_rebuild()
