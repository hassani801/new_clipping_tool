"""Backward-compatible shim for the storage service.

The real implementation now lives in ``app/storage/`` behind the
``StorageBackend`` abstraction. Import ``get_storage_backend`` there instead.
"""
from ..storage import get_storage_backend
from ..storage.local import LocalStorageBackend

# Kept for any legacy importers; prefer get_storage_backend().
StorageService = LocalStorageBackend
default_storage_service = get_storage_backend()
