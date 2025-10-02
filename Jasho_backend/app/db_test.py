from app.database import SessionLocal
from sqlalchemy import text

def test_connection():
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))  # ✅ wrap in text()
        print("✅ Database connection works!")
    except Exception as e:
        print("❌ Database connection failed:", e)
    finally:
        db.close()

if __name__ == "__main__":
    test_connection()
