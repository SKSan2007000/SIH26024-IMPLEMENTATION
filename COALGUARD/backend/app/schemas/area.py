from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AreaBase(BaseModel):
    name: str
    code: str
    region_id: str

class AreaCreate(AreaBase):
    pass

class AreaUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    region_id: Optional[str] = None

class AreaResponse(AreaBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
