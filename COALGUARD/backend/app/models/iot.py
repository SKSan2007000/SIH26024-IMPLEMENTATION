import uuid
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum

from app.db.base import Base

class SensorType(str, enum.Enum):
    PM10 = "PM10"
    PM25 = "PM25"
    TEMPERATURE = "TEMPERATURE"
    METHANE = "METHANE"
    CO = "CO"
    DUST = "DUST"
    VIBRATION = "VIBRATION"
    NOISE = "NOISE"
    HUMIDITY = "HUMIDITY"

class SensorStatus(str, enum.Enum):
    ONLINE = "ONLINE"
    OFFLINE = "OFFLINE"
    MAINTENANCE = "MAINTENANCE"
    DEGRADED = "DEGRADED"

class IoTSensor(Base):
    __tablename__ = "iot_sensors"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    mine_id = Column(String(36), ForeignKey("mines.id"), nullable=False)
    sensor_name = Column(String, nullable=False)
    sensor_type = Column(SQLEnum(SensorType), nullable=False)
    zone = Column(String, nullable=False)
    
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    elevation = Column(Float, nullable=True)
    
    unit = Column(String, nullable=False)
    status = Column(SQLEnum(SensorStatus), default=SensorStatus.ONLINE)
    
    threshold_warning = Column(Float, nullable=False)
    threshold_critical = Column(Float, nullable=False)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    mine = relationship("Mine")

class Telemetry(Base):
    __tablename__ = "telemetry"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    sensor_id = Column(String(36), ForeignKey("iot_sensors.id"), nullable=False)
    value = Column(Float, nullable=False)
    quality = Column(String, default="GOOD")
    
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    generated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    sensor = relationship("IoTSensor")
