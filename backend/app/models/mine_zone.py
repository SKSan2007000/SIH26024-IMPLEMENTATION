import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, ForeignKey, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.db.base import Base
from app.models.enums import MineZoneType, RiskLevel

class MineZone(Base):
    __tablename__ = "mine_zones"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    mine_id = Column(String(36), ForeignKey("mines.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    zone_code = Column(String(50), nullable=False)
    zone_type = Column(SQLEnum(MineZoneType), nullable=False, default=MineZoneType.PIT)
    risk_level = Column(SQLEnum(RiskLevel), nullable=False, default=RiskLevel.LOW)
    
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    elevation = Column(Float, nullable=True, default=0.0)
    polygon_geojson = Column(String, nullable=True) # GeoJSON polygon boundary
    
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    mine = relationship("Mine", back_populates="zones")
