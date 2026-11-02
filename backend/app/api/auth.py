"""Authentication endpoints: register, login, me."""

import time
from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.security import create_access_token, hash_password, verify_password
from app.models.models import User
from app.schemas.schemas import LoginRequest, RegisterRequest, RegisterResponse, TokenResponse, UserOut

router = APIRouter(prefix="/api/auth", tags=["auth"])

# --- Simple in-memory rate limiter (MVP) ---
# key: (client_ip, endpoint) -> list of request timestamps
_rate_limit_store: dict[tuple[str, str], list[float]] = defaultdict(list)
_RATE_LIMIT_REQUESTS = 5
_RATE_LIMIT_WINDOW_SECONDS = 60


def _check_rate_limit(request: Request, endpoint: str) -> None:
    # Skip rate limiting during test runs to avoid interfering with the test suite.
    import os
    if os.environ.get("STUDYAI_TESTING") == "1":
        return
    client_ip = request.client.host if request.client else "unknown"
    key = (client_ip, endpoint)
    now = time.time()
    window_start = now - _RATE_LIMIT_WINDOW_SECONDS
    timestamps = _rate_limit_store[key]
    # Prune entries outside the window
    _rate_limit_store[key] = [t for t in timestamps if t > window_start]
    if len(_rate_limit_store[key]) >= _RATE_LIMIT_REQUESTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Please try again later.",
        )
    _rate_limit_store[key].append(now)


def _email_exists(db: Session, email: str) -> bool:
    return db.scalar(select(User).where(User.email == email.lower())) is not None


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
def register(
    request: Request,
    payload: RegisterRequest,
    db: Session = Depends(get_db),
):
    _check_rate_limit(request, "register")
    email = payload.email.lower()
    if _email_exists(db, email):
        raise HTTPException(status_code=409, detail="An account with this email already exists.")

    user = User(
        email=email,
        full_name=payload.full_name.strip(),
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return RegisterResponse(
        message="Account created successfully.",
        user=UserOut.model_validate(user),
        access_token=create_access_token(str(user.id)),
    )


@router.post("/login", response_model=TokenResponse)
def login_json(
    request: Request,
    payload: LoginRequest,
    db: Session = Depends(get_db),
):
    _check_rate_limit(request, "login")
    return _login(payload.email, payload.password, db)


@router.post("/login-form", response_model=TokenResponse, include_in_schema=False)
def login_form(
    request: Request,
    form: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """OAuth2 password-flow variant used by FastAPI's docs 'Authorize' button."""
    _check_rate_limit(request, "login")
    return _login(form.username, form.password, db)


def _login(email: str, password: str, db: Session) -> TokenResponse:
    user = db.scalar(select(User).where(User.email == email.strip().lower()))
    if user is None or not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return TokenResponse(access_token=create_access_token(str(user.id)))


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user
