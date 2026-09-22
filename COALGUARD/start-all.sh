#!/bin/bash
echo "======================================================================"
echo "                 COALGUARD AI - SYSTEM STARTUP"
echo "      AI-Based Smart Governance & Compliance Monitoring System"
echo "======================================================================"

cd "$(dirname "$0")/backend"

# Train models if missing
if [ ! -f "ml/artifacts/xgboost_critical_risk_v1.pkl" ]; then
    echo "[!] Training baseline XGBoost and Isolation Forest models..."
    python3 ml/train.py
fi

# Seed database
echo "[+] Seeding database with canonical SECL mines and demo users..."
python3 scripts/seed_demo.py

# Start Backend
echo "[+] Starting FastAPI Backend on http://localhost:8000 ..."
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# Start Frontend
cd ../frontend
echo "[+] Starting Vite Frontend on http://localhost:5173 ..."
npm run dev -- --host 0.0.0.0 &
FRONTEND_PID=$!

echo "======================================================================"
echo " CoalGuard AI is live!"
echo " - Frontend: http://localhost:5173"
echo " - Backend API: http://localhost:8000/docs"
echo " - Default Login: admin@coalguard.ai / Admin@123"
echo "======================================================================"

wait $BACKEND_PID $FRONTEND_PID
