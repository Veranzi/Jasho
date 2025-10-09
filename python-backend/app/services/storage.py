from __future__ annotations
from datetime import timedelta
from typing import Optional
from google.cloud.storage import Blob
from .firebase import get_bucket


def upload_bytes(path: str, data: bytes, content_type: str) -> dict:
    bucket = get_bucket()
    if not bucket:
        return {"url": None, "path": path}
    blob: Blob = bucket.blob(path)
    blob.upload_from_string(data, content_type=content_type)
    try:
        url = blob.generate_signed_url(expiration=timedelta(days=7), method="GET")
    except Exception:
        url = f"https://storage.googleapis.com/{bucket.name}/{path}"
    return {"url": url, "path": path}
