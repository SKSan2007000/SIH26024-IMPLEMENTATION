from app.api.deps import get_db
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.services.ml_service import MLService
from app.models.ml import MLModelVersion

router = APIRouter()

def _run_training_pipeline():
    # Helper to run scripts synchronously or via os.system for simplicity
    import os
    import subprocess
    
    # Run XGBoost
    xgboost_script = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../ml/training/train_xgboost.py'))
    subprocess.run(["python", xgboost_script], check=True)
    
    # Run Isolation Forest
    iso_script = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../ml/anomaly/isolation_forest.py'))
    subprocess.run(["python", iso_script], check=True)

@router.post("/train")
def train_models(background_tasks: BackgroundTasks):
    background_tasks.add_task(_run_training_pipeline)
    return {"message": "Training pipeline started in background."}

@router.get("/model/status")
def get_model_status(db: Session = Depends(get_db)):
    active_xgb = db.query(MLModelVersion).filter(
        MLModelVersion.model_type == "XGBOOST_CRITICAL_RISK", 
        MLModelVersion.is_active == True
    ).first()
    
    active_iso = db.query(MLModelVersion).filter(
        MLModelVersion.model_type == "ISOLATION_FOREST_ANOMALY", 
        MLModelVersion.is_active == True
    ).first()
    
    return {
        "xgboost": {
            "active": active_xgb is not None,
            "version": active_xgb.version if active_xgb else None,
            "trained_at": active_xgb.trained_at if active_xgb else None,
            "metrics": active_xgb.metrics_json if active_xgb else None
        },
        "isolation_forest": {
            "active": active_iso is not None,
            "version": active_iso.version if active_iso else None,
            "trained_at": active_iso.trained_at if active_iso else None,
            "metrics": active_iso.metrics_json if active_iso else None
        }
    }

from app.models.mine import Mine

@router.post("/predict/{mine_id}")
def predict_risk(mine_id: str, db: Session = Depends(get_db)):
    if not db.query(Mine).filter(Mine.id == mine_id).first():
        raise HTTPException(status_code=404, detail="Invalid mine ID")
    try:
        prediction = MLService.predict_critical_risk(db, mine_id)
        return {
            "mine_id": mine_id,
            "critical_probability": prediction.critical_probability,
            "probability_percent": int(prediction.critical_probability * 100),
            "prediction_class": prediction.prediction_class,
            "prediction_horizon_days": prediction.prediction_horizon_days,
            "model_version": prediction.model_version.version,
            "created_at": prediction.created_at
        }
    except (ValueError, FileNotFoundError) as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/anomaly/{mine_id}")
def detect_anomaly(mine_id: str, db: Session = Depends(get_db)):
    if not db.query(Mine).filter(Mine.id == mine_id).first():
        raise HTTPException(status_code=404, detail="Invalid mine ID")
    try:
        anomaly = MLService.detect_anomaly(db, mine_id)
        return {
            "mine_id": mine_id,
            "anomaly_score": anomaly.anomaly_score,
            "is_anomaly": anomaly.is_anomaly,
            "anomaly_severity": anomaly.anomaly_severity,
            "model_version": anomaly.model_version.version,
            "created_at": anomaly.created_at
        }
    except (ValueError, FileNotFoundError) as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/intelligence/{mine_id}")
def get_intelligence(mine_id: str, db: Session = Depends(get_db)):
    """Returns the unified Governance Triad"""
    try:
        return MLService.get_intelligence_triad(db, mine_id)
    except (ValueError, FileNotFoundError) as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/explain/model")
def explain_global_model(db: Session = Depends(get_db)):
    """Returns the global feature importance of the active model"""
    try:
        return MLService.explain_global_model(db)
    except (ValueError, FileNotFoundError) as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/explain/{mine_id}")
def explain_mine_prediction(mine_id: str, db: Session = Depends(get_db)):
    """Returns the local SHAP explanation for a specific mine"""
    try:
        if not db.query(Mine).filter(Mine.id == mine_id).first():
            raise ValueError("Invalid mine ID")
        return MLService.explain_mine_prediction(db, mine_id)
    except ValueError as e:
        # Check if it's our invalid mine ID error vs a model missing error
        if str(e) == "Invalid mine ID":
            raise HTTPException(status_code=404, detail=str(e))
        raise HTTPException(status_code=503, detail=str(e))
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
