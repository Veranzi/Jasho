from __future__ import annotations
from typing import Optional
from fastapi import Header, HTTPException
from jose import jwt
from ..config import settings


async def get_current_user(authorization: Optional[str] = Header(default=None)) -> dict:
    if not authorization:
        raise HTTPException(status_code=401, detail={"success": False, "message": "Access token required", "code": "NO_TOKEN"})
    try:
        scheme, token = authorization.split(" ", 1)
        if scheme.lower() != "bearer":
            raise ValueError("Invalid scheme")
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        return {"userId": payload.get("userId", "")}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail={"success": False, "message": "Token expired", "code": "TOKEN_EXPIRED"})
    except Exception:
        raise HTTPException(status_code=401, detail={"success": False, "message": "Invalid token", "code": "INVALID_TOKEN"})
