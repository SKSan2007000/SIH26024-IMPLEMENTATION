from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ContractorBase(BaseModel):
    mine_id: str
    name: str
    contractor_code: str
    compliance_status: str
    training_status: str
    certification_status: str
    certification_expiry: Optional[str] = None
    violation_count: Optional[int] = 0
    performance_score: Optional[float] = Field(100.0, ge=0.0, le=100.0)

class ContractorCreate(ContractorBase):
    pass

class ContractorUpdate(BaseModel):
    name: Optional[str] = None
    compliance_status: Optional[str] = None
    training_status: Optional[str] = None
    certification_status: Optional[str] = None
    certification_expiry: Optional[str] = None
    violation_count: Optional[int] = None
    performance_score: Optional[float] = Field(None, ge=0.0, le=100.0)

class ContractorResponse(ContractorBase):
    id: str
    created_at: datetime
    updated_at: datetime
