from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.models.enums import EnvironmentSource

class EnvironmentReadingBase(BaseModel):
    mine_id: str
    pm25: Optional[float] = Field(None, ge=0, le=1000)
    pm10: Optional[float] = Field(None, ge=0, le=1000)
    temperature: Optional[float] = Field(None, ge=-50, le=70)
    humidity: Optional[float] = Field(None, ge=0, le=100)
    wind_speed: Optional[float] = Field(None, ge=0, le=200)
    wind_direction: Optional[float] = Field(None, ge=0, le=360)
    source: Optional[EnvironmentSource] = EnvironmentSource.MANUAL
    recorded_at: Optional[datetime] = None

class EnvironmentReadingCreate(EnvironmentReadingBase):
    pass

class EnvironmentReadingUpdate(BaseModel):
    pm25: Optional[float] = Field(None, ge=0, le=1000)
    pm10: Optional[float] = Field(None, ge=0, le=1000)
    temperature: Optional[float] = Field(None, ge=-50, le=70)
    humidity: Optional[float] = Field(None, ge=0, le=100)
    wind_speed: Optional[float] = Field(None, ge=0, le=200)
    wind_direction: Optional[float] = Field(None, ge=0, le=360)

class EnvironmentReadingResponse(EnvironmentReadingBase):
    id: str
    created_at: datetime
    recorded_at: datetime
