import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.db.base import Base

class FieldEvidence(Base):
    __tablename__ = "field_evidence"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    corrective_action_id = Column(String, ForeignKey("corrective_actions.id"), nullable=False, index=True)
    mine_id = Column(String, ForeignKey("mines.id"), nullable=False, index=True)
    submitted_by_user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    
    photo_path = Column(String, nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    accuracy = Column(Float, nullable=True)
    remarks = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    corrective_action = relationship("CorrectiveAction", backref="evidence")
    mine = relationship("Mine")
    submitter = relationship("User")
