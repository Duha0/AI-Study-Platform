"""User profile endpoints: onboarding and profile updates."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.models import User
from app.schemas.schemas import OnboardingRequest, ProfileUpdateRequest, UserOut

router = APIRouter(prefix="/api/users", tags=["users"])


@router.post("/onboarding", response_model=UserOut)
def complete_onboarding(
    payload: OnboardingRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current_user.studying = payload.studying.strip()
    current_user.study_level = payload.study_level
    current_user.onboarding_completed = True
    if payload.interface_language:
        current_user.interface_language = payload.interface_language
    if payload.ai_content_language:
        current_user.ai_content_language = payload.ai_content_language
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.patch("/me", response_model=UserOut)
def update_profile(
    payload: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current_user.full_name = payload.full_name.strip()
    current_user.studying = payload.studying.strip()
    current_user.study_level = payload.study_level
    if payload.interface_language is not None:
        current_user.interface_language = payload.interface_language
    if payload.ai_content_language is not None:
        current_user.ai_content_language = payload.ai_content_language
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user
