from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from app.models.iot import SensorType, SensorStatus

class IoTSensorBase(BaseModel):
    sensor_name: str
    sensor_type: SensorType
    zone: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    elevation: Optional[float] = None
    unit: str
    threshold_warning: float
    threshold_critical: float

class IoTSensorCreate(IoTSensorBase):
    pass

class IoTSensorResponse(IoTSensorBase):
    id: str
    mine_id: str
    status: SensorStatus
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class TelemetryBase(BaseModel):
    value: float
    quality: str = "GOOD"

class TelemetryCreate(TelemetryBase):
    sensor_id: str

class TelemetryResponse(TelemetryBase):
    id: str
    sensor_id: str
    timestamp: datetime
    generated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class DemoIoTEvent(BaseModel):
    sensor_id: str
    event_type: str # NORMAL, PM10_SPIKE, METHANE_SPIKE, etc.
