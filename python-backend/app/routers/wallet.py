from __future__ import annotations
from datetime import datetime
from idlelib.query import Query
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from ..middleware.auth import get_current_user
from ..utils.security import mask_balance
from ..services.repos import WalletsRepo, TransactionsRepo
from passlib.context import CryptContext

from typing import Any, Dict, List
from datetime import timedelta

from auth import get_current_user

# ---------- Pydantic models for analytics ----------

class CategoryCount(BaseModel):
    category: str
    count: int

class CurrencyAverage(BaseModel):
    currencyCode: str
    averageAmount: float

class SimpleTransaction(BaseModel):
    id: Optional[str] = None
    type: Optional[str] = None
    amount: float
    currencyCode: str
    date: str
    status: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    method: Optional[str] = None
    hustle: Optional[str] = None

class AnalyticsResponse(BaseModel):
    success: bool
    balances: Dict[str, float]
    totalsByCurrency: Dict[str, Dict[str, float]]  # { "KES": { "inflow": 0, "outflow": 0, "net": 0 }, ... }
    averagesByCurrency: List[CurrencyAverage]
    categoryCounts: List[CategoryCount]
    successRate: float
    totalTransactions: int
    lastActivity: Optional[str]
    recent: List[SimpleTransaction]

# ---------- Helpers ----------

IN_TYPES = {"deposit", "transfer_in", "convert_in", "airtime_cashback", "refund"}
OUT_TYPES = {"withdraw", "transfer_out", "convert_out", "payment", "bill"}

def _parse_date(dt: Any) -> Optional[datetime]:
    if not dt:
        return None
    if isinstance(dt, datetime):
        return dt
    if isinstance(dt, str):
        # Try common ISO formats
        try:
            return datetime.fromisoformat(dt.replace("Z", "+00:00"))
        except Exception:
            pass
    # Firestore-like timestamp dict support
    if isinstance(dt, dict):
        # Try { "_seconds": 123, "_nanoseconds": 0 } or { "seconds": 123 }
        seconds = dt.get("_seconds") or dt.get("seconds")
        if seconds is not None:
            try:
                return datetime.utcfromtimestamp(int(seconds))
            except Exception:
                return None
    return None

def _tx_direction(tx_type: Optional[str]) -> Optional[str]:
    if not tx_type:
        return None
    t = str(tx_type).lower()
    if t in IN_TYPES:
        return "in"
    if t in OUT_TYPES:
        return "out"
    # Heuristic fallback
    if "deposit" in t or "in" in t:
        return "in"
    if "withdraw" in t or "out" in t or "payment" in t:
        return "out"
    return None

def _coerce_float(val: Any, default: float = 0.0) -> float:
    try:
        return float(val)
    except Exception:
        return default

def _build_simple_tx(raw: Dict[str, Any]) -> SimpleTransaction:
    date = _parse_date(raw.get("date"))
    return SimpleTransaction(
        id=raw.get("id"),
        type=raw.get("type"),
        amount=_coerce_float(raw.get("amount", 0)),
        currencyCode=str(raw.get("currencyCode") or "KES"),
        date=(date or datetime.utcnow()).isoformat(),
        status=raw.get("status"),
        description=raw.get("description"),
        category=raw.get("category"),
        method=raw.get("method"),
        hustle=raw.get("hustle"),
    )

async def _maybe_await(val):
    # Utility to support either sync or async helpers
    if hasattr(val, "__await__"):
        return await val
    return val

async def _get_user_wallet(user_id: str) -> Dict[str, Any]:
    # Reuse existing internal wallet fetcher if available
    wallet = await _maybe_await(_get_wallet(user_id))  # type: ignore[name-defined]
    if not wallet:
        raise HTTPException(status_code=404, detail={"success": False, "message": "Wallet not found"})
    return wallet

def _extract_balances(wallet: Dict[str, Any]) -> Dict[str, float]:
    # Try multiple shapes safely
    balances = {}
    candidates = [
        wallet.get("balances"),
        wallet.get("balance"),
        wallet.get("accounts"),
    ]
    for c in candidates:
        if isinstance(c, dict):
            for k, v in c.items():
                try:
                    balances[str(k).upper()] = float(v if not isinstance(v, dict) else v.get("available", 0))
                except Exception:
                    continue
    # If none discovered, fallback to known keys if present
    for k in ("KES", "USD", "USDT"):
        if k not in balances and k in wallet:
            try:
                balances[k] = float(wallet[k])
            except Exception:
                pass
    return balances

