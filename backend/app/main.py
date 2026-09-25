"""StudyAI FastAPI application entrypoint."""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import ai_resources, auth, materials, progress, quizzes, subjects, users
from app.core.config import get_settings
from app.core.database import Base, engine
from app.models import models  # noqa: F401 — imported so create_all sees every model

logger = logging.getLogger("studyai")

settings = get_settings()

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    # Simple, maintainable local-dev "migration": create any missing tables.
    # Alembic can take over later without model changes.
    Base.metadata.create_all(bind=engine)
    logger.info("Database initialized at %s", settings.database_url)


app.include_router(auth.router)
app.include_router(users.router)
app.include_router(subjects.router)
app.include_router(materials.subjects_router)  # POST /api/subjects/{id}/materials
app.include_router(materials.router)
app.include_router(quizzes.router)
app.include_router(ai_resources.router)
app.include_router(progress.router)


@app.get("/api/health", tags=["health"])
def health():
    return {"status": "ok"}
