from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from passlib.hash import bcrypt
from app.database import get_db
from app.schemas.user_schema import UserSignup, UserLogin
from app.models.models import User
import os
from twilio.rest import Client as TwilioClient

router = APIRouter()

def send_sms(to_number: str, body: str) -> None:
    sid = os.getenv("TWILIO_ACCOUNT_SID")
    token = os.getenv("TWILIO_AUTH_TOKEN")
    service_sid = os.getenv("TWILIO_MESSAGING_SERVICE_SID")
    if not (sid and token and service_sid):
        return
    client = TwilioClient(sid, token)
    client.messages.create(messaging_service_sid=service_sid, to=to_number, body=body)


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

    # Send SMS verification OTP (simple demo token)
    try:
        send_sms(user.phone_number, "Your Jasho verification code is 123456")
    except Exception:
        pass

    return {"message": "Signup successful. Verify SMS sent.", "user_id": new_user.id}

@router.post("/login")
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    # Treat provided "mobile" as email or phone for flexibility
    user = db.query(User).filter((User.email == credentials.mobile) | (User.phone == credentials.mobile)).first()
    if not user or not bcrypt.verify(credentials.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Optionally, send step-up OTP for high-risk login
    try:
        send_sms(user.phone, "Your Jasho login code is 123456")
    except Exception:
        pass
    return {"message": "Login successful", "user_id": user.id}

