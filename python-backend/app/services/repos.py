from __future__ import annotations
from typing import Any, Optional
from datetime import datetime, timedelta
from passlib.context import CryptContext
from .firebase import get_db, get_bucket


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def now_ts() -> datetime:
    return datetime.utcnow()


# Users
class UsersRepo:
    @staticmethod
    def _col():
        return get_db().collection("users")

    @staticmethod
    def create_user(user_id: str, data: dict[str, Any]) -> None:
        UsersRepo._col().document(user_id).set(data | {"createdAt": now_ts(), "updatedAt": now_ts()})

    @staticmethod
    def find_by_email(email: str) -> Optional[dict[str, Any]]:
        docs = UsersRepo._col().where("email", "==", email.lower()).limit(1).stream()
        for d in docs:
            obj = d.to_dict()
            obj["userId"] = d.id
            return obj
        return None

    @staticmethod
    def find_by_phone(phone: str) -> Optional[dict[str, Any]]:
        docs = UsersRepo._col().where("phoneNumber", "==", phone).limit(1).stream()
        for d in docs:
            obj = d.to_dict()
            obj["userId"] = d.id
            return obj
        return None

    @staticmethod
    def find_by_id(user_id: str) -> Optional[dict[str, Any]]:
        doc = UsersRepo._col().document(user_id).get()
        if doc.exists:
            obj = doc.to_dict() or {}
            obj["userId"] = doc.id
            return obj
        return None

    @staticmethod
    def update_profile(user_id: str, updates: dict[str, Any]) -> dict[str, Any]:
        updates["updatedAt"] = now_ts()
        UsersRepo._col().document(user_id).set(updates, merge=True)
        return UsersRepo.find_by_id(user_id) or {}

    @staticmethod
    def hash_password(password: str) -> str:
        return pwd_context.hash(password)

    @staticmethod
    def verify_password(password: str, password_hash: str) -> bool:
        return pwd_context.verify(password, password_hash)


# Wallets
class WalletsRepo:
    @staticmethod
    def _col():
        return get_db().collection("wallets")

    @staticmethod
    def get_or_create(user_id: str) -> dict[str, Any]:
        doc_ref = WalletsRepo._col().document(user_id)
        doc = doc_ref.get()
        if not doc.exists:
            data = {
                "balances": {"KES": 0.0, "USDT": 0.0, "USD": 0.0},
                "hasPin": False,
                "isPinLocked": False,
                "isFrozen": False,
                "status": "active",
                "dailyLimits": {"KES": {"deposit": 100000, "withdrawal": 50000}},
                "dailyUsage": {"KES": {"deposit": 0, "withdrawal": 0}},
                "statistics": {},
                "createdAt": now_ts(),
                "updatedAt": now_ts(),
            }
            doc_ref.set(data)
            return data
        data = doc.to_dict() or {}
        return data

    @staticmethod
    def set_pin(user_id: str, pin_hash: str) -> None:
        WalletsRepo._col().document(user_id).set({"hasPin": True, "pinHash": pin_hash, "updatedAt": now_ts()}, merge=True)

    @staticmethod
    def get_pin_hash(user_id: str) -> Optional[str]:
        doc = WalletsRepo._col().document(user_id).get()
        if doc.exists:
            return (doc.to_dict() or {}).get("pinHash")
        return None

    @staticmethod
    def update_balance(user_id: str, currency: str, delta: float) -> dict[str, Any]:
        doc_ref = WalletsRepo._col().document(user_id)
        doc = doc_ref.get()
        if not doc.exists:
            WalletsRepo.get_or_create(user_id)
            doc = doc_ref.get()
        data = doc.to_dict() or {}
        balances = data.get("balances", {})
        balances[currency] = float(balances.get(currency, 0.0)) + float(delta)
        data["balances"] = balances
        data["updatedAt"] = now_ts()
        doc_ref.set(data)
        return data


# Transactions
class TransactionsRepo:
    @staticmethod
    def _col():
        return get_db().collection("transactions")

    @staticmethod
    def create(txn: dict[str, Any]) -> dict[str, Any]:
        txn_id = txn.get("transactionId") or f"TXN_{int(now_ts().timestamp())}"
        txn["transactionId"] = txn_id
        txn["createdAt"] = now_ts()
        TransactionsRepo._col().document(txn_id).set(txn)
        return txn

    @staticmethod
    def list_by_user(user_id: str, page: int, limit: int, filters: dict[str, Any] | None = None) -> tuple[list[dict], int]:
        q = TransactionsRepo._col().where("userId", "==", user_id)
        if filters:
            if filters.get("type"):
                q = q.where("type", "==", filters["type"])
            if filters.get("status"):
                q = q.where("status", "==", filters["status"])
            if filters.get("startDate"):
                q = q.where("initiatedAt", ">=", filters["startDate"])  # requires composite indexes as data grows
            if filters.get("endDate"):
                q = q.where("initiatedAt", "<=", filters["endDate"])  # ditto
        q = q.order_by("initiatedAt", direction="DESCENDING")
        docs = list(q.stream())
        total = len(docs)
        start = (page - 1) * limit
        end = start + limit
        sliced = docs[start:end]
        items = []
        for d in sliced:
            obj = d.to_dict()
            obj["transactionId"] = d.id
            items.append(obj)
        return items, total


