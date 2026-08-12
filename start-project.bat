@echo off
setlocal EnableExtensions
title Cyber Crime Portal - All-in-One Launcher
color 0A

REM ============================================================
REM  Cyber Crime Portal - All-in-One Startup
REM  Double-click this file to:
REM    1) Check Node.js / npm
REM    2) Setup .env files (if missing)
REM    3) Install backend + frontend dependencies
REM    4) Start backend (5000) and frontend (3000) servers
REM  Developer: MR SHUBHAM BHOJANE
REM ============================================================

set "ROOT=%~dp0"
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"

echo.
echo ============================================================
echo   Cyber Crime Portal - All-in-One Launcher
echo ============================================================
echo.
echo Project: %ROOT%
echo.

REM ---------- 1. Check Node.js and npm ----------
echo [1/6] Checking Node.js and npm...
where node >nul 2>&1
if errorlevel 1 (
    echo.
    echo [ERROR] Node.js not found! Install LTS from https://nodejs.org/
    echo.
    pause
    exit /b 1
)
where npm >nul 2>&1
if errorlevel 1 (
    echo.
    echo [ERROR] npm not found! Reinstall Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)
for /f "delims=" %%i in ('node --version 2^>nul') do echo       Node.js %%i
for /f "delims=" %%i in ('npm --version 2^>nul') do echo       npm     %%i
echo       OK
echo.

REM ---------- 2. Check folders ----------
echo [2/6] Checking project folders...
if not exist "%ROOT%\backend\package.json" (
    echo [ERROR] backend\package.json not found!
    pause
    exit /b 1
)
if not exist "%ROOT%\Frontend\package.json" (
    echo [ERROR] Frontend\package.json not found!
    pause
    exit /b 1
)
echo       OK backend + Frontend found
echo.

REM ---------- 3. Setup .env files ----------
echo [3/6] Checking environment files...
set "ENV_FAIL=0"

if not exist "%ROOT%\backend\.env" (
    if exist "%ROOT%\backend\.env.example" (
        echo       Creating backend\.env from example...
        copy /Y "%ROOT%\backend\.env.example" "%ROOT%\backend\.env" >nul
    ) else (
        echo [ERROR] backend\.env missing and no .env.example found!
        set "ENV_FAIL=1"
    )
) else (
    echo       OK backend\.env
)

if not exist "%ROOT%\Frontend\.env" (
    if exist "%ROOT%\Frontend\.env.example" (
        echo       Creating Frontend\.env from example...
        copy /Y "%ROOT%\Frontend\.env.example" "%ROOT%\Frontend\.env" >nul
    ) else (
        echo [ERROR] Frontend\.env missing and no .env.example found!
        set "ENV_FAIL=1"
    )
) else (
    echo       OK Frontend\.env
)

if "%ENV_FAIL%"=="1" (
    echo.
    echo Fix .env files then run this script again.
    pause
    exit /b 1
)
echo.

REM ---------- 4. Install backend dependencies ----------
echo [4/6] Installing backend dependencies...
cd /d "%ROOT%\backend"
call npm install
if errorlevel 1 (
    echo.
    echo [ERROR] Backend npm install failed!
    pause
    exit /b 1
)
echo       OK backend node_modules ready
echo.

REM ---------- 5. Install frontend dependencies ----------
echo [5/6] Installing frontend dependencies...
cd /d "%ROOT%\Frontend"
call npm install
if errorlevel 1 (
    echo.
    echo [ERROR] Frontend npm install failed!
    pause
    exit /b 1
)
echo       OK frontend node_modules ready
echo.

cd /d "%ROOT%"

REM ---------- 6. Start both servers ----------
echo [6/6] Starting servers...
echo.
echo       Backend  -^> http://localhost:5000
echo       Frontend -^> http://localhost:3000
echo.

start "Cyber Crime Portal - Backend [5000]" cmd /k "cd /d "%ROOT%\backend" && title Cyber Crime Portal - Backend && npm run dev"

echo       Waiting 6 seconds for backend...
timeout /t 6 /nobreak >nul

start "Cyber Crime Portal - Frontend [3000]" cmd /k "cd /d "%ROOT%\Frontend" && title Cyber Crime Portal - Frontend && set BROWSER=none && npm start"

echo.
echo ============================================================
echo   All Done!
echo ============================================================
echo.
echo   Backend:  http://localhost:5000
echo   Frontend: http://localhost:3000
echo.
echo   Two server windows are now open.
echo   Keep them running while using the website.
echo   Close those windows to stop the servers.
echo.
echo   Admin login: use your admin email and password on the login page
echo.
echo Press any key to close this launcher window...
pause >nul
endlocal
