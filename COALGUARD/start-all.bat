@echo off
echo ======================================================================
echo                  COALGUARD AI - SYSTEM STARTUP
echo       AI-Based Smart Governance & Compliance Monitoring System
echo ======================================================================
echo.

cd /d "%~dp0backend"
echo [1/3] Checking ML Model Artifacts...
if not exist "ml\artifacts\xgboost_critical_risk_v1.pkl" (
    echo [!] Training baseline XGBoost and Isolation Forest models...
    call venv\Scripts\python.exe ml\train.py
)

echo [2/3] Seeding database with canonical SECL mines and demo users...
call venv\Scripts\python.exe scripts\seed_demo.py

echo [3/3] Starting FastAPI Backend on http://localhost:8000 ...
start "CoalGuard Backend" cmd /k "cd /d %~dp0backend && venv\Scripts\uvicorn.exe app.main:app --host 127.0.0.1 --port 8000 --reload"

echo Starting Vite Frontend on http://localhost:5173 ...
start "CoalGuard Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ======================================================================
echo  CoalGuard AI is launching!
echo  - Frontend: http://localhost:5173
echo  - Backend API: http://localhost:8000/docs
echo  - Default Login: admin@coalguard.ai / Admin@123
echo ======================================================================
pause
