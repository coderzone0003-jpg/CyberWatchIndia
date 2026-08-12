@echo off
setlocal EnableExtensions

set "ROOT=%~dp0.."
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"

echo ======================================
echo Environment Variable Validation
echo ======================================
echo.
echo Project: %ROOT%
echo.

echo Checking Backend Environment...
set "BACKEND_ENV=%ROOT%\backend\.env"
if not exist "%BACKEND_ENV%" (
    echo [X] backend\.env not found
    if exist "%ROOT%\backend\.env.example" (
        echo     Copy: backend\.env.example -^> backend\.env
    )
) else (
    echo [OK] backend\.env exists
)

echo.
echo Checking Frontend Environment...
set "FRONTEND_ENV=%ROOT%\Frontend\.env"
if not exist "%FRONTEND_ENV%" (
    echo [X] Frontend\.env not found
    if exist "%ROOT%\Frontend\.env.example" (
        echo     Copy: Frontend\.env.example -^> Frontend\.env
    )
) else (
    echo [OK] Frontend\.env exists
)

echo.
echo ======================================
echo Required Backend Variables
echo ======================================
echo   PORT
echo   SUPABASE_URL
echo   SUPABASE_ANON_KEY
echo   SUPABASE_SERVICE_ROLE_KEY
echo   JWT_SECRET
echo   FRONTEND_URL
echo   ADMIN_EMAIL / ADMIN_PASSWORD
echo.
echo Required Frontend Variables
echo   REACT_APP_API_URL
echo   REACT_APP_SUPABASE_URL
echo   REACT_APP_SUPABASE_ANON_KEY
echo.
pause
endlocal
