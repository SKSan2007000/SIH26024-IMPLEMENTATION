from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.api.deps import get_db, get_current_user
from app.models.mine import Mine
from app.schemas.governance_score import GovernanceScoreResponse
from app.services.governance_score_service import GovernanceScoreService

router = APIRouter()

@router.get("/mine/{mine_id}", response_model=GovernanceScoreResponse)
def get_mine_governance_score(mine_id: str, db: Session = Depends(get_db)):
    """Calculate and return Verified Governance Score for a mine"""
    mine = db.query(Mine).filter(Mine.id == mine_id).first()
    if not mine:
        raise HTTPException(status_code=404, detail="Mine not found")
    return GovernanceScoreService.calculate_score(db, mine_id)

@router.get("/leaderboard", response_model=List[dict])
def get_governance_leaderboard(db: Session = Depends(get_db)):
    """Get officer governance points leaderboard"""
    return GovernanceScoreService.get_leaderboard(db)

@router.get("/transactions", response_model=List[dict])
def get_point_transactions(
    mine_id: Optional[str] = None,
    user_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get point transaction ledger"""
    return GovernanceScoreService.get_point_transactions(db, mine_id, user_id)
