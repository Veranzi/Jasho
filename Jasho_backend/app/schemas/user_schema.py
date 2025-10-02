from pydantic import BaseModel
from typing import List, Optional

class UserSignup(BaseModel):
    username: str
    phone_number: str
    email: str
    password: str
    hustles: Optional[List[str]] = []
    country: Optional[str] = None
    county: Optional[str] = None
    ward: Optional[str] = None

class UserLogin(BaseModel):
    mobile: str   # frontend calls it mobileController
    password: str
    remember_me: Optional[bool] = False
class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    hustles: Optional[List[str]] = []
    country: Optional[str] = None
    county: Optional[str] = None
    ward: Optional[str] = None
    password: Optional[str] = None
class UserResponse(BaseModel):
    id: int
    username: str
    phone_number: str
    email: str
    hustles: List[str] = []
    country: Optional[str] = None
    county: Optional[str] = None
    ward: Optional[str] = None

    class Config:
        orm_mode = True
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
class WalletTopup(BaseModel):
    amount: float
class FraudReport(BaseModel):
    title: str
    details: Optional[str] = None
    class Config:
        orm_mode = True
    
    
        
        
    
    
    
    
    