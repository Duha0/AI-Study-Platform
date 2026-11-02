"""Configurable file storage for uploaded PDFs.

Two backends are supported:

* ``local`` (default) — stores files on the local filesystem under
  ``settings.uploads_dir`` with random UUID filenames. Safe for development
  and single-instance production deployments with a persistent disk.
* ``s3`` — stores files in an S3-compatible bucket (AWS S3, MinIO, Cloudflare
  R2, etc.). Credentials are read from environment variables only; they are
  never hardcoded.

The rest of the app only talks to the :func:`get_storage` factory, so the
backend can be swapped without touching the API layer.
"""

from __future__ import annotations

import os
import uuid
from abc import ABC, abstractmethod
from pathlib import Path

from app.core.config import get_settings

settings = get_settings()


class StorageBackend(ABC):
    """Abstract interface for PDF storage."""

    @abstractmethod
    def save_pdf(self, content: bytes) -> str:
        """Persist uploaded bytes; return the stored (random) filename."""
        raise NotImplementedError

    @abstractmethod
    def read_pdf(self, stored_name: str) -> bytes:
        """Return the stored bytes for ``stored_name``."""
        raise NotImplementedError

    @abstractmethod
    def delete_file(self, stored_name: str) -> None:
        """Delete the stored file, if it exists."""
        raise NotImplementedError

    @abstractmethod
    def file_exists(self, stored_name: str) -> bool:
        """Return True if ``stored_name`` exists in storage."""
        raise NotImplementedError


class LocalStorage(StorageBackend):
    """Filesystem-backed storage (default, development-friendly)."""

    def _ensure_dir(self) -> Path:
        path = Path(settings.uploads_dir)
        path.mkdir(parents=True, exist_ok=True)
        return path

    def save_pdf(self, content: bytes) -> str:
        directory = self._ensure_dir()
        stored_name = f"{uuid.uuid4().hex}.pdf"
        (directory / stored_name).write_bytes(content)
        return stored_name

    def read_pdf(self, stored_name: str) -> bytes:
        return (self._ensure_dir() / stored_name).read_bytes()

    def delete_file(self, stored_name: str) -> None:
        (self._ensure_dir() / stored_name).unlink(missing_ok=True)

    def file_exists(self, stored_name: str) -> bool:
        return (self._ensure_dir() / stored_name).exists()


class S3Storage(StorageBackend):
    """S3-compatible object storage (production-ready).

    Credentials and bucket settings come from environment variables only.
    Files are uploaded as private objects — never public.
    """

    def __init__(self) -> None:
        import boto3
        from botocore.exceptions import NoCredentialsError

        self._bucket = settings.s3_bucket_name
        self._client = boto3.client(
            "s3",
            endpoint_url=settings.s3_endpoint_url or None,
            aws_access_key_id=settings.s3_access_key_id or None,
            aws_secret_access_key=settings.s3_secret_access_key or None,
            region_name=settings.s3_region,
        )

        if not self._bucket:
            raise ValueError("S3_BUCKET_NAME must be set when STORAGE_BACKEND=s3")
        if not settings.s3_access_key_id or not settings.s3_secret_access_key:
            raise ValueError(
                "S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY must be set "
                "when STORAGE_BACKEND=s3"
            )

    def save_pdf(self, content: bytes) -> str:
        stored_name = f"{uuid.uuid4().hex}.pdf"
        self._client.put_object(
            Bucket=self._bucket,
            Key=stored_name,
            Body=content,
            ContentType="application/pdf",
            # Objects are private by default — no public read access.
        )
        return stored_name

    def read_pdf(self, stored_name: str) -> bytes:
        response = self._client.get_object(Bucket=self._bucket, Key=stored_name)
        return response["Body"].read()

    def delete_file(self, stored_name: str) -> None:
        self._client.delete_object(Bucket=self._bucket, Key=stored_name)

    def file_exists(self, stored_name: str) -> bool:
        try:
            self._client.head_object(Bucket=self._bucket, Key=stored_name)
            return True
        except self._client.exceptions.NoSuchKey:
            return False
        except self._client.exceptions.ClientError:
            return False


def get_storage() -> StorageBackend:
    """Return the configured storage backend.

    Reads ``STORAGE_BACKEND`` from settings. Defaults to ``local``.
    Raises a clear error if S3 is requested but credentials are missing.
    """
    backend = settings.storage_backend.lower()
    if backend == "s3":
        return S3Storage()
    if backend == "local":
        return LocalStorage()
    raise ValueError(
        f"Unknown STORAGE_BACKEND '{backend}'. Use 'local' or 's3'."
    )


# Module-level instance used by the API layer. Initialized lazily on first
# access so that missing S3 credentials surface as a clear startup error
# rather than an import-time crash in development.
_storage: StorageBackend | None = None


def storage() -> StorageBackend:
    """Return a cached storage backend instance."""
    global _storage
    if _storage is None:
        _storage = get_storage()
    return _storage
