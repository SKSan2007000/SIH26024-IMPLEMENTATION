from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import json

from app.api.deps import get_db
from app.models.mine import Mine
from app.models.mine_risk import MineRisk
from app.models.ml import Prediction, AnomalyResult
from app.models.corrective_action import CorrectiveAction
from app.models.governance import GovernanceRecommendation, AuditLog
from app.services.ml_service import MLService
from app.services.risk_service import RiskService
from app.services.governance_service import GovernanceService
from pydantic import BaseModel

router = APIRouter()

class DemoResetResponse(BaseModel):
    message: str
    deleted_logs: int
    deleted_recommendations: int
    deleted_actions: int
    deleted_predictions: int
    deleted_anomalies: int
    deleted_risks: int
    mines_recalculated: int

@router.post("/reset", response_model=DemoResetResponse)
def reset_demo_state(db: Session = Depends(get_db)):
    """
    DEMO ONLY: Resets volatile demo state and recalculates intelligence for all mines.
    Does NOT destroy structural data like Mines, Users, or core operational data.
    """
    try:
        # 1. Delete AuditLogs
        deleted_logs = db.query(AuditLog).delete()
        
        # 2. Delete GovernanceRecommendations
        deleted_recommendations = db.query(GovernanceRecommendation).delete()
        
        # 3. Delete AI-generated and Synthetic CorrectiveActions
        deleted_actions = db.query(CorrectiveAction).filter(
            (CorrectiveAction.issue_type == "GOVERNANCE_AI") |
            (CorrectiveAction.title == "Synthetic Action")
        ).delete()
        
        # 4. Delete Predictions
        deleted_predictions = db.query(Prediction).delete()
        
        # 5. Delete Anomalies
        deleted_anomalies = db.query(AnomalyResult).delete()
        
        # 6. Delete MineRisks
        deleted_risks = db.query(MineRisk).delete()
        
        db.commit()
        
        # 7. Recalculate everything to restore baseline demo state
        mines = db.query(Mine).all()
        mines_recalculated = 0
        for mine in mines:
            try:
                RiskService.calculate_mine_risk(db, mine.id)
                MLService.predict_critical_risk(db, mine.id)
                MLService.detect_anomaly(db, mine.id)
                # Do not auto-generate recommendations, let the user click 'AI Intelligence' or we can pre-generate them.
                # Usually Command Center will trigger it or we can do it here. Let's pre-generate to ensure they show up in Command Center open action counts.
                GovernanceService.generate_recommendations(db, mine.id)
                mines_recalculated += 1
            except Exception as e:
                # If ML isn't active, it might fail, skip gracefully
                print(f"Error recalculating mine {mine.id}: {e}")
                
        return DemoResetResponse(
            message="Demo state reset successfully.",
            deleted_logs=deleted_logs,
            deleted_recommendations=deleted_recommendations,
            deleted_actions=deleted_actions,
            deleted_predictions=deleted_predictions,
            deleted_anomalies=deleted_anomalies,
            deleted_risks=deleted_risks,
            mines_recalculated=mines_recalculated
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Demo reset failed: {str(e)}")
