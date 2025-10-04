#!/usr/bin/env python3
"""
Simple Setup Script for Jasho Backend
No Docker required - just Python and dependencies
"""

import os
import sys
import subprocess
import platform
from pathlib import Path

def print_banner():
    print("🚀 Jasho Financial Backend Setup")
    print("=" * 50)

def check_python():
    """Check Python version"""
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print("❌ Python 3.8+ is required")
        sys.exit(1)
    print(f"✅ Python {version.major}.{version.minor}.{version.micro} detected")

def create_virtual_env():
    """Create virtual environment"""
    print("\n📦 Creating virtual environment...")
    try:
        subprocess.run([sys.executable, "-m", "venv", "venv"], check=True)
        print("✅ Virtual environment created")
    except subprocess.CalledProcessError:
        print("❌ Failed to create virtual environment")
        sys.exit(1)

def get_activate_script():
    """Get the correct activation script for the platform"""
    if platform.system() == "Windows":
        return "venv\\Scripts\\activate"
    else:
        return "venv/bin/activate"

def install_dependencies():
    """Install Python dependencies"""
    print("\n📚 Installing dependencies...")
    
    # Get the correct pip path
    if platform.system() == "Windows":
        pip_path = "venv\\Scripts\\pip"
    else:
        pip_path = "venv/bin/pip"
    
    try:
        subprocess.run([pip_path, "install", "-r", "requirements.txt"], check=True)
        print("✅ Dependencies installed successfully")
    except subprocess.CalledProcessError:
        print("❌ Failed to install dependencies")
        sys.exit(1)

def create_env_file():
    """Create .env file from example"""
    if not os.path.exists(".env"):
        if os.path.exists("env.example"):
            print("\n⚙️ Creating .env file...")
            with open("env.example", "r") as src:
                with open(".env", "w") as dst:
                    dst.write(src.read())
            print("✅ .env file created from env.example")
            print("📝 Please edit .env file with your actual configuration")
        else:
            print("⚠️ env.example not found, creating basic .env file...")
            with open(".env", "w") as f:
                f.write("""# Basic Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/jasho_db
REDIS_HOST=localhost
REDIS_PORT=6379
FIREBASE_PROJECT_ID=jasho-dad1b
JWT_SECRET=your-secret-key-here
ENVIRONMENT=development
""")
    else:
        print("✅ .env file already exists")

def create_start_script():
    """Create simple start script"""
    if platform.system() == "Windows":
        script_content = """@echo off
echo Starting Jasho Backend...
call venv\\Scripts\\activate
python start.py
pause
"""
        with open("start.bat", "w") as f:
            f.write(script_content)
        print("✅ Created start.bat for Windows")
    else:
        script_content = """#!/bin/bash
echo "Starting Jasho Backend..."
source venv/bin/activate
python start.py
"""
        with open("start.sh", "w") as f:
            f.write(script_content)
        os.chmod("start.sh", 0o755)
        print("✅ Created start.sh for Unix/Linux")

def print_next_steps():
    """Print next steps"""
    print("\n🎉 Setup Complete!")
    print("\n📋 Next Steps:")
    print("1. Edit .env file with your configuration")
    print("2. Set up PostgreSQL database")
    print("3. Set up Redis server")
    print("4. Configure Firebase credentials")
    print("\n🚀 To start the server:")
    
    if platform.system() == "Windows":
        print("   Double-click start.bat or run: start.bat")
    else:
        print("   Run: ./start.sh")
    
    print("\n📚 Or manually:")
    print(f"   {get_activate_script()}")
    print("   python start.py")
    
    print("\n🌐 Server will be available at: http://localhost:8000")
    print("📖 API Documentation: http://localhost:8000/docs")

def main():
    print_banner()
    check_python()
    create_virtual_env()
    install_dependencies()
    create_env_file()
    create_start_script()
    print_next_steps()

if __name__ == "__main__":
    main()
