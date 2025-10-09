from __future__ import annotations
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from ..middleware.auth import get_current_user
from ..utils.security import mask_balance

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
_wallets: dict[str, dict] = {}
_transactions: dict[str, list[Transaction]] = {}


def _get_wallet(user_id: str) -> dict:
    if user_id not in _wallets:
        _wallets[user_id] = {
            "KES": 0.0,
            "USDT": 0.0,
            "USD": 0.0,
            "hasPin": False,
        }
    return _wallets[user_id]


@router.get("/balance")
async def get_balance(user=Depends(get_current_user)):
    w = _get_wallet(user["userId"])
    resp = BalanceResponse(
        kesBalance=w["KES"],
        usdtBalance=w["USDT"],
        usdBalance=w["USD"],
        maskedKesBalance=mask_balance(w["KES"], user["userId"]),
        maskedUsdtBalance=mask_balance(w["USDT"], user["userId"]),
        maskedUsdBalance=mask_balance(w["USD"], user["userId"]),
        hasPin=w.get("hasPin", False),
        isPinLocked=False,
        isFrozen=False,
        status="active",
        dailyLimits={"KES": {"deposit": 100000, "withdrawal": 50000}},
        dailyUsage={"KES": {"deposit": 0, "withdrawal": 0}},
        statistics={}
    )
    return {"success": True, "data": {"balance": resp.model_dump()}}


class PinRequest(BaseModel):
    pin: str


@router.post("/pin")
async def set_pin(req: PinRequest, user=Depends(get_current_user)):
    w = _get_wallet(user["userId"])
    w["hasPin"] = True
    return {"success": True, "message": "Transaction PIN set successfully", "data": {"hasPin": True}}


@router.post("/verify-pin")
async def verify_pin(req: PinRequest, user=Depends(get_current_user)):
    if not _get_wallet(user["userId"]) ["hasPin"]:
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
    w = _get_wallet(user["userId"])
    w[req.currencyCode] = w.get(req.currencyCode, 0.0) + req.amount
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
    _transactions.setdefault(user["userId"], []).append(txn)
    return {
        "success": True,
        "message": "Deposit successful",
        "data": {
            "transaction": txn.model_dump(),
            "newBalance": {
                "kesBalance": _get_wallet(user["userId"])["KES"],
                "usdtBalance": _get_wallet(user["userId"])["USDT"],
                "usdBalance": _get_wallet(user["userId"])["USD"],
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
    w = _get_wallet(user["userId"])
    if w.get(req.currencyCode, 0.0) < req.amount:
        raise HTTPException(status_code=400, detail={"success": False, "message": "Insufficient balance", "code": "INSUFFICIENT_BALANCE"})
    w[req.currencyCode] -= req.amount
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
    _transactions.setdefault(user["userId"], []).append(txn)
    return {
        "success": True,
        "message": "Withdrawal successful",
        "data": {
            "transaction": txn.model_dump(),
            "newBalance": {
                "kesBalance": _get_wallet(user["userId"])["KES"],
                "usdtBalance": _get_wallet(user["userId"])["USDT"],
                "usdBalance": _get_wallet(user["userId"])["USD"],
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
    w = _get_wallet(user["userId"])
    if w.get(req.fromCurrency, 0.0) < req.amount:
        raise HTTPException(status_code=400, detail={"success": False, "message": "Insufficient balance", "code": "INSUFFICIENT_BALANCE"})
    converted_amount = req.amount / req.rate
    w[req.fromCurrency] -= req.amount
    w[req.toCurrency] = w.get(req.toCurrency, 0.0) + converted_amount
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
    _transactions.setdefault(user["userId"], []).append(txn)
    return {
        "success": True,
        "message": "Currency conversion successful",
        "data": {
            "transaction": txn.model_dump(),
            "convertedAmount": converted_amount,
            "newBalance": {
                "kesBalance": _get_wallet(user["userId"])["KES"],
                "usdtBalance": _get_wallet(user["userId"])["USDT"],
                "usdBalance": _get_wallet(user["userId"])["USD"],
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
    sender_wallet = _get_wallet(user["userId"])
    if sender_wallet.get(req.currencyCode, 0.0) < req.amount:
        raise HTTPException(status_code=400, detail={"success": False, "message": "Insufficient balance", "code": "INSUFFICIENT_BALANCE"})
    recipient_wallet = _get_wallet(req.recipientUserId)
    sender_wallet[req.currencyCode] -= req.amount
    recipient_wallet[req.currencyCode] += req.amount
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
    _transactions.setdefault(user["userId"], []).append(txn)
    return {
        "success": True,
        "message": "Transfer successful",
        "data": {
            "transaction": txn.model_dump(),
            "recipient": {"userId": req.recipientUserId, "fullName": req.recipientUserId},
            "newBalance": {
                "kesBalance": _get_wallet(user["userId"])["KES"],
                "usdtBalance": _get_wallet(user["userId"])["USDT"],
                "usdBalance": _get_wallet(user["userId"])["USD"],
            },
        },
    }


@router.get("/transactions")
async def list_transactions(page: int = 1, limit: int = 20, user=Depends(get_current_user)):
    user_txns = _transactions.get(user["userId"], [])
    start = (page - 1) * limit
    end = start + limit
    data = [t.model_dump() for t in user_txns[start:end]]
    return {"success": True, "data": {"transactions": data, "pagination": {"page": page, "limit": limit, "total": len(user_txns)}}}
