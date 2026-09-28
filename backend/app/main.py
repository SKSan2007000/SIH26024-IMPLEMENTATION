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
from app.db.session import SessionLocal, engine
from app.db.base import Base
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
    # Ensure database schema is created
    Base.metadata.create_all(bind=engine)

    # Check if database is empty; if so, populate baseline demo data
    db = SessionLocal()
    try:
        from app.models.mine import Mine
        if db.query(Mine).count() == 0:
            print("[CoalGuard] Initializing database with deterministic seed data...")
            from scripts.seed_demo import seed_database
            seed_database(drop_tables=False)
            print("[CoalGuard] Database successfully initialized and seeded.")
    except Exception as e:
        print(f"[CoalGuard] Warning during initial seed check: {e}")
    finally:
        db.close()

    # Startup scheduler
    try:
        scheduler.add_job(run_daily_tasks, CronTrigger(hour=0, minute=0))
        scheduler.start()
    except Exception as e:
        print(f"[CoalGuard] Scheduler startup warning: {e}")

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

cors_origins = list(settings.CORS_ORIGINS)
if settings.FRONTEND_URL and settings.FRONTEND_URL not in cors_origins:
    cors_origins.append(settings.FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"https://.*\.vercel\.app|https://.*\.railway\.app|https://.*\.trycloudflare\.com|http://localhost(:\d+)?|http://127.0.0.1(:\d+)?",
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

        # Check active ML models from database
        active_xgb = db.query(MLModelVersion).filter(
            MLModelVersion.model_type == "XGBOOST_CRITICAL_RISK",
            MLModelVersion.is_active == True
        ).first()
        active_iso = db.query(MLModelVersion).filter(
            MLModelVersion.model_type == "ISOLATION_FOREST_ANOMALY",
            MLModelVersion.is_active == True
        ).first()
        
        if not (active_xgb and active_iso):
            ml_status = "warning: no active ml model version in database"
            shap_status = "warning: shap explainer unavailable without active model"
    except Exception as e:
        db_status = f"error: {str(e)}"
        ml_status = "error: db unreachable"
        shap_status = "error: db unreachable"
    finally:
        db.close()
        
    is_ok = (db_status == "ok" and "error" not in ml_status)
    return {
        "status": "ok" if is_ok else "degraded",
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

if __name__ == "__main__":
    import uvicorn
    raw_port = os.environ.get("PORT", "8000")
    try:
        port = int(raw_port)
    except (ValueError, TypeError):
        port = 8000
    host = os.environ.get("HOST", "0.0.0.0")
    uvicorn.run("app.main:app", host=host, port=port, log_level="info")
