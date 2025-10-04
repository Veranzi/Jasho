# app/routers/wallet_router.py
from fastapi import APIRouter, Depends, Header, HTTPException, Response
from sqlmodel import Session, select
from app.database import get_session
from app.models.models import Wallet, User
from app.schemas.schemas import WalletTopup
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi.responses import JSONResponse
from app.auth import decode_token
import time
import json
import os
from app.services.blockchain_simulator import BlockchainClient

router = APIRouter(prefix="/wallet", tags=["wallet"])
limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])

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

def mask_amount(amount: float) -> str:
    # Show only leading digit and mask rest
    amt = f"{amount:,.2f}"
    parts = amt.split(",")
    if not parts:
        return "***"
    first = parts[0]
    return first[0] + "***" + ("." + amt.split(".")[-1] if "." in amt else "")


@router.get("/balance")
@limiter.limit("10/minute")
def get_balance(user: User = Depends(get_user), session: Session = Depends(get_session)):
    wallet = session.exec(select(Wallet).where(Wallet.user_id == user.id)).first()
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    # Always return masked by default
    return {"balance_masked": mask_amount(wallet.balance)}


@router.get("/balance/unmask")
@limiter.limit("5/minute")
def unmask_balance(otp: str, user: User = Depends(get_user), session: Session = Depends(get_session)):
    # In production, verify OTP via Twilio Verify or custom TOTP
    if otp != os.getenv("DEBUG_MASTER_OTP", "123456"):
        raise HTTPException(status_code=401, detail="Invalid OTP")
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
    # Log on-chain (fire-and-forget)
    try:
        bc = BlockchainClient()
        bc.log_transaction_on_chain({
            "type": "topup",
            "user_id": user.id,
            "amount": payload.amount,
            "ts": int(time.time())
        })
    except Exception:
        pass
    return {"balance": wallet.balance}
@router.post("/withdraw")
def withdraw(payload: WalletTopup, user: User = Depends(get_user), session: Session = Depends(get_session)):
    wallet = session.exec(select(Wallet).where(Wallet.user_id == user.id)).first()
    if not wallet or wallet.balance < payload.amount:
        raise HTTPException(status_code=400, detail="Insufficient funds")
    wallet.balance -= payload.amount
    session.add(wallet)
    session.commit()
    # Log on-chain
    try:
        bc = BlockchainClient()
        bc.log_transaction_on_chain({
            "type": "withdraw",
            "user_id": user.id,
            "amount": payload.amount,
            "ts": int(time.time())
        })
    except Exception:
        pass
    return {"balance": wallet.balance}
@router.get("/history")
def get_transaction_history(user: User = Depends(get_user), session: Session = Depends(get_session)):
    # Placeholder for transaction history logic
    return {"transactions": []}


@router.get("/history/export")
def export_history(user: User = Depends(get_user)):
    # Issue a short-lived signed URL token (stateless, simple demo)
    token = json.dumps({"u": user.id, "exp": int(time.time()) + 60}).encode("utf-8")
    # In production, sign with HMAC and store server-side lock
    b64 = token.hex()
    return {"download_token": b64, "expires_in_seconds": 60}


@router.get("/history/download")
def download_history(token: str, response: Response, user: User = Depends(get_user)):
    try:
        data = bytes.fromhex(token)
        obj = json.loads(data)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid token")
    if obj.get("u") != user.id or obj.get("exp", 0) < int(time.time()):
        raise HTTPException(status_code=401, detail="Expired or invalid")
    # Return CSV content (placeholder)
    csv_content = "date,amount,type\n"
    response.headers["Content-Disposition"] = "attachment; filename=history.csv"
    return Response(content=csv_content, media_type="text/csv")
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


