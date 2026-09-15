from pydantic import BaseModel, ConfigDict
from datetime import datetime, date
from typing import Optional
from app.models.enums import UserRole, TaskStatus

class DailyTaskBase(BaseModel):
    title: str
    description: str
    role: UserRole
    mine_id: str
    status: TaskStatus
    generation_date: date

class DailyTaskResponse(DailyTaskBase):
    id: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class DailyTaskGenerateResponse(BaseModel):
    message: str
    tasks_generated: int
