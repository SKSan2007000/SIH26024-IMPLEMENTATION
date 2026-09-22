import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Boolean, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from app.db.base import Base
from app.models.enums import IncidentCategory, IncidentSeverity, IncidentStatus

class IncidentReport(Base):
    __tablename__ = "incident_reports"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    mine_id = Column(String, ForeignKey("mines.id"), nullable=False, index=True)
    
    category = Column(Enum(IncidentCategory), nullable=False)
    severity = Column(Enum(IncidentSeverity), nullable=False)
    status = Column(Enum(IncidentStatus), nullable=False, default=IncidentStatus.OPEN)
    
    description = Column(String, nullable=False)
    
    # Reporter info (nullable for anonymous)
    reporter_name = Column(String, nullable=True)
    reporter_contact = Column(String, nullable=True)
    is_anonymous = Column(Boolean, nullable=False, default=False)
    
    # Optional GPS
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    # Link to potential corrective action
    linked_action_id = Column(String, ForeignKey("corrective_actions.id"), nullable=True)
    
    # Relationships
    mine = relationship("Mine")
    linked_action = relationship("CorrectiveAction")
