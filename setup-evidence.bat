@echo off
REM Developer: MR SHUBHAM BHOJANE
setlocal
cd /d "%~dp0backend"

echo ============================================
echo  Cyber Crime Portal - Evidence Setup
echo ============================================
echo.
echo This will:
echo   1. Create evidence_files table in Supabase
echo   2. Link existing bucket files to complaints
echo.
echo You need SUPABASE_DB_PASSWORD in backend\.env
echo (Supabase Dashboard - Project Settings - Database)
echo.
echo Or run SQL manually:
echo   backend\supabase\create-evidence-table.sql
echo   in https://supabase.com/dashboard/project/izyuptpacbnshbgeygux/sql/new
echo.

call npm run setup-evidence
echo.
pause
