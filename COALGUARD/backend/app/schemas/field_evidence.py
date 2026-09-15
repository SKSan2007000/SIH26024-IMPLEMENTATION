from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class FieldEvidenceBase(BaseModel):
    corrective_action_id: str
    mine_id: str
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    accuracy: Optional[float] = None
    remarks: Optional[str] = None

class FieldEvidenceCreate(FieldEvidenceBase):
    pass

class FieldEvidenceResponse(FieldEvidenceBase):
    id: str
    submitted_by_user_id: str
    photo_path: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
