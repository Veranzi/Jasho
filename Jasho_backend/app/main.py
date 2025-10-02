# app/main.py
from fastapi import FastAPI
from app.routers import auth_router   # 👈 import your router

app = FastAPI()

# register routers
app.include_router(auth_router.router, prefix="/auth", tags=["Auth"])

from fastapi import FastAPI, Depends
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

app = FastAPI(title="Jasho Backend")

# Include routers with prefixes
app.include_router(auth_router.router, prefix="/auth", tags=["Auth"])
app.include_router(incomes_routers.router, prefix="/incomes", tags=["Incomes"])
app.include_router(wallet_router.router, prefix="/wallet", tags=["Wallet"])
app.include_router(ussd_router.router, prefix="/ussd", tags=["USSD"])
app.include_router(chatbot_router.router, prefix="/chatbot", tags=["Chatbot"])
app.include_router(mpesa_router.router, prefix="/mpesa", tags=["Mpesa"])


@app.on_event("startup")
def on_startup():
    init_db()
    print("Database initialized")
    print("Application startup complete")
    print("Jasho Backend is running")


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

