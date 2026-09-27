from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.enums import IncidentSeverity, IncidentStatus

class SafetyReportBase(BaseModel):
    mine_id: str
    reported_by: str
    incident_type: str
    severity: IncidentSeverity
    description: str
    location: str
    incident_date: datetime
    status: Optional[IncidentStatus] = IncidentStatus.OPEN

class SafetyReportCreate(SafetyReportBase):
    pass

class SafetyReportUpdate(BaseModel):
    incident_type: Optional[str] = None
    severity: Optional[IncidentSeverity] = None
    description: Optional[str] = None
    location: Optional[str] = None
    incident_date: Optional[datetime] = None
    status: Optional[IncidentStatus] = None

class SafetyReportResponse(SafetyReportBase):
    id: str
    created_at: datetime
    updated_at: datetime
