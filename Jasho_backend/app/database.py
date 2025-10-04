from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel, Session
import os

# Use env-provided DATABASE_URL. Example for MySQL:
# mysql+pymysql://user:password@host:3306/dbname
DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:root@localhost/jasho")

# Configure engine with sane defaults
engine = create_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db() -> None:
    """Create all tables on startup if they do not exist."""
    SQLModel.metadata.create_all(bind=engine)


def get_db():
    """FastAPI dependency that yields a SQLAlchemy sessionmaker session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_session():
    """FastAPI dependency that yields a sqlmodel Session bound to engine."""
    with Session(engine) as session:
        yield session
