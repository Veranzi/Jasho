from fastapi import APIRouter, Depends, Header, HTTPException
from sqlmodel import Session
from app.database import get_session
from app.models.models import User
from app.auth import decode_token
from app.services.credit_scoring import CreditScoringService


router = APIRouter(prefix="/insights", tags=["insights"])


def get_user(authorization: str = Header(None), session: Session = Depends(get_session)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing auth")
    token = authorization.split("Bearer ")[-1]
    user_id = decode_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = session.get(User, int(user_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/credit-score")
def credit_score(user: User = Depends(get_user), session: Session = Depends(get_session)):
    svc = CreditScoringService()
    res = svc.compute_credit_score(user.id, session)
    return res
