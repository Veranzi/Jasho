"""
Jasho Financial Backend - Simplified Version
No Docker required - lightweight and easy to run
"""

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import init_db, SessionLocal
from app.routers import (
    auth_router,
    incomes_routers,
    wallet_router,
    ussd_router,
    chatbot_router,
    mpesa_router,
)

# Import core systems (simplified)
try:
    from app.core.firebase_config import firebase_config, verify_token
    FIREBASE_AVAILABLE = True
except ImportError:
    FIREBASE_AVAILABLE = False
    print("⚠️ Firebase not available - using mock authentication")

import logging
import os
from datetime import datetime
from typing import Dict, Any, List, Optional
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Jasho Financial Backend",
    description="Comprehensive financial services backend with AI, blockchain, and cybersecurity",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer(auto_error=False)

# Include existing routers
app.include_router(auth_router.router, prefix="/auth", tags=["Authentication"])
app.include_router(incomes_routers.router, prefix="/incomes", tags=["Income Management"])
app.include_router(wallet_router.router, prefix="/wallet", tags=["Wallet Operations"])
app.include_router(ussd_router.router, prefix="/ussd", tags=["USSD Services"])
app.include_router(chatbot_router.router, prefix="/chatbot", tags=["AI Chatbot"])
app.include_router(mpesa_router.router, prefix="/mpesa", tags=["M-Pesa Integration"])

# Dependency for DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Simplified authentication dependency
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current authenticated user (simplified)"""
    if not credentials:
        raise HTTPException(status_code=401, detail="No authentication token provided")
    
    if FIREBASE_AVAILABLE:
        try:
            token = credentials.credentials
            decoded_token = verify_token(token)
            if not decoded_token:
                raise HTTPException(status_code=401, detail="Invalid authentication token")
            return decoded_token
        except Exception as e:
            logger.error(f"Authentication failed: {str(e)}")
            raise HTTPException(status_code=401, detail="Authentication failed")
    else:
        # Mock authentication for development
        return {"uid": "mock_user", "email": "user@example.com"}

@app.on_event("startup")
async def on_startup():
    """Application startup event"""
    try:
        # Initialize database
        init_db()
        logger.info("Database initialized successfully")
        
        if FIREBASE_AVAILABLE:
            logger.info("Firebase initialized successfully")
        else:
            logger.info("Running in mock mode - Firebase not available")
        
        logger.info("Jasho Backend startup completed successfully")
        
    except Exception as e:
        logger.error(f"Startup failed: {str(e)}")
        # Don't raise - allow server to start even if some services fail

@app.on_event("shutdown")
async def on_shutdown():
    """Application shutdown event"""
    logger.info("Jasho Backend shutting down")

# Health check endpoint
@app.get("/health")
async def healthcheck(db: Session = Depends(get_db)):
    """Health check endpoint"""
    try:
        # Check database connection
        db.execute("SELECT 1")
        
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "services": {
                "database": "healthy",
                "firebase": "available" if FIREBASE_AVAILABLE else "mock",
                "mode": "simplified"
            }
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return {
            "status": "degraded",
            "timestamp": datetime.utcnow().isoformat(),
            "error": str(e)
        }

# Simplified API endpoints
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Jasho Financial Backend API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/api/status")
async def api_status():
    """API status endpoint"""
    return {
        "api": "Jasho Financial Backend",
        "version": "1.0.0",
        "status": "operational",
        "features": {
            "authentication": "available",
            "wallet": "available",
            "transactions": "available",
            "ai_chatbot": "available",
            "firebase": "available" if FIREBASE_AVAILABLE else "mock"
        },
        "endpoints": {
            "auth": "/auth",
            "wallet": "/wallet",
            "incomes": "/incomes",
            "chatbot": "/chatbot",
            "mpesa": "/mpesa",
            "ussd": "/ussd"
        }
    }

# Mock endpoints for features that require heavy dependencies
@app.post("/security/scan-document")
async def scan_document_mock(
    file: UploadFile = File(...),
    user_id: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    """Mock document scanning endpoint"""
    return {
        "success": True,
        "message": "Document scanning not available in simplified mode",
        "mock": True,
        "filename": file.filename,
        "user_id": user_id
    }

@app.post("/ai/chatbot/message")
async def chatbot_message_mock(
    message: str,
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Mock chatbot endpoint"""
    return {
        "success": True,
        "response": {
            "message": f"Hello! I'm Jasho AI assistant. You said: '{message}'. This is a mock response in simplified mode.",
            "type": "text"
        },
        "mock": True
    }

@app.post("/ai/credit-score/calculate")
async def credit_score_mock(
    user_id: str,
    financial_data: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
):
    """Mock credit scoring endpoint"""
    return {
        "success": True,
        "credit_score": {
            "user_id": user_id,
            "credit_score": 750,
            "credit_rating": "good",
            "mock": True,
            "message": "This is a mock credit score in simplified mode"
        }
    }

@app.post("/blockchain/record-transaction")
async def blockchain_mock(
    transaction_data: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
):
    """Mock blockchain endpoint"""
    return {
        "success": True,
        "message": "Blockchain recording not available in simplified mode",
        "mock": True,
        "transaction_id": "mock_tx_123"
    }

@app.post("/sms/send-verification")
async def sms_mock(
    phone_number: str,
    verification_type: str = "signup",
    user_id: str = None,
    current_user: dict = Depends(get_current_user)
):
    """Mock SMS endpoint"""
    return {
        "success": True,
        "message": "SMS verification not available in simplified mode",
        "mock": True,
        "phone_number": phone_number
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
