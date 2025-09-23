# app/routers/auth_router.py
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.database import get_session
from app.models import User, Wallet
from app.schemas import UserCreate, Token
from app.auth import hash_password, create_access_token, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=Token)
def register(data: UserCreate, session: Session = Depends(get_session)):
    existing = session.exec(select(User).where(User.phone == data.phone)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Phone already registered")
    user = User(phone=data.phone, name=data.name, hashed_password=hash_password(data.password))
    session.add(user)
    session.commit()
    session.refresh(user)
    wallet = Wallet(user_id=user.id, balance=0.0)
    session.add(wallet)
    session.commit()
    token = create_access_token(str(user.id))
    return {"access_token": token}

@router.post("/login", response_model=Token)
def login(data: UserCreate, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.phone == data.phone)).first()
    if not user or not user.hashed_password or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(str(user.id))
    return {"access_token": token}
