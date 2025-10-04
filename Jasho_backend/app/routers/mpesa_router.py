# app/routers/mpesa_router.py
from fastapi import APIRouter, Request, HTTPException, UploadFile, File
from pydantic import BaseModel
import re

router = APIRouter(prefix="/mpesa", tags=["mpesa"])

@router.post("/callback")
async def mpesa_callback(req: Request):
    # Stubs; save callback payload and acknowledge
    data = await req.json()
    # In production verify signature and process payment notification
    return {"status": "received", "payload": data}


def is_url_safe(url: str) -> bool:
    # Minimal URL validation; integrate Google Safe Browsing for production
    return url.startswith("https://") and not re.search(r"(?i)(malware|phish|ransom)", url)


class QRPayload(BaseModel):
    url: str


@router.post("/scan-url")
async def scan_url(payload: QRPayload):
    if not is_url_safe(payload.url):
        raise HTTPException(status_code=400, detail="Unsafe URL")
    return {"status": "ok"}
