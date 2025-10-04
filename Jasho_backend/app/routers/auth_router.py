from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from passlib.hash import bcrypt
from app.database import get_db
from app.schemas.user_schema import UserSignup, UserLogin
from app.models.models import User
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

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

@router.post("/verify-email")
async def verify_email(
    email: str,
    verification_code: str,
    db: Session = Depends(get_db)
):
    """Verify email address with verification code"""
    try:
        # Mock email verification - replace with actual verification logic
        verification_result = {
            "success": True,
            "message": "Email verified successfully",
            "data": {
                "email": email,
                "verified": True,
                "verifiedAt": "2024-01-01T00:00:00Z"
            }
        }
        
        return verification_result
        
    except Exception as e:
        logger.error(f"Error verifying email: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to verify email")

@router.post("/verify-phone")
async def verify_phone(
    phone_number: str,
    verification_code: str,
    db: Session = Depends(get_db)
):
    """Verify phone number with verification code"""
    try:
        # Mock phone verification - replace with actual verification logic
        verification_result = {
            "success": True,
            "message": "Phone number verified successfully",
            "data": {
                "phoneNumber": phone_number,
                "verified": True,
                "verifiedAt": "2024-01-01T00:00:00Z"
            }
        }
        
        return verification_result
        
    except Exception as e:
        logger.error(f"Error verifying phone: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to verify phone")

@router.post("/forgot-password")
async def forgot_password(
    email: str,
    db: Session = Depends(get_db)
):
    """Send password reset email"""
    try:
        # Check if user exists
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Mock password reset - replace with actual email sending logic
        reset_result = {
            "success": True,
            "message": "Password reset email sent successfully",
            "data": {
                "email": email,
                "resetToken": "mock_reset_token_123",
                "expiresAt": "2024-01-01T01:00:00Z"
            }
        }
        
        return reset_result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending password reset: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to send password reset")

@router.post("/reset-password")
async def reset_password(
    token: str,
    new_password: str,
    db: Session = Depends(get_db)
):
    """Reset password with reset token"""
    try:
        # Mock password reset - replace with actual token validation and password update
        hashed_password = bcrypt.hash(new_password)
        
        reset_result = {
            "success": True,
            "message": "Password reset successfully",
            "data": {
                "resetAt": "2024-01-01T00:00:00Z"
            }
        }
        
        return reset_result
        
    except Exception as e:
        logger.error(f"Error resetting password: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to reset password")

@router.post("/change-password")
async def change_password(
    current_password: str,
    new_password: str,
    user_id: int,
    db: Session = Depends(get_db)
):
    """Change user password"""
    try:
        # Get user
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Verify current password
        if not bcrypt.verify(current_password, user.password_hash):
            raise HTTPException(status_code=400, detail="Current password is incorrect")
        
        # Update password
        user.password_hash = bcrypt.hash(new_password)
        db.commit()
        
        change_result = {
            "success": True,
            "message": "Password changed successfully",
            "data": {
                "changedAt": "2024-01-01T00:00:00Z"
            }
        }
        
        return change_result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error changing password: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to change password")

