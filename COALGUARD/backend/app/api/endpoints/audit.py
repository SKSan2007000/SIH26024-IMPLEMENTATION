from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.api.deps import get_db, get_current_user
from app.models.governance import AuditLog
from app.models.user import User

router = APIRouter()

class AuditLogItemResponse(BaseModel):
    id: str
    mine_id: str
    mine_name: Optional[str]
    user_id: str
    user_name: Optional[str]
    user_role: Optional[str]
    event_type: str
    previous_status: Optional[str]
    new_status: str
    details: Optional[dict]
    created_at: datetime

    class Config:
        from_attributes = True

@router.get("/", response_model=List[dict])
def get_audit_trail(
    mine_id: Optional[str] = None,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve tamper-evident audit logs across all operations"""
    query = db.query(AuditLog)
    if mine_id:
        query = query.filter(AuditLog.mine_id == mine_id)
        
    logs = query.order_by(AuditLog.created_at.desc()).limit(limit).all()
    
    return [
        {
            "id": l.id,
            "mine_id": l.mine_id,
            "mine_name": l.mine.name if l.mine else "Corporate",
            "user_id": l.user_id,
            "user_name": l.user.full_name if l.user else l.user_id,
            "user_role": l.user.role.value if l.user and hasattr(l.user.role, "value") else (str(l.user.role) if l.user else "SYSTEM"),
            "event_type": l.event_type.value if hasattr(l.event_type, "value") else str(l.event_type),
            "previous_status": l.previous_status,
            "new_status": l.new_status,
            "details": l.details or {},
            "created_at": l.created_at.isoformat()
        }
        for l in logs
    ]
