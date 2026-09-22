from pydantic import BaseModel
from typing import List, Dict, Any

class MineSummaryReport(BaseModel):
    safety_report_count: int
    critical_safety_count: int
    environment_reading_count: int
    contractor_count: int
    contractor_violation_count: int
    inspection_count: int
    overdue_compliance_count: int
    expired_document_count: int
    open_corrective_actions: int
    overdue_corrective_actions: int

class RecentActivity(BaseModel):
    timestamp: str
    event_type: str
    description: str
    severity: str
