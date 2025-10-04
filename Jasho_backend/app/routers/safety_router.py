from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import List, Dict
from app.services.safety import SafeBrowsingClient, analyze_image_safety
from PIL import Image
from pyzbar.pyzbar import decode as decode_qr
import io
import re
import os
import PyPDF2

router = APIRouter(prefix="/safety", tags=["safety"])


class URLPayload(BaseModel):
    url: str


@router.post("/scan-url")
async def scan_url(payload: URLPayload):
    client = SafeBrowsingClient()
    ok = await client.check_url(payload.url)
    if not ok:
        raise HTTPException(status_code=400, detail="Unsafe URL")
    return {"status": "ok"}


@router.post("/scan-qr-image")
async def scan_qr_image(file: UploadFile = File(...)):
    if file.content_type not in {"image/png", "image/jpeg"}:
        raise HTTPException(status_code=400, detail="Unsupported image type")
    content = await file.read()
    if len(content) > int(os.getenv("SAFE_SCAN_MAX_FILE_MB", "15")) * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large")
    image = Image.open(io.BytesIO(content))
    codes = decode_qr(image)
    urls = [c.data.decode("utf-8") for c in codes]
    client = SafeBrowsingClient()
    results: List[Dict] = []
    for u in urls:
        try:
            ok = await client.check_url(u)
        except Exception:
            ok = True
        results.append({"url": u, "safe": ok})
    return {"results": results}


@router.post("/upload-doc")
async def upload_doc(file: UploadFile = File(...)):
    content = await file.read()
    if len(content) > int(os.getenv("SAFE_SCAN_MAX_FILE_MB", "15")) * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large")
    ctype = file.content_type
    if ctype in {"image/png", "image/jpeg"}:
        if not analyze_image_safety(content):
            raise HTTPException(status_code=400, detail="Unsafe image content")
        return {"status": "ok", "type": "image"}
    elif ctype == "application/pdf":
        try:
            reader = PyPDF2.PdfReader(io.BytesIO(content))
            text = "\n".join(page.extract_text() or "" for page in reader.pages)
            urls = re.findall(r"https?://[^\s]+", text)
            client = SafeBrowsingClient()
            unsafe = []
            for u in urls:
                ok = await client.check_url(u)
                if not ok:
                    unsafe.append(u)
            if unsafe:
                raise HTTPException(status_code=400, detail={"unsafe_urls": unsafe})
            return {"status": "ok", "type": "pdf", "urls_checked": len(urls)}
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid PDF")
    else:
        raise HTTPException(status_code=400, detail="Unsupported document type")
