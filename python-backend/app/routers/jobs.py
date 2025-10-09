from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from ..middleware.auth import get_current_user


router = APIRouter()


class Job(BaseModel):
    id: str
    title: str
    description: str
    location: str
    priceKes: float
    category: str
    urgency: str = 'normal'
    status: str = 'active'
    createdAt: str


JOBS: dict[str, Job] = {}


@router.get('/')
async def list_jobs(page: int = 1, limit: int = 20, category: Optional[str] = None, location: Optional[str] = None, minPrice: Optional[float] = None, maxPrice: Optional[float] = None, urgency: Optional[str] = None, q: Optional[str] = None):
    items = list(JOBS.values())
    if category:
        items = [j for j in items if j.category == category]
    if location:
        items = [j for j in items if location.lower() in j.location.lower()]
    if minPrice is not None:
        items = [j for j in items if j.priceKes >= minPrice]
    if maxPrice is not None:
        items = [j for j in items if j.priceKes <= maxPrice]
    if urgency:
        items = [j for j in items if j.urgency == urgency]
    if q:
        items = [j for j in items if q.lower() in (j.title + ' ' + j.description).lower()]
    total = len(items)
    start = (page - 1) * limit
    end = start + limit
    return {'success': True, 'data': {'jobs': [j.model_dump() for j in items[start:end]], 'pagination': {'page': page, 'limit': limit, 'total': total}}}


class PostJobRequest(BaseModel):
    title: str
    description: str
    location: str
    priceKes: float
    category: str
    urgency: str = 'normal'
    estimatedDuration: Optional[int] = None
    requirements: Optional[list[str]] = None
    skills: Optional[list[str]] = None
    schedule: Optional[dict] = None


@router.post('/')
async def post_job(req: PostJobRequest, user=Depends(get_current_user)):
    job_id = f"job_{int(datetime.utcnow().timestamp())}"
    job = Job(
        id=job_id,
        title=req.title,
        description=req.description,
        location=req.location,
        priceKes=req.priceKes,
        category=req.category,
        urgency=req.urgency,
        createdAt=datetime.utcnow().isoformat(),
    )
    JOBS[job_id] = job
    return {'success': True, 'data': {'job': job.model_dump()}}


class ApplyJobRequest(BaseModel):
    message: Optional[str] = None
    proposedPrice: Optional[float] = None
    estimatedDuration: Optional[int] = None


APPLICATIONS: dict[str, list[dict]] = {}


@router.post('/{jobId}/apply')
async def apply_for_job(jobId: str, req: ApplyJobRequest, user=Depends(get_current_user)):
    if jobId not in JOBS:
        raise HTTPException(status_code=404, detail={'success': False, 'message': 'Job not found', 'code': 'JOB_NOT_FOUND'})
    entry = {
        'jobId': jobId,
        'userId': user['userId'],
        'message': req.message,
        'proposedPrice': req.proposedPrice,
        'estimatedDuration': req.estimatedDuration,
        'appliedAt': datetime.utcnow().isoformat(),
        'status': 'applied',
    }
    APPLICATIONS.setdefault(jobId, []).append(entry)
    return {'success': True, 'data': {'application': entry}}


@router.post('/{jobId}/complete')
async def complete_job(jobId: str, rating: Optional[float] = None, review: Optional[str] = None, completionNotes: Optional[str] = None, completionImages: Optional[list[str]] = None, user=Depends(get_current_user)):
    job = JOBS.get(jobId)
    if not job:
        raise HTTPException(status_code=404, detail={'success': False, 'message': 'Job not found', 'code': 'JOB_NOT_FOUND'})
    job.status = 'completed'
    JOBS[jobId] = job
    return {'success': True, 'data': {'job': job.model_dump(), 'rating': rating, 'review': review}}


@router.get('/user/{type}')
async def user_jobs(type: str, page: int = 1, limit: int = 20, user=Depends(get_current_user)):
    items = list(JOBS.values())
    total = len(items)
    start = (page - 1) * limit
    end = start + limit
    return {'success': True, 'data': {'jobs': [j.model_dump() for j in items[start:end]], 'pagination': {'page': page, 'limit': limit, 'total': total}}}


@router.get('/applications/my')
async def my_applications(page: int = 1, limit: int = 20, status: Optional[str] = None, user=Depends(get_current_user)):
    apps = [a for lst in APPLICATIONS.values() for a in lst if a.get('userId') == user['userId']]
    if status:
        apps = [a for a in apps if a.get('status') == status]
    total = len(apps)
    start = (page - 1) * limit
    end = start + limit
    return {'success': True, 'data': {'applications': apps[start:end], 'pagination': {'page': page, 'limit': limit, 'total': total}}}