# Savings
class SavingsRepo:
    @staticmethod
    def goals_col():
        return get_db().collection("savings_goals")

    @staticmethod
    def contrib_col():
        return get_db().collection("savings_contributions")

    @staticmethod
    def create_goal(goal: dict[str, Any]) -> dict[str, Any]:
        goal_id = goal.get("id") or f"goal_{int(now_ts().timestamp())}"
        goal["id"] = goal_id
        goal["createdAt"] = now_ts()
        SavingsRepo.goals_col().document(goal_id).set(goal)
        return goal

    @staticmethod
    def list_goals(user_id: str, page: int, limit: int) -> tuple[list[dict], int]:
        docs = list(SavingsRepo.goals_col().where("userId", "==", user_id).order_by("createdAt", direction="DESCENDING").stream())
        total = len(docs)
        start = (page - 1) * limit
        end = start + limit
        res = []
        for d in docs[start:end]:
            obj = d.to_dict()
            obj["id"] = d.id
            res.append(obj)
        return res, total

    @staticmethod
    def contribute(contrib: dict[str, Any]) -> dict[str, Any]:
        contrib_id = contrib.get("id") or f"contrib_{int(now_ts().timestamp())}"
        contrib["id"] = contrib_id
        contrib["createdAt"] = now_ts()
        SavingsRepo.contrib_col().document(contrib_id).set(contrib)
        return contrib


# Chat history
class ChatRepo:
    @staticmethod
    def col():
        return get_db().collection("chat_history")

    @staticmethod
    def add_entry(entry: dict[str, Any]) -> dict[str, Any]:
        entry_id = entry.get("id") or f"chat_{int(now_ts().timestamp())}"
        entry["id"] = entry_id
        entry["createdAt"] = now_ts()
        ChatRepo.col().document(entry_id).set(entry)
        return entry

    @staticmethod
    def list_by_user(user_id: str, page: int, limit: int) -> tuple[list[dict], int]:
        docs = list(ChatRepo.col().where("userId", "==", user_id).order_by("createdAt", direction="DESCENDING").stream())
        total = len(docs)
        start = (page - 1) * limit
        end = start + limit
        res = []
        for d in docs[start:end]:
            obj = d.to_dict()
            obj["id"] = d.id
            res.append(obj)
        return res, total


# Jobs (for heatmap)
class JobsRepo:
    @staticmethod
    def col():
        return get_db().collection("jobs")

    @staticmethod
    def query(start: Optional[datetime] = None, end: Optional[datetime] = None, category: Optional[str] = None, location: Optional[str] = None, min_price: Optional[float] = None, max_price: Optional[float] = None, limit: int = 1000) -> list[dict[str, Any]]:
        q = JobsRepo.col().where("status", "in", ["active", "completed"])  # requires index
        if start:
            q = q.where("createdAt", ">=", start)
        if end:
            q = q.where("createdAt", "<=", end)
        if category:
            q = q.where("category", "==", category)
        # Firestore can't do LIKE; we can post-filter for location substring
        docs = list(q.order_by("createdAt", direction="DESCENDING").limit(limit).stream())
        items = []
        for d in docs:
            obj = d.to_dict()
            obj["id"] = d.id
            if min_price is not None and obj.get("priceKes", 0) < min_price:
                continue
            if max_price is not None and obj.get("priceKes", 0) > max_price:
                continue
            if location and location.lower() not in str(obj.get("location", {})).lower():
                continue
            items.append(obj)
        return items


# Credit score
class CreditRepo:
    @staticmethod
    def col():
        return get_db().collection("credit_scores")

    @staticmethod
    def get_or_create(user_id: str) -> dict[str, Any]:
        doc_ref = CreditRepo.col().document(user_id)
        doc = doc_ref.get()
        if not doc.exists:
            data = {
                "currentScore": 300,
                "financialProfile": {
                    "monthlyIncome": 0,
                    "monthlyExpenses": 0,
                    "savingsRate": 0,
                    "debtToIncomeRatio": 0,
                    "employmentStability": 0,
                    "gigWorkConsistency": 0,
                },
                "paymentPatterns": {
                    "onTimePayments": 0,
                    "latePayments": 0,
                    "missedPayments": 0,
                    "averagePaymentDelay": 0,
                },
                "updatedAt": now_ts(),
            }
            doc_ref.set(data)
            return data
        return doc.to_dict() or {"currentScore": 300}

    @staticmethod
    def update(user_id: str, updates: dict[str, Any]) -> dict[str, Any]:
        updates["updatedAt"] = now_ts()
        CreditRepo.col().document(user_id).set(updates, merge=True)
        doc = CreditRepo.col().document(user_id).get()
        return doc.to_dict() or {}
