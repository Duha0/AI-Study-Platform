"""Local file storage abstraction for uploaded PDFs.

Uploads live under `settings.uploads_dir` with random UUID filenames (never
the client-supplied name, which could contain path tricks). The rest of the
app only talks to this module, so swapping to S3/GCS later means replacing
this file, not touching the API layer.
"""

import uuid
from pathlib import Path

from app.core.config import get_settings

settings = get_settings()


def _ensure_dir() -> Path:
    path = Path(settings.uploads_dir)
    path.mkdir(parents=True, exist_ok=True)
    return path


def save_pdf(content: bytes) -> str:
    """Persist uploaded bytes; returns the stored (random) filename."""
    directory = _ensure_dir()
    stored_name = f"{uuid.uuid4().hex}.pdf"
    (directory / stored_name).write_bytes(content)
    return stored_name


def read_pdf(stored_name: str) -> bytes:
    return (_ensure_dir() / stored_name).read_bytes()


def delete_file(stored_name: str) -> None:
    path = _ensure_dir() / stored_name
    path.unlink(missing_ok=True)


def file_exists(stored_name: str) -> bool:
    return (_ensure_dir() / stored_name).exists()
