#!/usr/bin/env python3
"""
Simple Runner for Jasho Backend
No Docker required - just run this file
"""

import os
import sys
import uvicorn
from pathlib import Path

# Add the app directory to Python path
app_dir = Path(__file__).parent / "app"
sys.path.insert(0, str(app_dir))

def main():
    """Run the Jasho backend server"""
    print("🚀 Starting Jasho Financial Backend...")
    print("📍 Server will be available at: http://localhost:8000")
    print("📖 API Documentation: http://localhost:8000/docs")
    print("🔄 Press Ctrl+C to stop the server")
    print("-" * 50)
    
    try:
        # Try to run the full version first, fallback to simplified version
        try:
            uvicorn.run(
                "app.main:app",
                host="0.0.0.0",
                port=8000,
                reload=True,
                log_level="info"
            )
        except ImportError as e:
            print(f"⚠️ Full version not available ({e}), using simplified version...")
            uvicorn.run(
                "app.main_simple:app",
                host="0.0.0.0",
                port=8000,
                reload=True,
                log_level="info"
            )
    except KeyboardInterrupt:
        print("\n👋 Server stopped. Goodbye!")
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
