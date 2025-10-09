from __future__ import annotations
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from ..config import settings
from ..middleware.auth import get_current_user

router = APIRouter()


@router.post('/upload')
async def upload(profileImage: UploadFile = File(...), user=Depends(get_current_user)):
    if profileImage.content_type not in ['image/png', 'image/jpeg']:
        raise HTTPException(status_code=400, detail={'success': False, 'message': 'Unsupported image type', 'code': 'UNSUPPORTED_IMAGE'})
    path = settings.uploads_dir / f"profile_{user['userId']}.bin"
    with path.open('wb') as f:
        f.write(await profileImage.read())
    return {'success': True, 'data': {'url': f"/uploads/profile-images/profile_{user['userId']}.bin"}}


@router.put('/')
async def update(profileImage: UploadFile = File(...), user=Depends(get_current_user)):
    return await upload(profileImage, user)


@router.get('/{userId}')
async def get(userId: str, size: str = 'medium'):
    return {'success': True, 'data': {'url': f"/uploads/profile-images/profile_{userId}.bin"}}


@router.delete('/')
async def delete(user=Depends(get_current_user)):
    path = settings.uploads_dir / f"profile_{user['userId']}.bin"
    if path.exists():
        path.unlink()
    return {'success': True, 'message': 'Profile image deleted'}


@router.post('/validate')
async def validate(profileImage: UploadFile = File(...), user=Depends(get_current_user)):
    # Stub: Perform basic validation
    return {'success': True, 'data': {'valid': True}}
