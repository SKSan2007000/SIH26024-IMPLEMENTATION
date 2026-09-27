from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.api.deps import get_db, get_current_user
from app.models.timeline_event import TimelineEvent
from app.models.user import User

router = APIRouter()

class TimelineEventCreate(BaseModel):
    mine_id: str
    department: Optional[str] = "GOVERNANCE"
    event_type: str
    title: str
    description: Optional[str] = None
    severity: Optional[str] = "LOW"
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    metadata_json: Optional[dict] = None

class TimelineEventResponse(BaseModel):
    id: str
    mine_id: str
    department: Optional[str]
    event_type: str
    title: str
    description: Optional[str]
    severity: Optional[str]
    user_id: Optional[str]
    entity_type: Optional[str]
    entity_id: Optional[str]
    metadata_json: Optional[dict]
    created_at: datetime

    class Config:
        from_attributes = True

@router.get("/mine/{mine_id}", response_model=List[TimelineEventResponse])
def get_mine_timeline(
    mine_id: str,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get chronological multi-department timeline events for a mine"""
    events = db.query(TimelineEvent).filter(
        TimelineEvent.mine_id == mine_id
    ).order_by(TimelineEvent.created_at.desc()).limit(limit).all()
    return events

@router.get("/", response_model=List[TimelineEventResponse])
def get_all_timeline_events(
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get recent timeline events across all mines"""
    events = db.query(TimelineEvent).order_by(TimelineEvent.created_at.desc()).limit(limit).all()
    return events

@router.post("/", response_model=TimelineEventResponse, status_code=status.HTTP_201_CREATED)
def create_timeline_event(
    payload: TimelineEventCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Manually or programmatically log a timeline event"""
    ev = TimelineEvent(
        mine_id=payload.mine_id,
        department=payload.department,
        event_type=payload.event_type,
        title=payload.title,
        description=payload.description,
        severity=payload.severity or "LOW",
        user_id=current_user.id,
        entity_type=payload.entity_type,
        entity_id=payload.entity_id,
        metadata_json=payload.metadata_json
    )
    db.add(ev)
    db.commit()
    db.refresh(ev)
    return ev
