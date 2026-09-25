"""Shared pytest fixtures: in-memory database + FastAPI TestClient."""

import os
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Make `app` importable regardless of where pytest is invoked from.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.database import Base, get_db  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"


@pytest.fixture()
def test_db():
    """A fresh in-memory database per test, shared across connections."""
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    yield TestingSession
    app.dependency_overrides.clear()
    engine.dispose()


@pytest.fixture()
def client(test_db):
    """TestClient bound to the overridden in-memory database."""
    with TestClient(app) as c:
        yield c


@pytest.fixture()
def auth_headers(client):
    """Register a user and return valid Authorization headers."""
    payload = {
        "full_name": "Test Student",
        "email": "student@example.com",
        "password": "supersecret123",
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 201, response.text
    login = client.post(
        "/api/auth/login", json={"email": payload["email"], "password": payload["password"]}
    )
    assert login.status_code == 200, login.text
    token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def sample_pdf_bytes():
    """A minimal-but-valid single-page PDF containing text.

    Built with pypdf so tests don't need a binary fixture file.
    """
    from io import BytesIO

    from pypdf import PdfWriter

    writer = PdfWriter()
    writer.add_blank_page(width=612, height=792)
    buffer = BytesIO()
    writer.write(buffer)
    return buffer.getvalue()


@pytest.fixture()
def fake_ai(monkeypatch):
    """Force the AI provider offline so generation endpoints return the
    not-configured error (no network calls in tests)."""
    from app.services.ai import provider

    monkeypatch.setattr(provider, "is_configured", lambda: False)
    return provider
