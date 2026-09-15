import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, ForeignKey, Enum, DateTime, Float
from sqlalchemy.orm import relationship
from app.db.base import Base
from app.models.enums import EnvironmentSource
import datetime as dt

class EnvironmentReading(Base):
    __tablename__ = "environment_readings"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    mine_id = Column(String, ForeignKey("mines.id"), nullable=False, index=True)
    pm25 = Column(Float, nullable=True)
    pm10 = Column(Float, nullable=True)
    temperature = Column(Float, nullable=True)
    humidity = Column(Float, nullable=True)
    wind_speed = Column(Float, nullable=True)
    wind_direction = Column(Float, nullable=True)
    recorded_at = Column(DateTime, nullable=False, default=dt.datetime.utcnow)
    source = Column(Enum(EnvironmentSource), nullable=False, default=EnvironmentSource.MANUAL)

    # Relationships
    mine = relationship("Mine", back_populates="environment_readings")
