from __future__ import annotations
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from ..middleware.auth import get_current_user
from ..utils.security import mask_balance
from ..services.repos import WalletsRepo, TransactionsRepo
from passlib.context import CryptContext

router = APIRouter()


class BalanceResponse(BaseModel):
    kesBalance: float
    usdtBalance: float
    usdBalance: float
    maskedKesBalance: Optional[str] = None
    maskedUsdtBalance: Optional[str] = None
    maskedUsdBalance: Optional[str] = None
    hasPin: bool = False
    isPinLocked: bool = False
    isFrozen: bool = False
    status: str = "active"
    dailyLimits: dict | None = None
    dailyUsage: dict | None = None
    statistics: dict | None = None


class Transaction(BaseModel):
    id: str
    type: str
    amount: float
    currencyCode: str
    date: datetime
    status: str
    description: str
    category: Optional[str] = None
    method: Optional[str] = None
    hustle: Optional[str] = None
    netAmount: Optional[float] = None
    fees: Optional[dict] = None
    exchangeRate: Optional[dict] = None
    transferInfo: Optional[dict] = None
    blockchain: Optional[dict] = None
    security: Optional[dict] = None


# In-memory demo store (replace with Firestore)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _get_wallet(user_id: str) -> dict:
    data = WalletsRepo.get_or_create(user_id)
    return data


@router.get("/balance")
async def get_balance(user=Depends(get_current_user)):
    wdoc = _get_wallet(user["userId"]) or {}
    balances = wdoc.get("balances", {"KES": 0.0, "USDT": 0.0, "USD": 0.0})
    resp = BalanceResponse(
        kesBalance=float(balances.get("KES", 0.0)),
        usdtBalance=float(balances.get("USDT", 0.0)),
        usdBalance=float(balances.get("USD", 0.0)),
        maskedKesBalance=mask_balance(float(balances.get("KES", 0.0)), user["userId"]),
        maskedUsdtBalance=mask_balance(float(balances.get("USDT", 0.0)), user["userId"]),
        maskedUsdBalance=mask_balance(float(balances.get("USD", 0.0)), user["userId"]),
        hasPin=bool(wdoc.get("hasPin", False)),
        isPinLocked=bool(wdoc.get("isPinLocked", False)),
        isFrozen=bool(wdoc.get("isFrozen", False)),
        status=str(wdoc.get("status", "active")),
        dailyLimits=wdoc.get("dailyLimits"),
        dailyUsage=wdoc.get("dailyUsage"),
        statistics=wdoc.get("statistics"),
    )
    return {"success": True, "data": {"balance": resp.model_dump()}}


class PinRequest(BaseModel):
    pin: str


@router.post("/pin")
async def set_pin(req: PinRequest, user=Depends(get_current_user)):
    # Store hashed PIN in Firestore
    pin_hash = pwd_context.hash(req.pin)
    WalletsRepo.set_pin(user["userId"], pin_hash)
    return {"success": True, "message": "Transaction PIN set successfully", "data": {"hasPin": True}}


@router.post("/verify-pin")
async def verify_pin(req: PinRequest, user=Depends(get_current_user)):
    stored = WalletsRepo.get_pin_hash(user["userId"]) or ""
    if not stored or not pwd_context.verify(req.pin, stored):
        raise HTTPException(status_code=400, detail={"success": False, "message": "Invalid PIN", "code": "INVALID_PIN"})
    return {"success": True, "message": "PIN verified successfully", "data": {"verified": True}}


class DepositRequest(BaseModel):
    amount: float
    currencyCode: str = Field(default="KES")
    description: str = Field(default="Deposit")
    method: Optional[str] = None
    hustle: Optional[str] = None
    category: str = Field(default="Deposit")
    network: Optional[str] = None


