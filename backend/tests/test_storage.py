"""Storage configuration and failure-handling tests.

Tests that:
- Local storage (default) works for save/read/delete/exists.
- Unknown STORAGE_BACKEND fails with a clear error.
- S3 backend with missing bucket name fails clearly.
- S3 backend with missing credentials fails clearly.
- Missing production storage credentials never print secret values.
"""

import os

import pytest

from app.core.config import settings
from app.services.storage import (
    LocalStorage,
    S3Storage,
    StorageBackend,
    get_storage,
    storage,
)


def _set_storage_backend(monkeypatch, backend: str, **kwargs):
    """Monkeypatch settings for storage backend tests."""
    monkeypatch.setattr(settings, "storage_backend", backend)
    for key, value in kwargs.items():
        monkeypatch.setattr(settings, key, value)


def test_local_storage_default_works(tmp_path, monkeypatch):
    """Local backend (default) save/read/delete/exists round-trip."""
    _set_storage_backend(monkeypatch, "local", uploads_dir=str(tmp_path / "uploads"))

    import app.services.storage as storage_mod

    storage_mod._storage = None

    backend = get_storage()
    assert isinstance(backend, LocalStorage)

    name = backend.save_pdf(b"%PDF-1.4 test content")
    assert backend.file_exists(name)
    assert backend.read_pdf(name) == b"%PDF-1.4 test content"

    backend.delete_file(name)
    assert not backend.file_exists(name)


def test_local_storage_delete_missing_file_no_error(tmp_path, monkeypatch):
    """Deleting a non-existent local file does not raise."""
    _set_storage_backend(monkeypatch, "local", uploads_dir=str(tmp_path / "uploads"))

    import app.services.storage as storage_mod

    storage_mod._storage = None

    backend = get_storage()
    # Should not raise
    backend.delete_file("nonexistent-uuid.pdf")


def test_unknown_storage_backend_fails_clear(monkeypatch):
    """Unknown STORAGE_BACKEND raises ValueError with a clear message."""
    _set_storage_backend(monkeypatch, "gcs")  # not supported

    import app.services.storage as storage_mod

    storage_mod._storage = None

    with pytest.raises(ValueError, match="Unknown STORAGE_BACKEND"):
        get_storage()


def test_s3_missing_bucket_fails_clear(monkeypatch):
    """S3 backend without S3_BUCKET_NAME raises ValueError."""
    boto3 = pytest.importorskip("boto3")
    _set_storage_backend(
        monkeypatch,
        "s3",
        s3_bucket_name="",
        s3_access_key_id="test-key",
        s3_secret_access_key="test-secret",
    )

    import app.services.storage as storage_mod

    storage_mod._storage = None

    with pytest.raises(ValueError, match="S3_BUCKET_NAME must be set"):
        get_storage()


def test_s3_missing_credentials_fails_clear(monkeypatch):
    """S3 backend without access/secret keys raises ValueError."""
    boto3 = pytest.importorskip("boto3")
    _set_storage_backend(
        monkeypatch,
        "s3",
        s3_bucket_name="test-bucket",
        s3_access_key_id="",
        s3_secret_access_key="",
    )

    import app.services.storage as storage_mod

    storage_mod._storage = None

    with pytest.raises(
        ValueError, match="S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY"
    ):
        get_storage()


def test_s3_credentials_not_printed(monkeypatch, capsys):
    """S3 credential errors do not print secret values to stdout/stderr."""
    boto3 = pytest.importorskip("boto3")
    _set_storage_backend(
        monkeypatch,
        "s3",
        s3_bucket_name="test-bucket",
        s3_access_key_id="sk-secret-key-value",
        s3_secret_access_key="sk-secret-value",
    )

    import app.services.storage as storage_mod

    storage_mod._storage = None

    with pytest.raises(ValueError):
        get_storage()

    captured = capsys.readouterr()
    assert "sk-secret-key-value" not in captured.out
    assert "sk-secret-key-value" not in captured.err
    assert "sk-secret-value" not in captured.out
    assert "sk-secret-value" not in captured.err


def test_storage_module_exports_interface():
    """Storage module exports the expected interface."""
    assert issubclass(LocalStorage, StorageBackend)
    assert issubclass(S3Storage, StorageBackend)
    assert callable(get_storage)
    assert callable(storage)
