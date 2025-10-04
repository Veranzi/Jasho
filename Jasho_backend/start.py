#!/usr/bin/env python3
"""
Jasho Backend Startup Script
Handles initialization and startup of the Jasho Financial Backend
"""

import os
import sys
import subprocess
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3, 8):
        logger.error("Python 3.8 or higher is required")
        sys.exit(1)
    logger.info(f"Python version: {sys.version}")

def check_dependencies():
    """Check if required dependencies are installed"""
    try:
        import fastapi
        import uvicorn
        import sqlmodel
        import redis
        import firebase_admin
        logger.info("Core dependencies are installed")
    except ImportError as e:
        logger.error(f"Missing dependency: {e}")
        logger.info("Please run: pip install -r requirements.txt")
        sys.exit(1)

def check_environment():
    """Check if environment variables are set"""
    required_vars = [
        'DATABASE_URL',
        'REDIS_HOST',
        'FIREBASE_PROJECT_ID',
        'JWT_SECRET'
    ]
    
    missing_vars = []
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        logger.error(f"Missing environment variables: {', '.join(missing_vars)}")
        logger.info("Please copy env.example to .env and configure the variables")
        sys.exit(1)
    
    logger.info("Environment variables are configured")

def check_database():
    """Check database connection"""
    try:
        from app.database import SessionLocal
        db = SessionLocal()
        db.execute("SELECT 1")
        db.close()
        logger.info("Database connection successful")
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        logger.info("Please ensure PostgreSQL is running and configured correctly")
        sys.exit(1)

def check_redis():
    """Check Redis connection"""
    try:
        import redis
        r = redis.Redis(host=os.getenv('REDIS_HOST', 'localhost'), port=int(os.getenv('REDIS_PORT', 6379)))
        r.ping()
        logger.info("Redis connection successful")
    except Exception as e:
        logger.error(f"Redis connection failed: {e}")
        logger.info("Please ensure Redis is running")
        sys.exit(1)

def initialize_database():
    """Initialize database tables"""
    try:
        from app.database import init_db
        init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        sys.exit(1)

def start_server():
    """Start the FastAPI server"""
    try:
        import uvicorn
        logger.info("Starting Jasho Backend server...")
        uvicorn.run(
            "app.main:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            log_level="info"
        )
    except Exception as e:
        logger.error(f"Failed to start server: {e}")
        sys.exit(1)

def main():
    """Main startup function"""
    logger.info("🚀 Starting Jasho Financial Backend...")
    
    # Check Python version
    check_python_version()
    
    # Check dependencies
    check_dependencies()
    
    # Check environment
    check_environment()
    
    # Check database
    check_database()
    
    # Check Redis
    check_redis()
    
    # Initialize database
    initialize_database()
    
    # Start server
    start_server()

if __name__ == "__main__":
    main()