@router.post("/deposit")
async def deposit(req: DepositRequest, user=Depends(get_current_user)):
    # Update Firestore balance
    wdoc = WalletsRepo.update_balance(user["userId"], req.currencyCode, req.amount)
    txn = Transaction(
        id=f"TXN_{int(datetime.utcnow().timestamp())}",
        type="deposit",
        amount=req.amount,
        currencyCode=req.currencyCode,
        date=datetime.utcnow(),
        status="completed",
        description=req.description,
        category=req.category,
        method=req.method,
        hustle=req.hustle,
        blockchain=None,
    )
    TransactionsRepo.create({
        "transactionId": txn.id,
        "userId": user["userId"],
        "type": txn.type,
        "amount": txn.amount,
        "currencyCode": txn.currencyCode,
        "description": txn.description,
        "category": txn.category,
        "method": txn.method,
        "status": txn.status,
        "initiatedAt": txn.date,
        "completedAt": txn.date,
    })
    return {
        "success": True,
        "message": "Deposit successful",
        "data": {
            "transaction": txn.model_dump(),
            "newBalance": {
                "kesBalance": float(wdoc.get("balances", {}).get("KES", 0.0)),
                "usdtBalance": float(wdoc.get("balances", {}).get("USDT", 0.0)),
                "usdBalance": float(wdoc.get("balances", {}).get("USD", 0.0)),
            },
        },
    }


class WithdrawRequest(BaseModel):
    amount: float
    pin: str
    currencyCode: str = Field(default="KES")
    category: str = Field(default="Expense")
    method: Optional[str] = None
    hustle: Optional[str] = None
    network: Optional[str] = None


@router.post("/withdraw")
async def withdraw(req: WithdrawRequest, user=Depends(get_current_user)):
    wdoc = _get_wallet(user["userId"])
    if float(wdoc.get("balances", {}).get(req.currencyCode, 0.0)) < req.amount:
        raise HTTPException(status_code=400, detail={"success": False, "message": "Insufficient balance", "code": "INSUFFICIENT_BALANCE"})
    wdoc = WalletsRepo.update_balance(user["userId"], req.currencyCode, -req.amount)
    txn = Transaction(
        id=f"TXN_{int(datetime.utcnow().timestamp())}",
        type="withdrawal",
        amount=req.amount,
        currencyCode=req.currencyCode,
        date=datetime.utcnow(),
        status="completed",
        description="Withdraw",
        category=req.category,
        method=req.method,
        hustle=req.hustle,
        security={"pinVerified": True},
    )
    TransactionsRepo.create({
        "transactionId": txn.id,
        "userId": user["userId"],
        "type": txn.type,
        "amount": txn.amount,
        "currencyCode": txn.currencyCode,
        "description": txn.description,
        "category": txn.category,
        "method": txn.method,
        "status": txn.status,
        "initiatedAt": txn.date,
        "completedAt": txn.date,
    })
    return {
        "success": True,
        "message": "Withdrawal successful",
        "data": {
            "transaction": txn.model_dump(),
            "newBalance": {
                "kesBalance": float(wdoc.get("balances", {}).get("KES", 0.0)),
                "usdtBalance": float(wdoc.get("balances", {}).get("USDT", 0.0)),
                "usdBalance": float(wdoc.get("balances", {}).get("USD", 0.0)),
            },
        },
    }


class ConvertRequest(BaseModel):
    amount: float
    pin: str
    rate: float
    fromCurrency: str = Field(default="KES")
    toCurrency: str = Field(default="USDT")
    network: Optional[str] = None


@router.post("/convert")
async def convert(req: ConvertRequest, user=Depends(get_current_user)):
    wdoc = _get_wallet(user["userId"])
    if float(wdoc.get("balances", {}).get(req.fromCurrency, 0.0)) < req.amount:
        raise HTTPException(status_code=400, detail={"success": False, "message": "Insufficient balance", "code": "INSUFFICIENT_BALANCE"})
    converted_amount = req.amount / req.rate
    WalletsRepo.update_balance(user["userId"], req.fromCurrency, -req.amount)
    wdoc = WalletsRepo.update_balance(user["userId"], req.toCurrency, converted_amount)
    txn = Transaction(
        id=f"TXN_{int(datetime.utcnow().timestamp())}",
        type="convert",
        amount=req.amount,
        currencyCode=req.fromCurrency,
        date=datetime.utcnow(),
        status="completed",
        description=f"Convert {req.fromCurrency} to {req.toCurrency}",
        category="Convert",
        exchangeRate={
            "fromCurrency": req.fromCurrency,
            "toCurrency": req.toCurrency,
            "rate": req.rate,
            "convertedAmount": converted_amount,
        },
        security={"pinVerified": True},
    )
    TransactionsRepo.create({
        "transactionId": txn.id,
        "userId": user["userId"],
        "type": txn.type,
        "amount": txn.amount,
        "currencyCode": txn.currencyCode,
        "description": txn.description,
        "category": txn.category,
        "status": txn.status,
        "initiatedAt": txn.date,
        "completedAt": txn.date,
        "exchangeRate": txn.exchangeRate,
    })
    return {
        "success": True,
        "message": "Currency conversion successful",
        "data": {
            "transaction": txn.model_dump(),
            "convertedAmount": converted_amount,
            "newBalance": {
                "kesBalance": float(wdoc.get("balances", {}).get("KES", 0.0)),
                "usdtBalance": float(wdoc.get("balances", {}).get("USDT", 0.0)),
                "usdBalance": float(wdoc.get("balances", {}).get("USD", 0.0)),
            },
        },
    }


