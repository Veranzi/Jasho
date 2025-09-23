# app/database.py
from sqlmodel import SQLModel, create_engine, Session
import os

DB_URL = os.getenv("DATABASE_URL", "sqlite:///./dev.db")
# For Postgres: postgres://user:pass@db:5432/hustleos
engine = create_engine(DB_URL, echo=True, connect_args={"check_same_thread": False} if "sqlite" in DB_URL else {})

def init_db():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session