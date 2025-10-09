from __future__ import annotations
from typing import Optional
from fastapi import Header, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt
from ..config import settings


http_bearer = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(http_bearer),
    authorization: Optional[str] = Header(default=None),
) -> dict:
    """Extract and verify JWT from Authorization header or Swagger's bearer token.

    Supports both explicit Authorization header and FastAPI's HTTPBearer security, so
    Swagger UI's Authorize button works when a token is provided.
    """
    token: Optional[str] = None
    scheme: Optional[str] = None

    if credentials and credentials.scheme:
        scheme = credentials.scheme
        token = credentials.credentials
    elif authorization:
        try:
            scheme, token = authorization.split(" ", 1)
        except Exception:
            scheme, token = None, None

    if not token or not scheme or scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail={"success": False, "message": "Access token required", "code": "NO_TOKEN"})

    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        return {"userId": payload.get("userId", "")}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail={"success": False, "message": "Token expired", "code": "TOKEN_EXPIRED"})
    except Exception:
        raise HTTPException(status_code=401, detail={"success": False, "message": "Invalid token", "code": "INVALID_TOKEN"})
