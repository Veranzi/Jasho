from __future__ import annotations
from fastapi import APIRouter, Depends
from datetime import datetime
from ..middleware.auth import get_current_user

router = APIRouter()


@router.get('/score')
async def score(user=Depends(get_current_user)):
    return {'success': True, 'data': {'score': {'currentScore': 300, 'updatedAt': datetime.utcnow().isoformat()}}}


@router.get('/analysis')
async def analysis(user=Depends(get_current_user)):
    analysis = {
        'incomes': 0,
        'deposits': 0,
        'expenditure': 0,
        'withdrawals': 0,
        'otherLoans': 0,
        'paymentHistory': {'onTime': 0, 'late': 0, 'missed': 0},
        'predictionConfidence': 0.0,
    }
    return {'success': True, 'data': analysis}


@router.get('/history')
async def history(page: int = 1, limit: int = 20, user=Depends(get_current_user)):
    return {'success': True, 'data': {'history': [], 'pagination': {'page': page, 'limit': limit, 'total': 0}}}


@router.post('/recalculate')
async def recalculate(user=Depends(get_current_user)):
    return {'success': True, 'message': 'Credit score recalculation started'}


@router.get('/eligibility')
async def eligibility(amount: float, termMonths: int, user=Depends(get_current_user)):
    return {'success': True, 'data': {'eligible': True, 'maxAmount': amount, 'termMonths': termMonths}}


@router.get('/factors')
async def factors(user=Depends(get_current_user)):
    return {'success': True, 'data': {'factors': []}}


@router.get('/comparison')
async def comparison(user=Depends(get_current_user)):
    return {'success': True, 'data': {'comparison': {}}}
