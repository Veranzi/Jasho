# app/routers/incomes_router.py
from app.models import Wallet
from fastapi import APIRouter, Depends, HTTPException, Header
from typing import List
from sqlmodel import Session, select
from app.db.database import get_session
from app.models import Income, User
from app.schemas import IncomeCreate
from app.auth import decode_token
from app.ai_stub import forecast_income, compute_trust_score

router = APIRouter(prefix="/incomes", tags=["incomes"])

def get_current_user(authorization: str = Header(None), session: Session = Depends(get_session)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing auth")
    token = authorization.split("Bearer ")[-1]
    user_id = decode_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = session.get(User, int(user_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.post("/", response_model=dict)
def add_income(payload: IncomeCreate, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    inc = Income(user_id=user.id, source=payload.source, amount=payload.amount, description=payload.description)
    session.add(inc)
    session.commit()
    session.refresh(inc)
    # stub: update wallet quickly
    wallet = session.exec(select(Wallet).where(Wallet.user_id == user.id)).first()
    if wallet:
        wallet.balance += payload.amount
        session.add(wallet)
        session.commit()
    return {"id": inc.id, "status": "added", "new_balance": wallet.balance if wallet else None}

@router.get("/forecast", response_model=dict)
def get_forecast(user: User = Depends(get_current_user)):
    return forecast_income(user.id)

@router.get("/trust", response_model=dict)
def get_trust(user: User = Depends(get_current_user)):
    return compute_trust_score(user.id)
