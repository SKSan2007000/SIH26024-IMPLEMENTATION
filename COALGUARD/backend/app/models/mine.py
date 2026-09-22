from sqlalchemy import Column, String, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime, timezone
from app.db.base import Base

class Mine(Base):
    __tablename__ = "mines"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    code = Column(String, unique=True, index=True, nullable=False)
    region_id = Column(String, ForeignKey("regions.id"), nullable=False)
    area_id = Column(String, ForeignKey("areas.id"), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    mine_type = Column(String(50), nullable=True, default="Open Cast")
    production_category = Column(String(50), nullable=True, default="Category A (High Yield)")
    status = Column(String, nullable=False, default="ACTIVE")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    region = relationship("Region", back_populates="mines")
    area = relationship("Area", back_populates="mines")
    departments = relationship("Department", back_populates="mine")
    users = relationship("User", back_populates="mine")
    zones = relationship("MineZone", back_populates="mine", cascade="all, delete-orphan")

    safety_reports = relationship("SafetyReport", back_populates="mine")
    environment_readings = relationship("EnvironmentReading", back_populates="mine")
    contractors = relationship("Contractor", back_populates="mine")
    inspections = relationship("Inspection", back_populates="mine")
    compliance_documents = relationship("ComplianceDocument", back_populates="mine")
    corrective_actions = relationship("CorrectiveAction", back_populates="mine")
    risks = relationship("MineRisk", back_populates="mine")
