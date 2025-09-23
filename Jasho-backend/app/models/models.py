# app/models.py
from typing import Optional
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    phone: str = Field(index=True, nullable=False, unique=True)
    name: Optional[str]
    hashed_password: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Income(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    source: str
    amount: float
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    description: Optional[str] = None

class Wallet(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    balance: float = Field(default=0.0)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class FraudReport(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: Optional[int]
    title: str
    details: Optional[str]
    reported_at: datetime = Field(default_factory=datetime.utcnow)
