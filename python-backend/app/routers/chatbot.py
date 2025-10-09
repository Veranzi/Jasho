from __future__ import annotations
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from pydantic import BaseModel
from datetime import datetime
from ..middleware.auth import get_current_user

router = APIRouter()


class ChatRequest(BaseModel):
  message: str
  includeContext: bool = True


@router.post('/chat')
async def chat(req: ChatRequest, user=Depends(get_current_user)):
  # Moderate input (stub)
  if any(bad in req.message.lower() for bad in ['hate', 'terror', 'extremist']):
    raise HTTPException(status_code=400, detail={'success': False, 'message': 'Unsafe content', 'code': 'UNSAFE_CONTENT'})
  return {'success': True, 'data': {'reply': 'Hello! How can I assist you today?', 'createdAt': datetime.utcnow().isoformat()}}


@router.post('/voice-chat')
async def voice_chat(audio: UploadFile = File(...), user=Depends(get_current_user)):
  # Stub: Accept voice and return text reply
  if audio.content_type not in ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/webm']:
    raise HTTPException(status_code=400, detail={'success': False, 'message': 'Unsupported audio type', 'code': 'UNSUPPORTED_AUDIO'})
  return {'success': True, 'data': {'reply': 'Received your voice message and processed it.', 'createdAt': datetime.utcnow().isoformat()}}


@router.post('/analyze-image')
async def analyze_image(image: UploadFile = File(...), user=Depends(get_current_user)):
  if image.content_type not in ['image/png', 'image/jpeg']:
    raise HTTPException(status_code=400, detail={'success': False, 'message': 'Unsupported image type', 'code': 'UNSUPPORTED_IMAGE'})
  # Stub: Perform content safety and object detection
  return {'success': True, 'data': {'analysis': {'safe': True, 'labels': ['document']}}}


@router.get('/history')
async def history(page: int = 1, limit: int = 20, user=Depends(get_current_user)):
  return {'success': True, 'data': {'history': [], 'pagination': {'page': page, 'limit': limit, 'total': 0}}}
