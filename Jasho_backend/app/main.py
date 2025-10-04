# app/main.py
from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.middleware import SlowAPIMiddleware
from app.database import init_db, SessionLocal
from app.routers import (
    auth_router,
    incomes_routers,
    wallet_router,
    ussd_router,
    chatbot_router,
    mpesa_router,
)
from app.routers import insights_router
from app.routers import safety_router

limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute", "10/second"])

app = FastAPI(title="Jasho Backend")

# Security middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(SessionMiddleware, secret_key="change-me")
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

# Include routers with prefixes
app.include_router(auth_router.router, prefix="/auth", tags=["Auth"])
app.include_router(incomes_routers.router, prefix="/incomes", tags=["Incomes"])
app.include_router(wallet_router.router, prefix="/wallet", tags=["Wallet"])
app.include_router(ussd_router.router, prefix="/ussd", tags=["USSD"])
app.include_router(chatbot_router.router, prefix="/chatbot", tags=["Chatbot"])
app.include_router(mpesa_router.router, prefix="/mpesa", tags=["Mpesa"])
app.include_router(insights_router.router, prefix="/insights", tags=["Insights"])
app.include_router(safety_router.router, prefix="/safety", tags=["Safety"])


@app.on_event("startup")
def on_startup():
    init_db()


# Dependency for DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/health")
def healthcheck(db: Session = Depends(get_db)):
    db.execute("SELECT 1")
    return {"status": "ok"}

