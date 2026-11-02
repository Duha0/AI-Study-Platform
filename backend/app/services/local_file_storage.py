"""Backward-compatible wrapper for local file storage.

This module is kept for any existing imports. New code should use
``app.services.storage.get_storage()`` or ``app.services.storage.storage()``
instead, which returns the configured backend (local by default).
"""

from app.services.storage import LocalStorage

_local = LocalStorage()


def save_pdf(content: bytes) -> str:
    return _local.save_pdf(content)


def read_pdf(stored_name: str) -> bytes:
    return _local.read_pdf(stored_name)


def delete_file(stored_name: str) -> None:
    _local.delete_file(stored_name)


def file_exists(stored_name: str) -> bool:
    return _local.file_exists(stored_name)
