from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
import os
from contextlib import asynccontextmanager
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from app.core.config import settings
from app.api.api import api_router
from app.services.task_scheduler_service import TaskSchedulerService
from app.db.session import SessionLocal
from app.models.ml import MLModelVersion

scheduler = AsyncIOScheduler()

def run_daily_tasks():
    db = SessionLocal()
    try:
        TaskSchedulerService.generate_daily_tasks(db)
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    try:
        scheduler.add_job(run_daily_tasks, CronTrigger(hour=0, minute=0))
        scheduler.start()
    except Exception as e:
        print(f"Scheduler startup warning: {e}")
    yield
    # Shutdown
    try:
        scheduler.shutdown()
    except Exception:
        pass

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AI-Based Smart Governance and Compliance Monitoring System for Coal Mines",
    version="2.0.0",
    openapi_url="/api/v1/openapi.json",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://127.0.0.1:5173",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://localhost:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Support both /api and /api/v1 paths for seamless compatibility
app.include_router(api_router, prefix="/api")
app.include_router(api_router, prefix="/api/v1")

# Ensure uploads directory exists and mount static serving
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

def _check_system_health():
    db_status = "ok"
    ml_status = "ok"
    shap_status = "ok"
    
    db = SessionLocal()
    try:
        db.execute(text("SELECT 1")).scalar()
    except Exception as e:
        db_status = f"error: {str(e)}"
    finally:
        db.close()
        
    return {
        "status": "ok" if db_status == "ok" else "degraded",
        "service": f"{settings.PROJECT_NAME} API",
        "version": "2.0.0",
        "database": db_status,
        "ml_engine": ml_status,
        "shap_engine": shap_status,
        "governance_engine": "ok"
    }

@app.get("/health")
@app.get("/api/health")
@app.get("/api/v1/health")
def health_check():
    return _check_system_health()

@app.get("/")
def root():
    return {
        "service": settings.PROJECT_NAME,
        "tagline": "AI-Based Smart Governance and Compliance Monitoring System for Coal Mines",
        "version": "2.0.0",
        "api_docs": "/docs",
        "status": "online"
    }
