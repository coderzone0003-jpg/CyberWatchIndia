@echo off
REM Environment Variable Validation Script for Windows
REM Run this to check if all required environment variables are set

echo ======================================
echo Environment Variable Validation
echo ======================================
echo.

REM Backend validation
echo Checking Backend Environment Variables...
set BACKEND_ENV_FILE=..\backend\.env

if not exist "%BACKEND_ENV_FILE%" (
    echo [X] Backend .env file not found
    echo    Please copy backend\.env.example to backend\.env and fill in the values
) else (
    echo [OK] Backend .env file exists
    echo [!] Note: Please manually verify all variables are set correctly
)

echo.

REM Frontend validation
echo Checking Frontend Environment Variables...
set FRONTEND_ENV_FILE=.env

if not exist "%FRONTEND_ENV_FILE%" (
    echo [X] Frontend .env file not found
    echo    Please copy .env.example to .env and fill in the values
) else (
    echo [OK] Frontend .env file exists
    echo [!] Note: Please manually verify REACT_APP_API_URL is set correctly
)

echo.
echo ======================================
echo Validation Complete
echo ======================================
echo.
echo Required Backend Variables:
echo   - PORT
echo   - SUPABASE_URL
echo   - SUPABASE_ANON_KEY
echo   - SUPABASE_SERVICE_ROLE_KEY
echo   - JWT_SECRET
echo   - FRONTEND_URL
echo.
echo Required Frontend Variables:
echo   - REACT_APP_API_URL
echo.
pause