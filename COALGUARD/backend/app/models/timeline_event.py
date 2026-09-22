import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from app.db.base import Base

class TimelineEvent(Base):
    __tablename__ = "timeline_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    mine_id = Column(String(36), ForeignKey("mines.id"), nullable=False, index=True)
    department = Column(String(50), nullable=True) # SAFETY, ENVIRONMENT, CONTRACTOR, INSPECTION, COMPLIANCE, GOVERNANCE
    event_type = Column(String(50), nullable=False) # e.g. "INCIDENT", "INSPECTION", "EVIDENCE", "VERIFICATION", "RISK_ALERT"
    
    title = Column(String(200), nullable=False)
    description = Column(String, nullable=True)
    severity = Column(String(20), nullable=True, default="LOW") # LOW, MEDIUM, HIGH, CRITICAL
    
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    entity_type = Column(String(50), nullable=True) # "CorrectiveAction", "SafetyReport", "MineRisk", etc.
    entity_id = Column(String(36), nullable=True)
    metadata_json = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    mine = relationship("Mine")
    user = relationship("User")
