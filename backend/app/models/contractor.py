import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, ForeignKey, Integer, Float, DateTime
from sqlalchemy.orm import relationship
from app.db.base import Base

class Contractor(Base):
    __tablename__ = "contractors"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    mine_id = Column(String, ForeignKey("mines.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    contractor_code = Column(String, nullable=False, unique=True, index=True)
    compliance_status = Column(String, nullable=False)
    training_status = Column(String, nullable=False)
    certification_status = Column(String, nullable=False)
    certification_expiry = Column(String, nullable=True) # or DateTime if preferred
    violation_count = Column(Integer, nullable=False, default=0)
    performance_score = Column(Float, nullable=False, default=100.0)

    # Relationships
    mine = relationship("Mine", back_populates="contractors")
