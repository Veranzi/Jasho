from __future__ import annotations
from typing import Optional
import os
from firebase_admin import credentials, initialize_app, firestore, storage
from ..config import settings


_initialized = False
_db = None
_bucket = None


def init_firebase() -> None:
    global _initialized, _db, _bucket
    if _initialized:
        return
    cred_path = settings.firebase_credentials or os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    try:
        if cred_path and os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            initialize_app(cred, {
                'storageBucket': settings.firebase_storage_bucket
            } if settings.firebase_storage_bucket else None)
        else:
            # Application default credentials
            initialize_app()
        _db = firestore.client()
        if settings.firebase_storage_bucket:
            _bucket = storage.bucket(settings.firebase_storage_bucket)
        _initialized = True
    except Exception:
        # Allow running without Firebase in dev; use lazy init attempts later
        _initialized = False
        _db = None
        _bucket = None


def get_db():
    if not _initialized:
        init_firebase()
    return _db


def get_bucket():
    if not _initialized:
        init_firebase()
    return _bucket
