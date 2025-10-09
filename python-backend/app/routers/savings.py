from __future__ import annotations
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from datetime import datetime
from ..middleware.auth import get_current_user
from typing import List

router = APIRouter()


class CreateGoalRequest(BaseModel):
    name: str
    target: float
    dueDate: str | None = None
    category: str = 'Personal'
    hustle: str | None = None


@router.get('/goals')
async def goals(page: int = 1, limit: int = 20, user=Depends(get_current_user)):
    return {'success': True, 'data': {'goals': [], 'pagination': {'page': page, 'limit': limit, 'total': 0}}}


@router.post('/goals')
async def create_goal(req: CreateGoalRequest, user=Depends(get_current_user)):
    goal = {
        'id': f'goal_{int(datetime.utcnow().timestamp())}',
        'userId': user['userId'],
        'name': req.name,
        'target': req.target,
        'saved': 0,
        'category': req.category,
    }
    return {'success': True, 'data': {'goal': goal}}


class ContributeRequest(BaseModel):
    amount: float
    pin: str
    source: str = 'manual'
    hustle: str | None = None


@router.post('/goals/{goalId}/contribute')
async def contribute(goalId: str, req: ContributeRequest, user=Depends(get_current_user)):
    txn = {
        'id': f'contrib_{int(datetime.utcnow().timestamp())}',
        'goalId': goalId,
        'amount': req.amount,
        'date': datetime.utcnow().isoformat(),
    }
    return {'success': True, 'message': 'Contribution successful', 'data': {'transaction': txn}}


@router.get('/loans')
async def loans(page: int = 1, limit: int = 20, status: str | None = None, user=Depends(get_current_user)):
    return {'success': True, 'data': {'loans': [], 'pagination': {'page': page, 'limit': limit, 'total': 0}}}


class LoanRequest(BaseModel):
    amount: float
    purpose: str
    termMonths: int = 12
    collateral: str | None = None
    guarantor: dict | None = None


@router.post('/loans')
async def request_loan(req: LoanRequest, user=Depends(get_current_user)):
    loan = {
        'id': f'loan_{int(datetime.utcnow().timestamp())}',
        'amount': req.amount,
        'purpose': req.purpose,
        'termMonths': req.termMonths,
        'status': 'requested'
    }
    return {'success': True, 'data': {'loan': loan}}


@router.get('/statistics')
async def statistics(user=Depends(get_current_user)):
    return {'success': True, 'data': {'statistics': {}}}


# SACCO directory and submission endpoints (for eligibility increase)
class Sacco(BaseModel):
    name: str
    id: str
    country: str = 'KE'


SACCOS: List[Sacco] = [
    Sacco(name='Stima SACCO', id='stima-ke'),
    Sacco(name='Mwalimu SACCO', id='mwalimu-ke'),
    Sacco(name='Kenya Police SACCO', id='kps-ke'),
    Sacco(name='KCB SACCO', id='kcb-ke'),
    Sacco(name='Co-op SACCO', id='coop-ke'),
]


@router.get('/saccos')
async def list_saccos(q: str | None = None, user=Depends(get_current_user)):
    items = SACCOS
    if q:
        items = [s for s in items if q.lower() in s.name.lower()]
    return {'success': True, 'data': {'saccos': [s.model_dump() for s in items]}}


class SaccoEligibilityRequest(BaseModel):
    saccoId: str
    membershipNumber: str
    amountContributed: float
    evidenceType: str
    notes: str | None = None
    documents: list[str] | None = None  # URLs/ids to previously uploaded files


@router.post('/saccos/eligibility')
async def submit_sacco_eligibility(req: SaccoEligibilityRequest, user=Depends(get_current_user)):
    # Stub: accept and return acknowledgement with increased tentative eligibility
    increased_amount = min(req.amountContributed * 0.8, 200000.0)
    return {
        'success': True,
        'message': 'Eligibility submission received',
        'data': {
            'saccoId': req.saccoId,
            'membershipNumber': req.membershipNumber,
            'accepted': True,
            'proposedEligibility': increased_amount,
            'reviewEtaDays': 2,
        },
    }
