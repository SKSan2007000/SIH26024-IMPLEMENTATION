import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, ForeignKey, DateTime, Float
from sqlalchemy.orm import relationship
from app.db.base import Base

class MineRisk(Base):
    __tablename__ = "mine_risks"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    mine_id = Column(String, ForeignKey("mines.id"), nullable=False, index=True)
    overall_risk_score = Column(Float, nullable=False)
    safety_score = Column(Float, nullable=False)
    recurrence_score = Column(Float, nullable=False)
    corrective_action_score = Column(Float, nullable=False)
    inspection_score = Column(Float, nullable=False)
    environment_score = Column(Float, nullable=False)
    documentation_score = Column(Float, nullable=False)
    historical_performance_score = Column(Float, nullable=False)
    velocity = Column(Float, nullable=False, default=0.0)
    data_confidence = Column(Float, nullable=False, default=100.0)
    
    risk_level = Column(String, nullable=False) # e.g., "LOW", "MEDIUM", "HIGH", "CRITICAL"
    calculated_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    calculation_version = Column(String, nullable=False, default="v1.0")

    # Relationships
    mine = relationship("Mine", back_populates="risks")
