import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, ForeignKey, Enum, DateTime, Integer
from sqlalchemy.orm import relationship
from app.db.base import Base
from app.models.enums import ActionPriority, ActionStatus

class CorrectiveAction(Base):
    __tablename__ = "corrective_actions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    mine_id = Column(String, ForeignKey("mines.id"), nullable=False, index=True)
    issue_type = Column(String, nullable=False) # e.g. "SAFETY", "ENVIRONMENT", "INSPECTION"
    issue_reference_id = Column(String, nullable=True) # ID of the related report/inspection
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    assigned_to = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    priority = Column(Enum(ActionPriority), nullable=False)
    deadline = Column(DateTime, nullable=False)
    status = Column(Enum(ActionStatus), nullable=False, default=ActionStatus.OPEN)
    completed_at = Column(DateTime, nullable=True)
    escalation_level = Column(Integer, default=0)

    # Relationships
    mine = relationship("Mine", back_populates="corrective_actions")
    assignee = relationship("User", foreign_keys=[assigned_to])
