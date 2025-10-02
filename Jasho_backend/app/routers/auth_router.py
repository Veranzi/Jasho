from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from passlib.hash import bcrypt
from app.database import get_db
from app.schemas.user_schema import UserSignup, UserLogin
from app.models.models import User

router = APIRouter()

@router.post("/signup")
def signup(user: UserSignup, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already exists")

    hashed_pw = bcrypt.hash(user.password)

    new_user = User(
        name=user.username,
        phone=user.phone_number,
        email=user.email,
        password_hash=hashed_pw,
        hustles=",".join(user.hustles) if user.hustles else None,
        country=user.country,
        county=user.county,
        ward=user.ward,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "Signup successful", "user_id": new_user.id}

@router.post("/login")
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.mobile).first()
    if not user or not bcrypt.verify(credentials.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return {"message": "Login successful", "user_id": user.id}

