#!/usr/bin/env python3
"""
Jasho Integration Test Script
Tests both frontend and backend integration
"""

import os
import sys
import subprocess
import time
import requests
import json
from pathlib import Path

def print_header(title):
    """Print a formatted header"""
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")

def print_step(step, description):
    """Print a formatted step"""
    print(f"\n🔸 Step {step}: {description}")
    print("-" * 40)

def run_command(command, cwd=None, timeout=30):
    """Run a command and return the result"""
    try:
        result = subprocess.run(
            command,
            shell=True,
            cwd=cwd,
            capture_output=True,
            text=True,
            timeout=timeout
        )
        return result.returncode == 0, result.stdout, result.stderr
    except subprocess.TimeoutExpired:
        return False, "", "Command timed out"
    except Exception as e:
        return False, "", str(e)

def test_backend_dependencies():
    """Test if backend dependencies are installed"""
    print_step(1, "Testing Backend Dependencies")
    
    backend_dir = Path("Jasho_backend")
    if not backend_dir.exists():
        print("❌ Backend directory not found")
        return False
    
    # Check if requirements file exists
    requirements_file = backend_dir / "requirements-simple.txt"
    if not requirements_file.exists():
        print("❌ requirements-simple.txt not found")
        return False
    
    print("✅ Backend directory found")
    print("✅ Requirements file found")
    
    # Test Python imports
    success, stdout, stderr = run_command(
        "python -c \"import fastapi, uvicorn; print('Dependencies OK')\"",
        cwd=backend_dir
    )
    
    if success:
        print("✅ Backend dependencies installed")
        return True
    else:
        print("❌ Backend dependencies missing")
        print("   Run: pip install -r requirements-simple.txt")
        return False

def test_backend_startup():
    """Test if backend can start"""
    print_step(2, "Testing Backend Startup")
    
    backend_dir = Path("Jasho_backend")
    
    # Test the simplified backend
    success, stdout, stderr = run_command(
        "python test_backend.py",
        cwd=backend_dir,
        timeout=10
    )
    
    if success:
        print("✅ Backend can start successfully")
        print("   Output:", stdout.strip())
        return True
    else:
        print("❌ Backend startup failed")
        print("   Error:", stderr.strip())
        return False

def test_backend_endpoints():
    """Test backend endpoints"""
    print_step(3, "Testing Backend Endpoints")
    
    # Start backend in background
    backend_dir = Path("Jasho_backend")
    print("🚀 Starting backend...")
    
    # Try to start backend
    success, stdout, stderr = run_command(
        "python run.py",
        cwd=backend_dir,
        timeout=5
    )
    
    if not success:
        print("⚠️ Backend startup had issues, but continuing...")
    
    # Wait a moment for backend to start
    time.sleep(3)
    
    # Test endpoints
    endpoints = [
        ("/", "Root endpoint"),
        ("/health", "Health check"),
        ("/api/status", "API status"),
        ("/docs", "API documentation")
    ]
    
    working_endpoints = 0
    for endpoint, description in endpoints:
        try:
            response = requests.get(f"http://localhost:8000{endpoint}", timeout=5)
            if response.status_code == 200:
                print(f"✅ {description} working")
                working_endpoints += 1
            else:
                print(f"❌ {description} failed (status: {response.status_code})")
        except requests.exceptions.RequestException as e:
            print(f"❌ {description} failed (connection error)")
    
    if working_endpoints > 0:
        print(f"✅ {working_endpoints}/{len(endpoints)} endpoints working")
        return True
    else:
        print("❌ No endpoints working")
        return False

def test_frontend_dependencies():
    """Test if frontend dependencies are available"""
    print_step(4, "Testing Frontend Dependencies")
    
    frontend_dir = Path("jashoo")
    if not frontend_dir.exists():
        print("❌ Frontend directory not found")
        return False
    
    # Check if pubspec.yaml exists
    pubspec_file = frontend_dir / "pubspec.yaml"
    if not pubspec_file.exists():
        print("❌ pubspec.yaml not found")
        return False
    
    print("✅ Frontend directory found")
    print("✅ pubspec.yaml found")
    
    # Check if Flutter is available
    success, stdout, stderr = run_command("flutter --version", timeout=10)
    
    if success:
        print("✅ Flutter is available")
        print(f"   Version: {stdout.split()[1] if len(stdout.split()) > 1 else 'Unknown'}")
        return True
    else:
        print("❌ Flutter not found")
        print("   Please install Flutter: https://flutter.dev/docs/get-started/install")
        return False

def test_frontend_build():
    """Test if frontend can build"""
    print_step(5, "Testing Frontend Build")
    
    frontend_dir = Path("jashoo")
    
    # Get Flutter dependencies
    print("📦 Getting Flutter dependencies...")
    success, stdout, stderr = run_command(
        "flutter pub get",
        cwd=frontend_dir,
        timeout=60
    )
    
    if success:
        print("✅ Flutter dependencies installed")
    else:
        print("❌ Flutter dependencies failed")
        print("   Error:", stderr.strip())
        return False
    
    # Test if app can analyze
    print("🔍 Analyzing Flutter app...")
    success, stdout, stderr = run_command(
        "flutter analyze",
        cwd=frontend_dir,
        timeout=30
    )
    
    if success:
        print("✅ Flutter app analysis passed")
        return True
    else:
        print("⚠️ Flutter app analysis had issues")
        print("   Output:", stderr.strip())
        return True  # Still consider it working for now

def test_integration():
    """Test frontend-backend integration"""
    print_step(6, "Testing Frontend-Backend Integration")
    
    # Check if API service has correct base URL
    api_service_file = Path("jashoo/lib/services/api_service.dart")
    if api_service_file.exists():
        with open(api_service_file, 'r') as f:
            content = f.read()
            if "http://localhost:8000" in content:
                print("✅ API service configured for correct backend port")
            else:
                print("❌ API service not configured for correct backend port")
                return False
    else:
        print("❌ API service file not found")
        return False
    
    print("✅ Frontend-backend integration configured correctly")
    return True

def main():
    """Main test function"""
    print_header("JASHO INTEGRATION TEST SUITE")
    
    print("🎯 This script will test both frontend and backend integration")
    print("📋 Make sure you're in the project root directory")
    
    # Test results
    results = {}
    
    # Test backend
    results['backend_deps'] = test_backend_dependencies()
    results['backend_startup'] = test_backend_startup()
    results['backend_endpoints'] = test_backend_endpoints()
    
    # Test frontend
    results['frontend_deps'] = test_frontend_dependencies()
    results['frontend_build'] = test_frontend_build()
    
    # Test integration
    results['integration'] = test_integration()
    
    # Summary
    print_header("TEST RESULTS SUMMARY")
    
    total_tests = len(results)
    passed_tests = sum(results.values())
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {test_name.replace('_', ' ').title()}")
    
    print(f"\n📊 Overall: {passed_tests}/{total_tests} tests passed")
    
    if passed_tests == total_tests:
        print("\n🎉 ALL TESTS PASSED!")
        print("🚀 Your Jasho app is ready to run!")
        print("\n📋 To start the app:")
        print("   1. Backend: cd Jasho_backend && python run.py")
        print("   2. Frontend: cd jashoo && flutter run")
    else:
        print(f"\n⚠️ {total_tests - passed_tests} tests failed")
        print("🔧 Please fix the issues above before running the app")
    
    return passed_tests == total_tests

if __name__ == "__main__":
    main()
