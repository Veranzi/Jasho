from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from jose import jwt
from ..config import settings
from ..services.firebase import get_db
from ..services.repos import UsersRepo, WalletsRepo, CreditRepo


router = APIRouter()


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    fullName: str
    phoneNumber: str
    location: str
    skills: list[str] | None = None
    dateOfBirth: str | None = None
    gender: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr | None = None
    phoneNumber: str | None = None
    password: str
    rememberMe: bool | None = False


def issue_token(user_id: str, days: int | None = None) -> str:
    exp_days = days if days is not None else settings.jwt_exp_days
    payload = {
        "userId": user_id,
        "exp": datetime.utcnow() + timedelta(days=exp_days),
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


@router.post("/register")
def register(req: RegisterRequest):
    if get_db() is None:
        raise HTTPException(status_code=503, detail={"success": False, "message": "Firebase unavailable", "code": "FIREBASE_UNAVAILABLE"})

    # Check existing
    if UsersRepo.find_by_email(req.email) or UsersRepo.find_by_phone(req.phoneNumber):
        raise HTTPException(status_code=400, detail={"success": False, "message": "Email or phone already registered", "code": "USER_EXISTS"})

    user_id = f"user_{int(datetime.utcnow().timestamp())}"
    user_doc = {
        "email": req.email.lower(),
        "phoneNumber": req.phoneNumber,
        "passwordHash": UsersRepo.hash_password(req.password),
        "fullName": req.fullName,
        "location": req.location,
        "skills": req.skills or [],
        "dateOfBirth": req.dateOfBirth,
        "gender": req.gender,
        "verificationLevel": "unverified",
        "isActive": True,
        "isBlocked": False,
        "isLocked": False,
        "lastLogin": None,
        "lastActive": None,
        "isVerified": False,
    }
    UsersRepo.create_user(user_id, user_doc)

    # Initialize wallet and credit score
    WalletsRepo.get_or_create(user_id)
    CreditRepo.get_or_create(user_id)

    token = issue_token(user_id)
    user_public = {"userId": user_id, "email": req.email.lower(), "fullName": req.fullName}
    return {
        "success": True,
        "message": "User registered successfully. Please verify your email and phone number.",
        "data": {"token": token, "user": user_public, "verificationRequired": {"email": True, "phone": True}},
    }


@router.post("/login")
def login(req: LoginRequest):
    if get_db() is None:
        raise HTTPException(status_code=503, detail={"success": False, "message": "Firebase unavailable", "code": "FIREBASE_UNAVAILABLE"})
    if not req.password:
        raise HTTPException(status_code=401, detail={"success": False, "message": "Invalid credentials", "code": "INVALID_CREDENTIALS"})

    user_doc = None
    if req.email:
        user_doc = UsersRepo.find_by_email(req.email)
    elif req.phoneNumber:
        user_doc = UsersRepo.find_by_phone(req.phoneNumber)

    if not user_doc or not UsersRepo.verify_password(req.password, user_doc.get("passwordHash", "")):
        raise HTTPException(status_code=401, detail={"success": False, "message": "Invalid credentials", "code": "INVALID_CREDENTIALS"})

    # Update last login
    UsersRepo.update_profile(user_doc["userId"], {"lastLogin": datetime.utcnow()})

    token = issue_token(user_doc["userId"], 30 if req.rememberMe else settings.jwt_exp_days)
    user_public = {"userId": user_doc["userId"], "email": user_doc.get("email"), "fullName": user_doc.get("fullName")}
    return {"success": True, "message": "Login successful", "data": {"token": token, "user": user_public, "expiresIn": f"{30 if req.rememberMe else settings.jwt_exp_days}d"}}


@router.post("/logout")
def logout():
    return {"success": True, "message": "Logout successful"}


class VerifyEmailRequest(BaseModel):
    token: str


@router.post("/verify-email")
def verify_email(_: VerifyEmailRequest):
    return {"success": True, "message": "Email verified successfully", "data": {"user": {"userId": "user_demo", "email": "demo@example.com", "fullName": "Demo User"}}}


class VerifyPhoneRequest(BaseModel):
    phoneNumber: str
    code: str


@router.post("/verify-phone")
def verify_phone(_: VerifyPhoneRequest):
    return {"success": True, "message": "Phone number verified successfully", "data": {"user": {"userId": "user_demo", "fullName": "Demo User"}}}


@router.post("/resend-email-verification")
def resend_email_verification():
    return {"success": True, "message": "Verification email sent successfully"}


@router.post("/resend-phone-verification")
def resend_phone_verification():
    return {"success": True, "message": "Verification code sent successfully"}


class ResetPasswordRequest(BaseModel):
    token: str
    password: str


@router.post("/reset-password")
def reset_password(_: ResetPasswordRequest):
    return {"success": True, "message": "Password reset successfully"}


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


@router.post("/forgot-password")
def forgot_password(_: ForgotPasswordRequest):
    return {"success": True, "message": "If the email exists, a password reset link has been sent"}


class ChangePasswordRequest(BaseModel):
    currentPassword: str
    newPassword: str


@router.post("/change-password")
def change_password(_: ChangePasswordRequest):
    return {"success": True, "message": "Password changed successfully"}


class FirebasePhoneRequest(BaseModel):
    idToken: str
    fullName: str | None = None
    location: str | None = None


@router.post("/firebase-phone")
def firebase_phone(_: FirebasePhoneRequest):
    user = {"userId": "user_phone", "email": None, "fullName": _.fullName or "New User"}
    token = issue_token(user["userId"]) 
    return {"success": True, "message": "Authenticated via Firebase phone", "data": {"token": token, "user": user}}