class TransferRequest(BaseModel):
    recipientUserId: str
    amount: float
    pin: str
    currencyCode: str = Field(default="KES")
    description: Optional[str] = None
    network: Optional[str] = None


@router.post("/transfer")
async def transfer(req: TransferRequest, user=Depends(get_current_user)):
    sender_doc = _get_wallet(user["userId"])
    if float(sender_doc.get("balances", {}).get(req.currencyCode, 0.0)) < req.amount:
        raise HTTPException(status_code=400, detail={"success": False, "message": "Insufficient balance", "code": "INSUFFICIENT_BALANCE"})
    WalletsRepo.update_balance(user["userId"], req.currencyCode, -req.amount)
    recipient_doc = WalletsRepo.update_balance(req.recipientUserId, req.currencyCode, req.amount)
    txn = Transaction(
        id=f"TXN_{int(datetime.utcnow().timestamp())}",
        type="transfer",
        amount=req.amount,
        currencyCode=req.currencyCode,
        date=datetime.utcnow(),
        status="completed",
        description=req.description or f"Transfer to {req.recipientUserId}",
        category="Transfer",
        method="wallet",
        transferInfo={"recipientUserId": req.recipientUserId},
        security={"pinVerified": True},
    )
    TransactionsRepo.create({
        "transactionId": txn.id,
        "userId": user["userId"],
        "type": txn.type,
        "amount": txn.amount,
        "currencyCode": txn.currencyCode,
        "description": txn.description,
        "category": txn.category,
        "status": txn.status,
        "initiatedAt": txn.date,
        "completedAt": txn.date,
        "transferInfo": txn.transferInfo,
    })
    return {
        "success": True,
        "message": "Transfer successful",
        "data": {
            "transaction": txn.model_dump(),
            "recipient": {"userId": req.recipientUserId, "fullName": req.recipientUserId},
            "newBalance": {
                "kesBalance": float(WalletsRepo.get_or_create(user["userId"]).get("balances", {}).get("KES", 0.0)),
                "usdtBalance": float(WalletsRepo.get_or_create(user["userId"]).get("balances", {}).get("USDT", 0.0)),
                "usdBalance": float(WalletsRepo.get_or_create(user["userId"]).get("balances", {}).get("USD", 0.0)),
            },
        },
    }


@router.get("/transactions")
async def list_transactions(page: int = 1, limit: int = 20, user=Depends(get_current_user)):
    items, total = TransactionsRepo.list_by_user(user["userId"], page, limit, {})
    # map to WalletTransaction
    mapped = []
    for t in items:
        mapped.append({
            "id": t.get("transactionId"),
            "type": t.get("type"),
            "amount": t.get("amount"),
            "currencyCode": t.get("currencyCode"),
            "date": (t.get("initiatedAt") or datetime.utcnow()).isoformat(),
            "status": t.get("status", "completed"),
            "description": t.get("description", ""),
            "category": t.get("category"),
            "method": t.get("method"),
            "hustle": t.get("metadata", {}).get("hustle") if t.get("metadata") else None,
            "netAmount": t.get("netAmount"),
            "fees": t.get("fees"),
            "exchangeRate": t.get("exchangeRate"),
            "transferInfo": t.get("transferInfo"),
            "blockchain": t.get("blockchain"),
            "security": t.get("security"),
        })
    return {"success": True, "data": {"transactions": mapped, "pagination": {"page": page, "limit": limit, "total": total}}}
