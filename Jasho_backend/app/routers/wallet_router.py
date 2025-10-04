# app/routers/wallet_router.py
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlmodel import Session, select
from app.database import get_session
from app.models.models import Wallet, User
from app.schemas.schemas import WalletTopup
from app.auth import decode_token
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

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

@router.post("/transfer")
async def transfer_money(
    recipient_phone: str,
    amount: float,
    pin: str,
    description: str = "Transfer",
    user: User = Depends(get_user),
    session: Session = Depends(get_session)
):
    """Transfer money to another user"""
    try:
        # Get sender's wallet
        sender_wallet = session.exec(select(Wallet).where(Wallet.user_id == user.id)).first()
        if not sender_wallet:
            raise HTTPException(status_code=404, detail="Sender wallet not found")
        
        # Check if sender has sufficient balance
        if sender_wallet.balance < amount:
            raise HTTPException(status_code=400, detail="Insufficient balance")
        
        # Find recipient by phone number
        recipient = session.exec(select(User).where(User.phone == recipient_phone)).first()
        if not recipient:
            raise HTTPException(status_code=404, detail="Recipient not found")
        
        # Get recipient's wallet
        recipient_wallet = session.exec(select(Wallet).where(Wallet.user_id == recipient.id)).first()
        if not recipient_wallet:
            raise HTTPException(status_code=404, detail="Recipient wallet not found")
        
        # Mock PIN verification - replace with actual PIN verification
        if pin != "1234":  # Mock PIN
            raise HTTPException(status_code=400, detail="Invalid PIN")
        
        # Update balances
        sender_wallet.balance -= amount
        recipient_wallet.balance += amount
        
        session.commit()
        
        transfer_result = {
            "success": True,
            "message": "Transfer successful",
            "data": {
                "transactionId": f"TXN_{user.id}_{recipient.id}_{amount}",
                "amount": amount,
                "recipient": {
                    "phone": recipient_phone,
                    "name": recipient.name
                },
                "senderBalance": sender_wallet.balance,
                "description": description,
                "timestamp": "2024-01-01T00:00:00Z"
            }
        }
        
        return transfer_result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing transfer: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to process transfer")

@router.post("/convert")
async def convert_currency(
    from_currency: str,
    to_currency: str,
    amount: float,
    user: User = Depends(get_user),
    session: Session = Depends(get_session)
):
    """Convert currency"""
    try:
        # Mock exchange rates - replace with actual exchange rate API
        exchange_rates = {
            "KES": {"USD": 0.0067, "USDT": 0.0067},
            "USD": {"KES": 150.0, "USDT": 1.0},
            "USDT": {"KES": 150.0, "USD": 1.0}
        }
        
        if from_currency not in exchange_rates or to_currency not in exchange_rates[from_currency]:
            raise HTTPException(status_code=400, detail="Unsupported currency conversion")
        
        rate = exchange_rates[from_currency][to_currency]
        converted_amount = amount * rate
        
        conversion_result = {
            "success": True,
            "message": "Currency conversion successful",
            "data": {
                "fromCurrency": from_currency,
                "toCurrency": to_currency,
                "originalAmount": amount,
                "convertedAmount": converted_amount,
                "exchangeRate": rate,
                "timestamp": "2024-01-01T00:00:00Z"
            }
        }
        
        return conversion_result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error converting currency: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to convert currency")


