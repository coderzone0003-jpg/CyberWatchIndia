@echo off
title Cyber Crime Portal - Project Launcher
color 0A

echo.
echo ========================================
echo   Cyber Crime Portal Launcher
echo ========================================
echo.

REM Check if Node.js is installed
echo [1/6] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Node.js is not installed or not in PATH!
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)
echo ✓ Node.js is installed
node --version
echo.

REM Install backend dependencies
echo [2/6] Installing backend dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to install backend dependencies!
    echo Please check the error messages above.
    echo.
    cd ..
    pause
    exit /b 1
)
echo ✓ Backend dependencies installed successfully
echo.

REM Install frontend dependencies
echo [3/6] Installing frontend dependencies...
cd ..\Frontend
call npm install
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to install frontend dependencies!
    echo Please check the error messages above.
    echo.
    cd ..
    pause
    exit /b 1
)
echo ✓ Frontend dependencies installed successfully
echo.

REM Return to root directory
cd ..

REM Start backend server in new window
echo [4/6] Starting backend server...
start "Cyber Crime Portal - Backend" cmd /k "cd backend && npm run dev"
echo ✓ Backend server starting in new window...
echo.

REM Wait for backend to start
echo [5/6] Waiting for backend to initialize...
timeout /t 5 /nobreak >nul
echo ✓ Backend should be ready
echo.

REM Start frontend server in new window
echo [6/6] Starting frontend server...
start "Cyber Crime Portal - Frontend" cmd /k "cd Frontend && npm start"
echo ✓ Frontend server starting in new window...
echo.

echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Both servers are running in separate windows.
echo Close this window if you want to keep the servers running.
echo.
echo Press any key to close this launcher window...
pause >nul