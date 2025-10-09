from __future__ import annotations
from fastapi import APIRouter, Depends
from datetime import datetime, timedelta
from ..middleware.auth import get_current_user

router = APIRouter()


@router.get('/suggestions')
async def suggestions(user=Depends(get_current_user)):
    suggestions = [
        {
            'messageEn': 'You earned 20% more than last week, save KES 500 to reach goal.',
            'messageSw': 'Ulipata 20% zaidi kuliko wiki iliyopita, weka KES 500 kufikia lengo.',
            'category': 'earning',
            'priority': 'high',
            'actionable': True,
            'createdAt': datetime.utcnow().isoformat()
        }
    ]
    return {'success': True, 'data': {'suggestions': suggestions, 'languageCode': 'en'}}


@router.get('/insights')
async def insights(period: int = 30, user=Depends(get_current_user)):
    data = {
        'monthlyEarnings': 0,
        'monthlySavings': 0,
        'monthlySpending': 0,
        'savingsRate': 0,
        'jobCompletionRate': 0,
        'totalJobs': 0,
        'completedJobs': 0,
        'activeSavingsGoals': 0,
        'completedSavingsGoals': 0,
        'period': period,
        'generatedAt': datetime.utcnow().isoformat()
    }
    return {'success': True, 'data': {'insights': data, 'period': period, 'generatedAt': datetime.utcnow().isoformat()}}


@router.get('/market-trends')
async def market_trends(period: int = 30, location: str | None = None, user=Depends(get_current_user)):
    trends = {
        'jobTrends': {},
        'locationTrends': {},
        'skillTrends': {},
        'period': period,
        'generatedAt': datetime.utcnow().isoformat()
    }
    return {'success': True, 'data': {'trends': trends}}
