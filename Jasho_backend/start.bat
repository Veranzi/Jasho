@echo off
echo.
echo ========================================
echo   Jasho Financial Backend
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://python.org
    pause
    exit /b 1
)

REM Check if virtual environment exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo ERROR: Failed to create virtual environment
        pause
        exit /b 1
    )
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate

REM Install dependencies if requirements.txt exists
if exist "requirements-simple.txt" (
    echo Installing dependencies...
    pip install -r requirements-simple.txt
) else if exist "requirements.txt" (
    echo Installing dependencies...
    pip install -r requirements.txt
)

REM Create .env file if it doesn't exist
if not exist ".env" (
    if exist "env.example" (
        echo Creating .env file...
        copy env.example .env
        echo.
        echo IMPORTANT: Please edit .env file with your configuration
        echo.
    )
)

REM Start the server
echo.
echo Starting Jasho Backend Server...
echo Server will be available at: http://localhost:8000
echo API Documentation: http://localhost:8000/docs
echo.
echo Press Ctrl+C to stop the server
echo.

python run.py

pause
