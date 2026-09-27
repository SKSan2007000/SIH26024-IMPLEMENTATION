import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.db.base import Base

class GovernancePointTransaction(Base):
    __tablename__ = "governance_point_transactions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    mine_id = Column(String(36), ForeignKey("mines.id"), nullable=False, index=True)
    
    points = Column(Integer, nullable=False) # e.g. +10, +25
    category = Column(String(50), nullable=False) # e.g. "DAILY_REPORT", "VERIFIED_ACTION", "EVIDENCE_QUALITY"
    reason = Column(String(255), nullable=False)
    action_id = Column(String(36), ForeignKey("corrective_actions.id"), nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    user = relationship("User")
    mine = relationship("Mine")
    action = relationship("CorrectiveAction")
