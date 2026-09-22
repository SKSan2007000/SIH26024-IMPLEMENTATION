from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from app.models.enums import AnalysisEngine, AnalysisStatus

class EvidenceAnalysisBase(BaseModel):
    evidence_id: str
    ocr_text: Optional[str] = None
    relevance_score: Optional[float] = None
    quality_score: Optional[float] = None
    confidence_score: Optional[float] = None
    analysis_status: AnalysisStatus
    analysis_summary: Optional[str] = None
    detected_indicators: Optional[List[str]] = None
    engine: AnalysisEngine

class EvidenceAnalysisCreate(EvidenceAnalysisBase):
    pass

class EvidenceAnalysisResponse(EvidenceAnalysisBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
