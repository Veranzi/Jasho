from __future__ import annotations
import hashlib
import hmac
from typing import Any
from ..config import settings


def mask_balance(amount: float, user_id: str) -> str:
    amt = f"{int(round(amount))}"
    if len(amt) <= 4:
        return "*" * len(amt)
    return f"{amt[:2]}{'*' * (len(amt) - 4)}{amt[-2:]}"


def jwt_subject(token_payload: dict[str, Any]) -> str | None:
    return token_payload.get("userId")


def sign_strict(data: str) -> str:
    return hmac.new(settings.balance_encryption_key.encode(), data.encode(), hashlib.sha256).hexdigest()
