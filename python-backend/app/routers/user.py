from __future__ import annotations
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from ..middleware.auth import get_current_user
from ..services.repos import UsersRepo

router = APIRouter()


class UserProfile(BaseModel):
    userId: str
    fullName: str
    skills: list[str] = []
    location: str
    rating: float = 4.5
    isVerified: bool = False
    idType: str | None = None
    idNumber: str | None = None
    photoUrl: str | None = None
    absaAccountNumber: str | None = None
    email: str | None = None
    phoneNumber: str | None = None
    verificationLevel: str | None = None
    joinDate: str | None = None
    totalJobsCompleted: int | None = None
    totalEarnings: float | None = None
    totalSavings: float | None = None
    totalWithdrawals: float | None = None
    profileViews: int | None = None
    isKycComplete: bool | None = None


@router.get('/profile')
async def get_profile(user=Depends(get_current_user)):
    u = UsersRepo.find_by_id(user['userId']) or {}
    profile = UserProfile(
        userId=user['userId'],
        fullName=str(u.get('fullName', '')) or 'User',
        skills=list(u.get('skills', [])),
        location=str(u.get('location', 'Unknown')),
        email=u.get('email'),
    )
    return {'success': True, 'data': {'profile': profile.model_dump()}}


class UpdateProfileRequest(BaseModel):
    fullName: str | None = None
    skills: list[str] | None = None
    location: str | None = None
    coordinates: dict | None = None


@router.put('/profile')
async def update_profile(req: UpdateProfileRequest, user=Depends(get_current_user)):
    updates = {}
    if req.fullName is not None:
        updates['fullName'] = req.fullName
    if req.skills is not None:
        updates['skills'] = req.skills
    if req.location is not None:
        updates['location'] = req.location
    if req.coordinates is not None:
        updates['coordinates'] = req.coordinates
    if updates:
        UsersRepo.update_profile(user['userId'], updates)
    return await get_profile(user)


class KycRequest(BaseModel):
    idType: str
    idNumber: str
    photoUrl: str | None = None
    documentUrls: list[str] | None = None


@router.post('/kyc')
async def complete_kyc(_: KycRequest, user=Depends(get_current_user)):
    profile = (await get_profile(user))['data']['profile']
    profile['isKycComplete'] = True
    return {'success': True, 'data': {'profile': profile}}


class AbsaRequest(BaseModel):
    accountNumber: str


@router.post('/absa-account')
async def link_absa(_: AbsaRequest, user=Depends(get_current_user)):
    profile = (await get_profile(user))['data']['profile']
    profile['absaAccountNumber'] = _.accountNumber
    return {'success': True, 'data': {'profile': profile}}


class LanguageRequest(BaseModel):
    language: str


@router.put('/language')
async def set_language(_: LanguageRequest, user=Depends(get_current_user)):
    return {'success': True, 'message': 'Language updated'}


class NotificationsRequest(BaseModel):
    email: bool | None = None
    sms: bool | None = None
    push: bool | None = None
    marketing: bool | None = None


@router.put('/notifications')
async def set_notifications(_: NotificationsRequest, user=Depends(get_current_user)):
    return {'success': True, 'message': 'Notifications updated'}


@router.get('/{userId}')
async def get_public_profile(userId: str):
    profile = UserProfile(
        userId=userId,
        fullName='Public User',
        skills=['Delivery'],
        location='Nairobi, CBD'
    )
    return {'success': True, 'data': {'profile': profile.model_dump()}}
