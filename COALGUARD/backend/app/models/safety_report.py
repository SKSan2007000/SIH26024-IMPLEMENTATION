import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, ForeignKey, Enum, DateTime
from sqlalchemy.orm import relationship
from app.db.base import Base
from app.models.enums import IncidentSeverity, IncidentStatus

class SafetyReport(Base):
    __tablename__ = "safety_reports"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    mine_id = Column(String, ForeignKey("mines.id"), nullable=False, index=True)
    reported_by = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    incident_type = Column(String, nullable=False)
    severity = Column(Enum(IncidentSeverity), nullable=False)
    description = Column(String, nullable=False)
    location = Column(String, nullable=False)
    incident_date = Column(DateTime, nullable=False)
    status = Column(Enum(IncidentStatus), nullable=False, default=IncidentStatus.OPEN)

    # Relationships
    mine = relationship("Mine", back_populates="safety_reports")
    reporter = relationship("User", foreign_keys=[reported_by])
