#!/usr/bin/env python3
"""
Simple Backend Test Script
Tests if the backend can start and basic endpoints work
"""

import sys
import os
import asyncio
import httpx
from pathlib import Path

# Add the app directory to Python path
app_dir = Path(__file__).parent / "app"
sys.path.insert(0, str(app_dir))

def test_imports():
    """Test if all required modules can be imported"""
    print("🔍 Testing imports...")
    
    try:
        import fastapi
        print("✅ FastAPI imported successfully")
    except ImportError as e:
        print(f"❌ FastAPI import failed: {e}")
        return False
    
    try:
        import uvicorn
        print("✅ Uvicorn imported successfully")
    except ImportError as e:
        print(f"❌ Uvicorn import failed: {e}")
        return False
    
    try:
        from app.main_simple import app
        print("✅ Main app imported successfully")
    except ImportError as e:
        print(f"❌ Main app import failed: {e}")
        return False
    
    return True

async def test_endpoints():
    """Test basic endpoints"""
    print("\n🌐 Testing endpoints...")
    
    try:
        async with httpx.AsyncClient() as client:
            # Test root endpoint
            response = await client.get("http://localhost:8000/")
            if response.status_code == 200:
                print("✅ Root endpoint working")
            else:
                print(f"❌ Root endpoint failed: {response.status_code}")
                return False
            
            # Test health endpoint
            response = await client.get("http://localhost:8000/health")
            if response.status_code == 200:
                print("✅ Health endpoint working")
                data = response.json()
                print(f"   Status: {data.get('status', 'unknown')}")
            else:
                print(f"❌ Health endpoint failed: {response.status_code}")
                return False
            
            # Test API status endpoint
            response = await client.get("http://localhost:8000/api/status")
            if response.status_code == 200:
                print("✅ API status endpoint working")
                data = response.json()
                print(f"   API: {data.get('api', 'unknown')}")
                print(f"   Version: {data.get('version', 'unknown')}")
            else:
                print(f"❌ API status endpoint failed: {response.status_code}")
                return False
                
    except httpx.ConnectError:
        print("❌ Cannot connect to backend - is it running?")
        return False
    except Exception as e:
        print(f"❌ Endpoint test failed: {e}")
        return False
    
    return True

def test_database():
    """Test database connection"""
    print("\n🗄️ Testing database...")
    
    try:
        from app.database import SessionLocal
        db = SessionLocal()
        db.execute("SELECT 1")
        db.close()
        print("✅ Database connection working")
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

def main():
    """Main test function"""
    print("🚀 Jasho Backend Test Suite")
    print("=" * 50)
    
    # Test imports
    if not test_imports():
        print("\n❌ Import tests failed. Please install dependencies:")
        print("   pip install -r requirements-simple.txt")
        return False
    
    # Test database
    if not test_database():
        print("\n❌ Database tests failed. Please check your database configuration.")
        return False
    
    print("\n✅ All basic tests passed!")
    print("\n📋 To start the backend:")
    print("   python run.py")
    print("\n📋 To test endpoints:")
    print("   python test_backend.py --test-endpoints")
    
    # Test endpoints if requested
    if "--test-endpoints" in sys.argv:
        print("\n🌐 Testing endpoints (make sure backend is running)...")
        try:
            result = asyncio.run(test_endpoints())
            if result:
                print("\n🎉 All tests passed! Backend is working correctly.")
            else:
                print("\n❌ Some endpoint tests failed.")
        except Exception as e:
            print(f"\n❌ Endpoint testing failed: {e}")
    
    return True

if __name__ == "__main__":
    main()
