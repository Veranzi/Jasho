# app/main.py
from fastapi import FastAPI
from app.db.database import init_db
from app.routers import auth_router, income_routers, wallet_router, ussd_router, chatbot_router, mpesa_router

app = FastAPI(title="Jasho Backend")

app.include_router(auth_router.router)
app.include_router(income_routers.router)
app.include_router(wallet_router.router)
app.include_router(ussd_router.router)
app.include_router(chatbot_router.router)
app.include_router(mpesa_router.router)

@app.on_event("startup")
def on_startup():
    init_db()
    print("Database initialized")
    print("Application startup complete")
    # Additional startup tasks can be added here
    # e.g., initializing caches, loading ML models, etc.
    
    
