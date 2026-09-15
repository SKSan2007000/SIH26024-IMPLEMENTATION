from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.enums import MineStatus

class MineBase(BaseModel):
    name: str
    code: str
    region_id: str
    area_id: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    status: MineStatus = MineStatus.ACTIVE

class MineCreate(MineBase):
    pass

class MineUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    region_id: Optional[str] = None
    area_id: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    status: Optional[MineStatus] = None

class MineResponse(MineBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
