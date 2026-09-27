import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.db.base import Base

class RiskRecalculation(Base):
    __tablename__ = "risk_recalculations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    mine_id = Column(String(36), ForeignKey("mines.id"), nullable=False, index=True)
    action_id = Column(String(36), ForeignKey("corrective_actions.id"), nullable=True, index=True)
    evidence_id = Column(String(36), ForeignKey("field_evidence.id"), nullable=True)
    verified_by_user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    
    risk_before = Column(Float, nullable=False)
    risk_after = Column(Float, nullable=False)
    risk_delta = Column(Float, nullable=False) # negative means improvement (e.g. -28.0)
    
    risk_level_before = Column(String(20), nullable=False)
    risk_level_after = Column(String(20), nullable=False)
    
    intervention_summary = Column(String(255), nullable=True)
    notes = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    mine = relationship("Mine")
    action = relationship("CorrectiveAction")
    evidence = relationship("FieldEvidence")
    verifier = relationship("User")
