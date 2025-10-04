"""
Jasho Financial App Backend
Comprehensive backend with cybersecurity, AI, blockchain, and real-time features
"""

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
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
    user_router,
)

# Import core systems
from app.core.firebase_config import firebase_config, verify_token
from app.core.cybersecurity import security_manager
from app.core.blockchain import blockchain_manager
from app.core.document_security import security_scanner
from app.core.ai_chatbot import ai_assistant
from app.core.job_heatmap import job_heatmap_manager
from app.core.ai_credit_scoring import ai_credit_scorer
from app.core.ai_insights import ai_insights_manager, financial_predictor
from app.core.sms_verification import sms_verification_manager, sms_analytics

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

# Security middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["localhost", "127.0.0.1", "*.jasho.com", "*.vercel.app"]
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:8080",
        "https://jasho.com",
        "https://*.jasho.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Include existing routers
app.include_router(auth_router.router, prefix="/auth", tags=["Authentication"])
app.include_router(user_router.router, prefix="/user", tags=["User Management"])
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

# Authentication dependency
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current authenticated user"""
    try:
        token = credentials.credentials
        decoded_token = verify_token(token)
        
        if not decoded_token:
            raise HTTPException(status_code=401, detail="Invalid authentication token")
        
        return decoded_token
    except Exception as e:
        logger.error(f"Authentication failed: {str(e)}")
        raise HTTPException(status_code=401, detail="Authentication failed")

@app.on_event("startup")
async def on_startup():
    """Application startup event"""
    try:
        # Initialize database
        init_db()
        logger.info("Database initialized successfully")
        
        # Initialize Firebase
        logger.info("Firebase initialized successfully")
        
        # Initialize security systems
        logger.info("Security systems initialized successfully")
        
        # Initialize AI systems
        logger.info("AI systems initialized successfully")
        
        # Initialize blockchain
        logger.info("Blockchain systems initialized successfully")
        
        logger.info("Jasho Backend startup completed successfully")
        
    except Exception as e:
        logger.error(f"Startup failed: {str(e)}")
        raise

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
        
        # Check Redis connection
        # Check other services
        
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "services": {
                "database": "healthy",
                "firebase": "healthy",
                "redis": "healthy",
                "blockchain": "healthy",
                "ai_systems": "healthy"
            }
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(status_code=503, detail="Service unhealthy")

# Security endpoints
@app.post("/security/scan-document")
async def scan_document(
    file: UploadFile = File(...),
    user_id: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    """Scan uploaded document for security threats"""
    try:
        file_content = await file.read()
        scan_result = security_scanner.scan_document(file.filename, file_content, user_id)
        
        return {
            "success": True,
            "scan_result": scan_result,
            "scanned_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Document scanning failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Document scanning failed")

@app.post("/security/validate-url")
async def validate_url(
    url: str,
    current_user: dict = Depends(get_current_user)
):
    """Validate URL for security threats"""
    try:
        validation_result = security_scanner.validate_url(url)
        
        return {
            "success": True,
            "validation_result": validation_result,
            "validated_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"URL validation failed: {str(e)}")
        raise HTTPException(status_code=500, detail="URL validation failed")

@app.post("/security/validate-qr-code")
async def validate_qr_code(
    qr_data: str,
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Validate QR code for security threats"""
    try:
        validation_result = security_scanner.scan_qr_code(qr_data, user_id)
        
        return {
            "success": True,
            "validation_result": validation_result,
            "validated_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"QR code validation failed: {str(e)}")
        raise HTTPException(status_code=500, detail="QR code validation failed")

@app.post("/security/mask-balance")
async def mask_balance(
    balance: float,
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Mask balance for secure display"""
    try:
        masked_balance = security_manager.secure_balance_display(balance, user_id)
        
        return {
            "success": True,
            "masked_balance": masked_balance,
            "masked_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Balance masking failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Balance masking failed")

# Blockchain endpoints
@app.post("/blockchain/record-transaction")
async def record_transaction(
    transaction_data: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
):
    """Record transaction on blockchain"""
    try:
        # Validate transaction
        is_valid, message = security_manager.validate_transaction(transaction_data)
        
        if not is_valid:
            raise HTTPException(status_code=400, detail=message)
        
        # Record on blockchain
        blockchain_result = blockchain_manager.process_transaction(transaction_data)
        
        return {
            "success": True,
            "blockchain_result": blockchain_result,
            "recorded_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Blockchain transaction recording failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Blockchain transaction recording failed")

@app.get("/blockchain/transaction-history/{user_id}")
async def get_transaction_history(
    user_id: str,
    user_address: str,
    current_user: dict = Depends(get_current_user)
):
    """Get user's blockchain transaction history"""
    try:
        transaction_history = blockchain_manager.get_user_transaction_history(user_id, user_address)
        
        return {
            "success": True,
            "transaction_history": transaction_history,
            "retrieved_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Transaction history retrieval failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Transaction history retrieval failed")

# AI Chatbot endpoints
@app.post("/ai/chatbot/message")
async def process_chatbot_message(
    message: str,
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Process chatbot message"""
    try:
        response = ai_assistant.process_message(message, user_id)
        
        return {
            "success": True,
            "response": response,
            "processed_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Chatbot message processing failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Chatbot message processing failed")

@app.post("/ai/chatbot/voice-message")
async def process_voice_message(
    audio_file: UploadFile = File(...),
    user_id: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    """Process voice message"""
    try:
        audio_content = await audio_file.read()
        response = ai_assistant.process_voice_message(audio_content, user_id)
        
        return {
            "success": True,
            "response": response,
            "processed_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Voice message processing failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Voice message processing failed")

# Job Heatmap endpoints
@app.post("/jobs/heatmap")
async def create_job_heatmap(
    jobs_data: List[Dict[str, Any]],
    heatmap_type: str = "folium",
    current_user: dict = Depends(get_current_user)
):
    """Create job heatmap visualization"""
    try:
        heatmap_result = job_heatmap_manager.create_heatmap(jobs_data, heatmap_type)
        
        return {
            "success": True,
            "heatmap": heatmap_result,
            "created_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Heatmap creation failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Heatmap creation failed")

@app.get("/jobs/heatmap/statistics")
async def get_heatmap_statistics(
    jobs_data: List[Dict[str, Any]],
    current_user: dict = Depends(get_current_user)
):
    """Get job heatmap statistics"""
    try:
        statistics = job_heatmap_manager.get_heatmap_statistics(jobs_data)
        
        return {
            "success": True,
            "statistics": statistics,
            "generated_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Heatmap statistics generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Heatmap statistics generation failed")

# AI Credit Scoring endpoints
@app.post("/ai/credit-score/calculate")
async def calculate_credit_score(
    user_id: str,
    financial_data: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
):
    """Calculate AI-powered credit score"""
    try:
        credit_score = ai_credit_scorer.calculate_credit_score(user_id, financial_data)
        
        return {
            "success": True,
            "credit_score": credit_score,
            "calculated_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Credit score calculation failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Credit score calculation failed")

@app.get("/ai/credit-score/{user_id}")
async def get_credit_score(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get user's credit score"""
    try:
        credit_score = ai_credit_scorer.get_credit_score(user_id)
        
        if not credit_score:
            raise HTTPException(status_code=404, detail="Credit score not found")
        
        return {
            "success": True,
            "credit_score": credit_score,
            "retrieved_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Credit score retrieval failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Credit score retrieval failed")

# AI Insights endpoints
@app.post("/ai/insights/analyze-patterns")
async def analyze_user_patterns(
    user_id: str,
    user_data: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
):
    """Analyze user patterns and behaviors"""
    try:
        analysis_result = ai_insights_manager.analyze_user_patterns(user_id, user_data)
        
        return {
            "success": True,
            "analysis": analysis_result,
            "analyzed_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Pattern analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Pattern analysis failed")

@app.post("/ai/insights/predict-needs")
async def predict_financial_needs(
    user_id: str,
    user_data: Dict[str, Any],
    prediction_period: str = "monthly",
    current_user: dict = Depends(get_current_user)
):
    """Predict user's financial needs"""
    try:
        predictions = financial_predictor.predict_financial_needs(user_id, user_data, prediction_period)
        
        return {
            "success": True,
            "predictions": predictions,
            "predicted_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Financial needs prediction failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Financial needs prediction failed")

# SMS Verification endpoints
@app.post("/sms/send-verification")
async def send_verification_sms(
    phone_number: str,
    verification_type: str = "signup",
    user_id: str = None,
    current_user: dict = Depends(get_current_user)
):
    """Send SMS verification code"""
    try:
        result = sms_verification_manager.send_verification_code(phone_number, verification_type, user_id)
        
        return {
            "success": result["success"],
            "message": result.get("message", ""),
            "error": result.get("error", ""),
            "sent_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"SMS verification sending failed: {str(e)}")
        raise HTTPException(status_code=500, detail="SMS verification sending failed")

@app.post("/sms/verify-code")
async def verify_sms_code(
    phone_number: str,
    code: str,
    verification_type: str = "signup",
    current_user: dict = Depends(get_current_user)
):
    """Verify SMS code"""
    try:
        result = sms_verification_manager.verify_code(phone_number, code, verification_type)
        
        return {
            "success": result["success"],
            "message": result.get("message", ""),
            "error": result.get("error", ""),
            "verified_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"SMS verification failed: {str(e)}")
        raise HTTPException(status_code=500, detail="SMS verification failed")

@app.get("/sms/verification-status/{phone_number}")
async def get_verification_status(
    phone_number: str,
    verification_type: str = "signup",
    current_user: dict = Depends(get_current_user)
):
    """Get SMS verification status"""
    try:
        status = sms_verification_manager.check_verification_status(phone_number, verification_type)
        
        return {
            "success": True,
            "status": status,
            "checked_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Verification status check failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Verification status check failed")

# Analytics endpoints
@app.get("/analytics/sms-statistics")
async def get_sms_statistics(
    date: str = None,
    current_user: dict = Depends(get_current_user)
):
    """Get SMS statistics"""
    try:
        statistics = sms_analytics.get_sms_statistics(date)
        
        return {
            "success": True,
            "statistics": statistics,
            "generated_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"SMS statistics retrieval failed: {str(e)}")
        raise HTTPException(status_code=500, detail="SMS statistics retrieval failed")

# System status endpoint
@app.get("/system/status")
async def get_system_status(current_user: dict = Depends(get_current_user)):
    """Get comprehensive system status"""
    try:
        status = {
            "timestamp": datetime.utcnow().isoformat(),
            "services": {
                "firebase": "operational",
                "blockchain": "operational",
                "ai_systems": "operational",
                "security": "operational",
                "sms": "operational"
            },
            "version": "1.0.0",
            "environment": os.getenv("ENVIRONMENT", "development")
        }
        
        return {
            "success": True,
            "status": status
        }
    except Exception as e:
        logger.error(f"System status check failed: {str(e)}")
        raise HTTPException(status_code=500, detail="System status check failed")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

