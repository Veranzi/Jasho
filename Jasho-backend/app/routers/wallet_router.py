# app/routers/wallet_router.py
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlmodel import Session, select
from app.database import get_session
from app.models import Wallet, User
from app.schemas import WalletTopup
from app.auth import decode_token

router = APIRouter(prefix="/wallet", tags=["wallet"])

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

@router.get("/balance")
def get_balance(user: User = Depends(get_user), session: Session = Depends(get_session)):
    wallet = session.exec(select(Wallet).where(Wallet.user_id == user.id)).first()
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    return {"balance": wallet.balance}

@router.post("/topup")
def topup(payload: WalletTopup, user: User = Depends(get_user), session: Session = Depends(get_session)):
    wallet = session.exec(select(Wallet).where(Wallet.user_id == user.id)).first()
    if not wallet:
        wallet = Wallet(user_id=user.id, balance=0.0)
    wallet.balance += payload.amount
    session.add(wallet)
    session.commit()
    return {"balance": wallet.balance}
@router.post("/withdraw")
def withdraw(payload: WalletTopup, user: User = Depends(get_user), session: Session = Depends(get_session)):
    wallet = session.exec(select(Wallet).where(Wallet.user_id == user.id)).first()
    if not wallet or wallet.balance < payload.amount:
        raise HTTPException(status_code=400, detail="Insufficient funds")
    wallet.balance -= payload.amount
    session.add(wallet)
    session.commit()
    return {"balance": wallet.balance}
@router.get("/history")
def get_transaction_history(user: User = Depends(get_user), session: Session = Depends(get_session)):
    # Placeholder for transaction history logic
    return {"transactions": []}
@router.post("/fraud-report")
def report_fraud(title: str, details: str = None, user: User = Depends(get_user), session: Session = Depends(get_session)):
    from app.models import FraudReport
    report = FraudReport(user_id=user.id, title=title, details=details)
    session.add(report)
    session.commit()
    return {"status": "reported", "report_id": report.id}
@router.get("/fraud-reports")
def get_fraud_reports(user: User = Depends(get_user), session: Session = Depends(get_session)):
    from app.models import FraudReport
    reports = session.exec(select(FraudReport).where(FraudReport.user_id == user.id)).all()
    return {"reports": reports}
@router.get("/all-fraud-reports")
def get_all_fraud_reports(session: Session = Depends(get_session)):
    from app.models import FraudReport
    reports = session.exec(select(FraudReport)).all()
    return {"reports": reports}
@router.delete("/fraud-report/{report_id}")
def delete_fraud_report(report_id: int, user: User = Depends(get_user), session: Session = Depends(get_session)):
    from app.models import FraudReport
    report = session.get(FraudReport, report_id)
    if not report or report.user_id != user.id:
        raise HTTPException(status_code=404, detail="Report not found")
    session.delete(report)
    session.commit()
    return {"status": "deleted"}
@router.put("/fraud-report/{report_id}")
def update_fraud_report(report_id: int, title: str = None, details: str = None, user: User = Depends(get_user), session: Session = Depends(get_session)):
    from app.models import FraudReport
    report = session.get(FraudReport, report_id)
    if not report or report.user_id != user.id:
        raise HTTPException(status_code=404, detail="Report not found")
    if title:
        report.title = title
    if details:
        report.details = details
    session.add(report)
    session.commit()
    return {"status": "updated", "report": report}
@router.get("/admin/balances")
def get_all_user_balances(session: Session = Depends(get_session)):
    wallets = session.exec(select(Wallet)).all()
    return {"wallets": wallets}
