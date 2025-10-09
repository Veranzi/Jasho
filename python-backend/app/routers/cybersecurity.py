from __future__ import annotations
from fastapi import APIRouter
from pydantic import BaseModel
from ..utils.security import sign_strict

router = APIRouter()


class UrlCheckRequest(BaseModel):
    url: str


@router.post('/check-url')
async def check_url(req: UrlCheckRequest):
    # Very basic URL safety check stub
    unsafe_patterns = ['javascript:', 'data:', 'vbscript:', 'onload=', 'onerror=', 'onclick=', 'bit.ly', 'tinyurl', 'phishing']
    is_safe = not any(p in req.url.lower() for p in unsafe_patterns)
    return {'success': True, 'data': {'isSafe': is_safe, 'signature': sign_strict(req.url)}}


class QrCheckRequest(BaseModel):
    data: str


@router.post('/check-qr')
async def check_qr(req: QrCheckRequest):
    unsafe_patterns = ['javascript:', 'data:', 'vbscript:', 'onload=', 'onerror=', 'onclick=']
    is_safe = not any(p in req.data.lower() for p in unsafe_patterns)
    return {'success': True, 'data': {'isSafe': is_safe, 'signature': sign_strict(req.data)}}
