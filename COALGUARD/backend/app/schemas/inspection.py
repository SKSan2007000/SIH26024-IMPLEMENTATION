from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.enums import InspectionStatus, IncidentSeverity

class InspectionBase(BaseModel):
    mine_id: str
    officer_id: str
    inspection_type: str
    scheduled_date: datetime
    completed_date: Optional[datetime] = None
    findings: Optional[str] = None
    severity: Optional[IncidentSeverity] = None
    status: Optional[InspectionStatus] = InspectionStatus.SCHEDULED

class InspectionCreate(InspectionBase):
    pass

class InspectionUpdate(BaseModel):
    inspection_type: Optional[str] = None
    scheduled_date: Optional[datetime] = None
    completed_date: Optional[datetime] = None
    findings: Optional[str] = None
    severity: Optional[IncidentSeverity] = None
    status: Optional[InspectionStatus] = None

class InspectionResponse(InspectionBase):
    id: str
    created_at: datetime
    updated_at: datetime
