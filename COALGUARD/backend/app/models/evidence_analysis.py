import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.types import JSON
from app.db.base import Base

class EvidenceAnalysis(Base):
    __tablename__ = "evidence_analysis"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    evidence_id = Column(String, ForeignKey("field_evidence.id"), nullable=False, index=True)
    
    ocr_text = Column(String, nullable=True)
    relevance_score = Column(Float, nullable=True)
    quality_score = Column(Float, nullable=True)
    confidence_score = Column(Float, nullable=True)
    
    analysis_status = Column(String, nullable=False, default="PENDING")
    analysis_summary = Column(String, nullable=True)
    
    # Store detected indicators as a JSON string for SQLite compatibility (list of strings)
    detected_indicators = Column(JSON, nullable=True)
    
    engine = Column(String, nullable=False)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    evidence = relationship("FieldEvidence", backref="analysis")
