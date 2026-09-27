from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.enums import DocumentStatus

class ComplianceDocumentBase(BaseModel):
    mine_id: str
    document_type: str
    document_number: str
    issue_date: datetime
    expiry_date: datetime
    status: Optional[DocumentStatus] = None
    description: Optional[str] = None

class ComplianceDocumentCreate(ComplianceDocumentBase):
    pass

class ComplianceDocumentUpdate(BaseModel):
    document_type: Optional[str] = None
    document_number: Optional[str] = None
    issue_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    status: Optional[DocumentStatus] = None
    description: Optional[str] = None

class ComplianceDocumentResponse(ComplianceDocumentBase):
    id: str
    created_at: datetime
    updated_at: datetime
