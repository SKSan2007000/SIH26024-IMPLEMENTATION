from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.api.deps import get_db, get_current_user
from app.models.mine_zone import MineZone
from app.models.enums import MineZoneType, RiskLevel

router = APIRouter()

class MineZoneCreate(BaseModel):
    mine_id: str
    name: str
    zone_code: str
    zone_type: Optional[str] = "PIT"
    risk_level: Optional[str] = "LOW"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    elevation: Optional[float] = 0.0
    description: Optional[str] = None

class MineZoneResponse(BaseModel):
    id: str
    mine_id: str
    name: str
    zone_code: str
    zone_type: str
    risk_level: str
    latitude: Optional[float]
    longitude: Optional[float]
    elevation: Optional[float]
    description: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

@router.get("/mine/{mine_id}", response_model=List[MineZoneResponse])
def get_mine_zones(
    mine_id: str,
    db: Session = Depends(get_db)
):
    """Fetch all operational zones for a given mine"""
    zones = db.query(MineZone).filter(MineZone.mine_id == mine_id).all()
    return zones

@router.post("/", response_model=MineZoneResponse, status_code=status.HTTP_201_CREATED)
def create_mine_zone(
    payload: MineZoneCreate,
    db: Session = Depends(get_db)
):
    """Create a new operational zone for a mine"""
    zone_type_enum = MineZoneType.PIT
    try:
        if payload.zone_type:
            zone_type_enum = MineZoneType(payload.zone_type)
    except ValueError:
        pass

    risk_enum = RiskLevel.LOW
    try:
        if payload.risk_level:
            risk_enum = RiskLevel(payload.risk_level)
    except ValueError:
        pass

    zone = MineZone(
        mine_id=payload.mine_id,
        name=payload.name,
        zone_code=payload.zone_code,
        zone_type=zone_type_enum,
        risk_level=risk_enum,
        latitude=payload.latitude,
        longitude=payload.longitude,
        elevation=payload.elevation,
        description=payload.description
    )
    db.add(zone)
    db.commit()
    db.refresh(zone)
    return zone
