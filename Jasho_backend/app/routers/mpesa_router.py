# app/routers/mpesa_router.py
from fastapi import APIRouter, Request

router = APIRouter(prefix="/mpesa", tags=["mpesa"])

@router.post("/callback")
async def mpesa_callback(req: Request):
    # Stubs; save callback payload and acknowledge
    data = await req.json()
    # In production verify signature and process payment notification
    return {"status": "received", "payload": data}
