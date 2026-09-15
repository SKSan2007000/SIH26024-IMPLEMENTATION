from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from datetime import datetime
from app.models.enums import IncidentCategory, IncidentSeverity, IncidentStatus

class IncidentReportBase(BaseModel):
    category: IncidentCategory
    severity: IncidentSeverity
    description: str = Field(..., min_length=10)
    
    reporter_name: Optional[str] = None
    reporter_contact: Optional[str] = None
    is_anonymous: bool = False
    
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)

class IncidentReportCreate(IncidentReportBase):
    mine_id: str

class IncidentReportPublicCreate(IncidentReportBase):
    mine_code: str # Public endpoint uses code instead of internal ID

class IncidentReportUpdate(BaseModel):
    status: IncidentStatus

class IncidentReportResponse(IncidentReportBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    mine_id: str
    status: IncidentStatus
    linked_action_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
