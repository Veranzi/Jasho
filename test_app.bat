@echo off
echo ========================================
echo   JASHO APP TEST
echo ========================================
echo.

echo Testing Flutter app...
cd jashoo
flutter analyze
if %errorlevel% neq 0 (
    echo Flutter analysis failed
    pause
    exit /b 1
)

echo.
echo Flutter app is ready!
echo.
echo To run the app:
echo 1. Backend: cd Jasho_backend ^&^& python run.py
echo 2. Frontend: cd jashoo ^&^& flutter run
echo.
pause
