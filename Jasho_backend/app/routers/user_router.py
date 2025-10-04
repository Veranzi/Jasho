"""
User Management Router
Handles user profile, KYC, and profile image operations
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
from app.database import SessionLocal
from app.schemas.user_schema import UserProfileUpdate, KycData
from app.core.firebase_config import verify_token
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import logging

router = APIRouter()
security = HTTPBearer()
logger = logging.getLogger(__name__)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current authenticated user"""
    try:
        token = credentials.credentials
        decoded_token = verify_token(token)
        if not decoded_token:
            raise HTTPException(status_code=401, detail="Invalid authentication token")
        return decoded_token
    except Exception as e:
        logger.error(f"Authentication failed: {str(e)}")
        raise HTTPException(status_code=401, detail="Authentication failed")

@router.get("/profile")
async def get_user_profile(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user profile information"""
    try:
        user_id = current_user.get("uid")
        
        # Mock user profile data - replace with actual database query
        profile_data = {
            "success": True,
            "data": {
                "id": user_id,
                "email": current_user.get("email", ""),
                "fullName": "John Doe",  # Replace with actual data
                "phoneNumber": "+254700000000",  # Replace with actual data
                "location": "Nairobi, Kenya",  # Replace with actual data
                "skills": ["Programming", "Design"],  # Replace with actual data
                "dateOfBirth": "1990-01-01",  # Replace with actual data
                "gender": "Male",  # Replace with actual data
                "kycStatus": "pending",  # Replace with actual data
                "profileImage": None,  # Replace with actual data
                "createdAt": "2024-01-01T00:00:00Z",
                "updatedAt": "2024-01-01T00:00:00Z"
            }
        }
        
        return profile_data
        
    except Exception as e:
        logger.error(f"Error getting user profile: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get user profile")

@router.put("/profile")
async def update_user_profile(
    profile_data: UserProfileUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user profile information"""
    try:
        user_id = current_user.get("uid")
        
        # Mock profile update - replace with actual database update
        updated_profile = {
            "success": True,
            "message": "Profile updated successfully",
            "data": {
                "id": user_id,
                "email": current_user.get("email", ""),
                "fullName": profile_data.fullName,
                "phoneNumber": profile_data.phoneNumber,
                "location": profile_data.location,
                "skills": profile_data.skills,
                "dateOfBirth": profile_data.dateOfBirth,
                "gender": profile_data.gender,
                "updatedAt": "2024-01-01T00:00:00Z"
            }
        }
        
        return updated_profile
        
    except Exception as e:
        logger.error(f"Error updating user profile: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update user profile")

@router.post("/kyc")
async def complete_kyc(
    kyc_data: KycData,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Complete KYC verification"""
    try:
        user_id = current_user.get("uid")
        
        # Mock KYC completion - replace with actual KYC processing
        kyc_result = {
            "success": True,
            "message": "KYC submitted successfully",
            "data": {
                "id": user_id,
                "kycStatus": "pending",
                "submittedAt": "2024-01-01T00:00:00Z",
                "estimatedReviewTime": "24-48 hours"
            }
        }
        
        return kyc_result
        
    except Exception as e:
        logger.error(f"Error completing KYC: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to complete KYC")

@router.post("/upload-profile-image")
async def upload_profile_image(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload profile image"""
    try:
        user_id = current_user.get("uid")
        
        # Validate file type
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Validate file size (max 5MB)
        file_size = 0
        content = await file.read()
        file_size = len(content)
        
        if file_size > 5 * 1024 * 1024:  # 5MB
            raise HTTPException(status_code=400, detail="File size must be less than 5MB")
        
        # Mock image upload - replace with actual file storage
        image_url = f"http://localhost:8000/uploads/profile-images/{user_id}_{file.filename}"
        
        upload_result = {
            "success": True,
            "message": "Profile image uploaded successfully",
            "data": {
                "id": user_id,
                "imageUrl": image_url,
                "filename": file.filename,
                "size": file_size,
                "uploadedAt": "2024-01-01T00:00:00Z"
            }
        }
        
        return upload_result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading profile image: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to upload profile image")

@router.get("/preferences")
async def get_user_preferences(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user preferences"""
    try:
        user_id = current_user.get("uid")
        
        # Mock preferences data - replace with actual database query
        preferences = {
            "success": True,
            "data": {
                "id": user_id,
                "language": "en",
                "notifications": {
                    "email": True,
                    "push": True,
                    "sms": False
                },
                "privacy": {
                    "profileVisibility": "public",
                    "showBalance": True,
                    "showTransactions": False
                },
                "updatedAt": "2024-01-01T00:00:00Z"
            }
        }
        
        return preferences
        
    except Exception as e:
        logger.error(f"Error getting user preferences: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get user preferences")

@router.put("/preferences")
async def update_user_preferences(
    preferences: Dict[str, Any],
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user preferences"""
    try:
        user_id = current_user.get("uid")
        
        # Mock preferences update - replace with actual database update
        updated_preferences = {
            "success": True,
            "message": "Preferences updated successfully",
            "data": {
                "id": user_id,
                "language": preferences.get("language", "en"),
                "notifications": preferences.get("notifications", {}),
                "privacy": preferences.get("privacy", {}),
                "updatedAt": "2024-01-01T00:00:00Z"
            }
        }
        
        return updated_preferences
        
    except Exception as e:
        logger.error(f"Error updating user preferences: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update user preferences")
