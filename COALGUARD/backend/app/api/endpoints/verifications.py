from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.risk_recalculation import RiskRecalculation
from app.services.governance_service import GovernanceService

router = APIRouter()

class VerifyActionRequest(BaseModel):
    notes: Optional[str] = None

class VerificationResponse(BaseModel):
    action_id: str
    recalculation_id: str
    risk_before: float
    risk_after: float
    risk_delta: float
    risk_level_after: str
    intervention_summary: Optional[str]
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

@router.post("/{action_id}", response_model=dict)
def verify_corrective_action(
    action_id: str,
    payload: VerifyActionRequest = VerifyActionRequest(),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Supervisor Verification:
    Closes the corrective action, triggers closed-loop risk recalculation,
    awards governance points, emits timeline event, and records risk delta.
    """
    try:
        result = GovernanceService.verify_action_closed_loop(
            db=db,
            action_id=action_id,
            user=current_user,
            notes=payload.notes
        )
        recalc = result["recalculation"]
        return {
            "status": "success",
            "message": "Action verified successfully and closed-loop risk recalculated.",
            "action_id": result["action"].id,
            "action_status": result["action"].status.value if hasattr(result["action"].status, "value") else str(result["action"].status),
            "recalculation_id": recalc.id,
            "risk_before": result["risk_before"],
            "risk_after": result["risk_after"],
            "risk_delta": result["risk_delta"],
            "risk_level_after": result["risk_level_after"],
            "created_at": recalc.created_at.isoformat()
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/mine/{mine_id}", response_model=List[dict])
def get_mine_verifications(
    mine_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all closed-loop verifications and risk recalculation records for a mine"""
    records = db.query(RiskRecalculation).filter(
        RiskRecalculation.mine_id == mine_id
    ).order_by(RiskRecalculation.created_at.desc()).all()
    
    return [
        {
            "id": r.id,
            "mine_id": r.mine_id,
            "action_id": r.action_id,
            "evidence_id": r.evidence_id,
            "verified_by_user_id": r.verified_by_user_id,
            "risk_before": r.risk_before,
            "risk_after": r.risk_after,
            "risk_delta": r.risk_delta,
            "risk_level_before": r.risk_level_before,
            "risk_level_after": r.risk_level_after,
            "intervention_summary": r.intervention_summary,
            "notes": r.notes,
            "created_at": r.created_at.isoformat()
        }
        for r in records
    ]