def _filter_and_normalize_transactions(
    transactions: List[Dict[str, Any]],
    start_at: Optional[datetime],
    end_at: Optional[datetime],
    limit: int,
) -> List[SimpleTransaction]:
    # Normalize, sort desc by date, filter by date window, apply limit
    normalized: List[SimpleTransaction] = []
    for raw in transactions:
        stx = _build_simple_tx(raw)
        dt = _parse_date(stx.date)
        if start_at and dt and dt < start_at:
            continue
        if end_at and dt and dt > end_at:
            continue
        normalized.append(stx)

    normalized.sort(key=lambda t: t.date, reverse=True)
    return normalized[:limit]

def _analyze_transactions(txs: List[SimpleTransaction]) -> Dict[str, Any]:
    totals_by_currency: Dict[str, Dict[str, float]] = {}
    sums_for_avg: Dict[str, List[float]] = {}
    category_counts: Dict[str, int] = {}
    success_count = 0
    total_count = len(txs)
    last_activity: Optional[str] = None

    for tx in txs:
        cur = tx.currencyCode or "KES"
        dirn = _tx_direction(tx.type)
        amt = _coerce_float(tx.amount, 0.0)

        # Initialize currency bucket
        bucket = totals_by_currency.setdefault(cur, {"inflow": 0.0, "outflow": 0.0, "net": 0.0})

        if dirn == "in":
            bucket["inflow"] += amt
            bucket["net"] += amt
        elif dirn == "out":
            bucket["outflow"] += amt
            bucket["net"] -= amt

        # For averages, include absolute amounts to avoid sign issues
        sums_for_avg.setdefault(cur, []).append(abs(amt))

        # Category counts
        cat = (tx.category or "uncategorized").lower()
        category_counts[cat] = category_counts.get(cat, 0) + 1

        # Success rate
        st = (tx.status or "").lower()
        if st in ("success", "completed", "complete", "ok"):
            success_count += 1

        # Last activity
        if not last_activity or tx.date > last_activity:
            last_activity = tx.date

    averages = [
        CurrencyAverage(currencyCode=cur, averageAmount=(sum(vals) / max(len(vals), 1)))
        for cur, vals in sums_for_avg.items()
    ]
    categories = [CategoryCount(category=k, count=v) for k, v in sorted(category_counts.items(), key=lambda x: (-x[1], x[0]))]

    success_rate = (success_count / total_count) if total_count > 0 else 0.0

    return {
        "totalsByCurrency": totals_by_currency,
        "averagesByCurrency": averages,
        "categoryCounts": categories,
        "successRate": success_rate,
        "totalTransactions": total_count,
        "lastActivity": last_activity,
    }

# ---------- Route: GET /analytics ----------

@router.get("/analytics", response_model=AnalyticsResponse, summary="Get analytics for the current user's wallet")  # type: ignore[name-defined]
async def get_user_analytics(
    days: int = Query(30),
    limit: int = Query(50),
    current_user: Dict[str, str] = Depends(get_current_user),
):
    user_id = current_user.get("userId")
    if not user_id:
        raise HTTPException(status_code=401, detail={"success": False, "message": "Unauthorized"})

    # Time window
    end_at = datetime.utcnow()
    start_at = end_at - timedelta(days=days)

    # Fetch wallet
    wallet = await _get_user_wallet(user_id)
    balances = _extract_balances(wallet)

    # Collect transactions
    raw_transactions: List[Dict[str, Any]] = []

    # Preferred: read from wallet object if available
    wallet_txs = wallet.get("transactions")
    if isinstance(wallet_txs, list):
        raw_transactions = wallet_txs

    # If none were found, you can plug in your datastore read here
    # Example (pseudo):
    # raw_transactions = await transactions_repo.list_for_user(user_id, start_at, end_at, limit)
    # Make sure each item has fields: amount, currencyCode, type, date, status, description, category

    # Normalize, filter, and limit
    recent = _filter_and_normalize_transactions(raw_transactions, start_at, end_at, limit)

    # Analyze
    analysis = _analyze_transactions(recent)

    return AnalyticsResponse(
        success=True,
        balances=balances,
        totalsByCurrency=analysis["totalsByCurrency"],
        averagesByCurrency=analysis["averagesByCurrency"],
        categoryCounts=analysis["categoryCounts"],
        successRate=analysis["successRate"],
        totalTransactions=analysis["totalTransactions"],
        lastActivity=analysis["lastActivity"],
        recent=recent,
    )