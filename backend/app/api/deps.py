"""Shared API dependencies."""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.models import Material, Quiz, Subject, User

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Resolve the current user from the Bearer token; 401 otherwise."""
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise unauthorized
    user_id = decode_access_token(credentials.credentials)
    if user_id is None:
        raise unauthorized
    user = db.get(User, int(user_id))
    if user is None:
        raise unauthorized
    return user


def get_owned_subject(db: Session, user: User, subject_id: int) -> Subject:
    subject = db.scalar(select(Subject).where(Subject.id == subject_id, Subject.user_id == user.id))
    if subject is None:
        raise HTTPException(status_code=404, detail="Subject not found")
    return subject


def get_owned_material(db: Session, user: User, material_id: int) -> Material:
    material = db.scalar(
        select(Material).where(Material.id == material_id, Material.user_id == user.id)
    )
    if material is None:
        raise HTTPException(status_code=404, detail="Material not found")
    return material


def get_owned_quiz(db: Session, user: User, quiz_id: int) -> Quiz:
    """Quiz ownership is derived through its material's user_id."""
    quiz = db.scalar(
        select(Quiz)
        .join(Material, Quiz.material_id == Material.id)
        .where(Quiz.id == quiz_id, Material.user_id == user.id)
    )
    if quiz is None:
        raise HTTPException(status_code=404, detail="Quiz not found")
    return quiz
