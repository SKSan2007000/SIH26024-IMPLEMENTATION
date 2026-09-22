from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class RegionBase(BaseModel):
    name: str
    code: str

class RegionCreate(RegionBase):
    pass

class RegionUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None

class RegionResponse(RegionBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
