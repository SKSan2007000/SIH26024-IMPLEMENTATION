from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from app.models.enums import ActionPriority, ActionStatus

class CorrectiveActionBase(BaseModel):
    mine_id: str
    issue_type: str
    issue_reference_id: Optional[str] = None
    title: str
    description: str
    assigned_to: str
    priority: ActionPriority
    deadline: datetime
    status: Optional[ActionStatus] = ActionStatus.OPEN
    completed_at: Optional[datetime] = None

class CorrectiveActionCreate(CorrectiveActionBase):
    pass

class CorrectiveActionUpdate(BaseModel):
    issue_type: Optional[str] = None
    issue_reference_id: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    assigned_to: Optional[str] = None
    priority: Optional[ActionPriority] = None
    deadline: Optional[datetime] = None
    status: Optional[ActionStatus] = None
    completed_at: Optional[datetime] = None

class CorrectiveActionResponse(CorrectiveActionBase):
    id: str
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)
