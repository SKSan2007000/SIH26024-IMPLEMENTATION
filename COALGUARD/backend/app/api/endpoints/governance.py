from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.api.deps import get_db
from app.models.governance import GovernanceRecommendation, AuditLog
from app.models.corrective_action import CorrectiveAction
from app.models.user import User
from app.models.mine import Mine
from app.models.enums import ActionStatus
from app.schemas.governance import (
    GovernanceRecommendationResponse,
    AuditLogResponse,
    RecommendationActionRequest
)
from app.schemas.corrective_action import CorrectiveActionResponse
from app.schemas.governance_score import GovernanceScoreResponse
from app.services.governance_service import GovernanceService
from app.services.governance_score_service import GovernanceScoreService

router = APIRouter()

from app.api.deps import get_db, get_current_user

@router.get("/recommendations/{mine_id}", response_model=List[GovernanceRecommendationResponse])
def get_recommendations(mine_id: str, db: Session = Depends(get_db)):
    """Fetch and optionally generate AI recommendations for the given mine."""
    # This generates new ones if Intelligence Triad demands it
    recs = GovernanceService.generate_recommendations(db, mine_id)
    return recs

@router.post("/recommendations/{rec_id}/accept", response_model=GovernanceRecommendationResponse)
def accept_recommendation(rec_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Accept an AI recommendation and convert it into an executable action."""
    try:
        rec, action = GovernanceService.accept_recommendation(db, rec_id, current_user.id, assigned_to=current_user.id)
        return rec
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/recommendations/{rec_id}/reject", response_model=GovernanceRecommendationResponse)
def reject_recommendation(rec_id: str, payload: RecommendationActionRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Reject an AI recommendation, leaving an audit trail."""
    try:
        rec = GovernanceService.reject_recommendation(db, rec_id, current_user.id, reason=payload.reason or "No reason provided")
        return rec
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/actions/{mine_id}", response_model=List[CorrectiveActionResponse])
def get_governance_actions(mine_id: str, db: Session = Depends(get_db)):
    """Fetch all active governance actions (corrective actions) for a mine."""
    actions = db.query(CorrectiveAction).filter(CorrectiveAction.mine_id == mine_id).order_by(CorrectiveAction.deadline.asc()).all()
    return actions

@router.put("/actions/{action_id}/status", response_model=CorrectiveActionResponse)
def update_action_status(action_id: str, status: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Update the status of a governance action."""
    try:
        action_status = ActionStatus(status)
        action = GovernanceService.update_action_status(db, action_id, action_status, current_user)
        return action
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/demo/escalate")
def demo_escalate_time(days: int = 1, db: Session = Depends(get_db)):
    """DEMO ONLY: Fast-forward time to test the escalation engine."""
    try:
        escalated_count = GovernanceService.process_escalations(db, fast_forward_days=days)
        return {"message": "Escalation fast-forward complete", "escalated_actions": escalated_count, "days_forward": days}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/score/{mine_id}", response_model=GovernanceScoreResponse)
def get_governance_score(mine_id: str, db: Session = Depends(get_db)):
    """Calculate and return the Verified Governance Score for a mine."""
    mine = db.query(Mine).filter(Mine.id == mine_id).first()
    if not mine:
        raise HTTPException(status_code=404, detail="Mine not found")
        
    return GovernanceScoreService.calculate_score(db, mine_id)
