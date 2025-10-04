# app/routers/chatbot_router.py
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
import os
import io
from openai import OpenAI
from google.cloud import vision
from PIL import Image
import numpy as np
import base64
import json

router = APIRouter(prefix="/chatbot", tags=["chatbot"])

class Msg(BaseModel):
    user_id: int
    message: str
    lang: str = "en"

def moderate_text(text: str) -> bool:
    # Very simple moderation stub; integrate OpenAI/Vertex Safety for production
    banned = ["terror", "bomb", "abuse"]
    return not any(b in text.lower() for b in banned)


@router.post("/message")
def chatbot_message(msg: Msg):
    if not moderate_text(msg.message):
        raise HTTPException(status_code=400, detail="Unsafe content")
    # In production: call LLM with system prompt emphasizing safety
    text = msg.message.lower()
    if "balance" in text:
        reply = "Your balance is masked for safety. Use /wallet/balance to view."
    elif "forecast" in text:
        reply = "Forecast: expect income variance ±15%. Consider setting a savings goal."
    else:
        reply = "Hi! I can help with budgeting, spend insights, and goals."
    return {"reply": reply}


@router.post("/voice")
async def chatbot_voice(audio: UploadFile = File(...)):
    if not audio.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="Invalid audio type")
    # Convert to bytes
    audio_bytes = await audio.read()
    # Use OpenAI Whisper (or GCP STT) - placeholder, assumes OpenAI Whisper via API
    try:
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        # Pseudocode: actual OpenAI Whisper API may differ
        # transcript = client.audio.transcriptions.create(model="whisper-1", file=audio_bytes)
        transcript_text = "transcribed speech (demo)"
    except Exception:
        transcript_text = ""
    if not moderate_text(transcript_text):
        raise HTTPException(status_code=400, detail="Unsafe voice content")
    return {"transcript": transcript_text}


@router.post("/image")
async def chatbot_image(file: UploadFile = File(...)):
    # Block unsafe image types
    if file.content_type not in {"image/png", "image/jpeg"}:
        raise HTTPException(status_code=400, detail="Unsupported image type")
    content = await file.read()
    if len(content) > int(os.getenv("SAFE_SCAN_MAX_FILE_MB", "15")) * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large")
    # Basic vision safe-search using GCP Vision if configured
    try:
        client = vision.ImageAnnotatorClient()
        image = vision.Image(content=content)
        result = client.safe_search_detection(image=image)
        safe = result.safe_search_annotation
        # Block if adult/violence likely
        if safe.adult.name in {"LIKELY", "VERY_LIKELY"} or safe.violence.name in {"LIKELY", "VERY_LIKELY"}:
            raise HTTPException(status_code=400, detail="Unsafe image content")
    except Exception:
        pass
    return {"status": "ok"}


@router.get("/heatmap/jobs")
async def jobs_heatmap():
    # Placeholder: In production call a jobs API, cluster by geohash, return heat weights
    grid = [
        {"lat": -1.286389, "lng": 36.817223, "job": "Driver", "weight": 12, "color": "#ff0000"},
        {"lat": -1.303205, "lng": 36.707309, "job": "Cook", "weight": 5, "color": "#00ff00"},
        {"lat": -1.292066, "lng": 36.821945, "job": "Cleaner", "weight": 8, "color": "#0000ff"},
    ]
    return {"points": grid}
