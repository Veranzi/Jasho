from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel
import os

DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:root@localhost/jasho")

engine = create_engine(DATABASE_URL, echo=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    SQLModel.metadata.create_all(bind=engine)
Base = SQLModel.metadata
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        
def get_session():
    with SessionLocal() as session:
        yield session
from sqlmodel import Session
def get_session():
    with Session(engine) as session:
        yield session
        yield session.commit()
        yield session.refresh()
        yield session.rollback()
        yield session.close()
        yield session.execute()
        yield session.begin()
        yield session.flush()
        yield session.expire()
        yield session.is_active
        yield session.get()
        yield session.merge()
        yield session.scalars()
        yield session.delete()
        yield session.bulk_save_objects()        
        yield session.bulk_insert_mappings()
        yield session.bulk_update_mappings()
        
    


