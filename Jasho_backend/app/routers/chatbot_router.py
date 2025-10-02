# app/routers/chatbot_router.py
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/chatbot", tags=["chatbot"])

class Msg(BaseModel):
    user_id: int
    message: str
    lang: str = "en"

@router.post("/message")
def chatbot_message(msg: Msg):
    # Simple stub. In production connect to Rasa/Dialogflow or LLM
    text = msg.message.lower()
    if "balance" in text:
        reply = "Your balance is KES 1,234 (demo)."
    elif "forecast" in text:
        reply = "Forecast: next month may be 20% lower. Save KES 100/day."
    else:
        reply = "Hi! I can help log gigs, show balance, or provide tips."
    return {"reply": reply}
