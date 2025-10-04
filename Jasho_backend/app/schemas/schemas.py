# app/schemas.py
from pydantic import BaseModel
from typing import Optional

class UserCreate(BaseModel):
    phone: str
    name: Optional[str]
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class IncomeCreate(BaseModel):
    source: str
    amount: float
    description: Optional[str] = None

class WalletTopup(BaseModel):
    amount: float


class IncomeCreate(BaseModel):
    source: str
    amount: float
    description: Optional[str] = None

class FraudReportCreate(BaseModel):
    title: str
    details: Optional[str] = None
