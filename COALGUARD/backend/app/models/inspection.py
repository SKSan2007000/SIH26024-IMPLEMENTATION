import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, ForeignKey, Enum, DateTime
from sqlalchemy.orm import relationship
from app.db.base import Base
from app.models.enums import InspectionStatus, IncidentSeverity

class Inspection(Base):
    __tablename__ = "inspections"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    mine_id = Column(String, ForeignKey("mines.id"), nullable=False, index=True)
    officer_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    inspection_type = Column(String, nullable=False)
    scheduled_date = Column(DateTime, nullable=False)
    completed_date = Column(DateTime, nullable=True)
    findings = Column(String, nullable=True)
    severity = Column(Enum(IncidentSeverity), nullable=True)
    status = Column(Enum(InspectionStatus), nullable=False, default=InspectionStatus.SCHEDULED)

    # Relationships
    mine = relationship("Mine", back_populates="inspections")
    officer = relationship("User", foreign_keys=[officer_id])
