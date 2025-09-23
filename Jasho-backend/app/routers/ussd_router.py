# app/routers/ussd_router.py
from fastapi import APIRouter, Form
from typing import Dict

router = APIRouter(prefix="/ussd", tags=["ussd"])

@router.post("/hook")
def ussd_hook(sessionId: str = Form(...), serviceCode: str = Form(...), phoneNumber: str = Form(...), text: str = Form("")) -> Dict:
    # Very simple USSD menu stub. In production you'd parse `text` to navigate
    # Here we return a text response for demo (Africa's Talking expects 'CON' or 'END')
    if text == "":
        response = "CON Welcome to Jasho\n1. Log gig\n2. Check balance\n3. Savings"
    elif text == "1":
        response = "CON Enter gig source and amount, e.g., 'kibandaski,500'"
    else:
        response = "END Feature under development"
    return {"message": response}

