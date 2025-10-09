from __future__ import annotations
from fastapi import APIRouter, Depends
from ..middleware.auth import get_current_user

router = APIRouter()


@router.get('/profile')
async def profile(user=Depends(get_current_user)):
    return {'success': True, 'data': {'profile': {'userId': user['userId'], 'points': 0, 'level': 1}}}


@router.get('/leaderboard')
async def leaderboard(page: int = 1, limit: int = 20, type: str = 'points', user=Depends(get_current_user)):
    return {'success': True, 'data': {'leaderboard': [], 'pagination': {'page': page, 'limit': limit, 'total': 0}}}


@router.get('/badges')
async def badges(user=Depends(get_current_user)):
    return {'success': True, 'data': {'badges': []}}


@router.post('/redeem')
async def redeem(points: int, reason: str | None = None, user=Depends(get_current_user)):
    return {'success': True, 'message': 'Points redeemed'}


@router.get('/achievements')
async def achievements(user=Depends(get_current_user)):
    return {'success': True, 'data': {'achievements': []}}


@router.get('/statistics')
async def statistics(user=Depends(get_current_user)):
    return {'success': True, 'data': {'statistics': {}}}
