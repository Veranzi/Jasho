# app/auth.py
from datetime import datetime, timedelta
from jose import jwt, JWTError
from passlib.context import CryptContext
import os

from app.models.models import User

SECRET_KEY = os.getenv("SECRET_KEY", "devsecretforsandbox")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60*24*7

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)

def create_access_token(subject: str, expires_delta: int = ACCESS_TOKEN_EXPIRE_MINUTES):
    to_encode = {"sub": str(subject)}
    expire = datetime.utcnow() + timedelta(minutes=expires_delta)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None
def is_token_expired(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        exp = payload.get("exp")
        if exp and datetime.utcfromtimestamp(exp) < datetime.utcnow():
            return True
        return False
    except JWTError:
        return True
def refresh_token(token: str):
    user_id = decode_token(token)
    if user_id:
        return create_access_token(user_id)
    return None
def change_password(user, new_password: str, db):
    user.hashed_password = hash_password(new_password)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
def authenticate_user(phone: str, password: str, db):
    user = db.query(User).filter(User.phone == phone).first()
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user
def get_user_by_id(user_id: int, db):
    return db.query(User).filter(User.id == user_id).first()
def get_user_by_phone(phone: str, db):
    return db.query(User).filter(User.phone == phone).first()
def get_user_by_email(email: str, db):
    return db.query(User).filter(User.email == email).first()
def create_user(phone: str, password: str, db, name: str = None):
    hashed_pw = hash_password(password)
    new_user = User(phone=phone, hashed_password=hashed_pw, name=name)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user
def delete_user(user, db):
    db.delete(user)
    db.commit()
    return True
def update_user(user, db, **kwargs):
    for key, value in kwargs.items():
        setattr(user, key, value)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
def verify_user_email(user, db):
    user.email_verified = True
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
def reset_user_password(user, new_password: str, db):
    user.hashed_password = hash_password(new_password)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
def generate_password_reset_token(user_id: int):
    return create_access_token(subject=str(user_id), expires_delta=15)
def verify_password_reset_token(token: str):
    return decode_token(token)
def change_user_phone(user, new_phone: str, db):
    user.phone = new_phone
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
def change_user_email(user, new_email: str, db):
    user.email = new_email
    user.email_verified = False
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
def get_all_users(db):
    return db.query(User).all()
def get_active_users(db):
    return db.query(User).filter(User.is_active == True).all()
def deactivate_user(user, db):
    user.is_active = False
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
def activate_user(user, db):
    user.is_active = True
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
def get_user_count(db):
    return db.query(User).count()
def get_users_by_name(name: str, db):
    return db.query(User).filter(User.name.ilike(f"%{name}%")).all()
def get_users_by_country(country: str, db):
    return db.query(User).filter(User.country == country).all()

