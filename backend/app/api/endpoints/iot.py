from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.enums import UserRole
from app.schemas.iot import IoTSensorResponse, TelemetryResponse, DemoIoTEvent
from app.services.iot_service import IoTService

router = APIRouter()

@router.get("/sensors/{mine_id}", response_model=List[IoTSensorResponse])
def get_mine_sensors(
    mine_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.mine_id and current_user.mine_id != mine_id and current_user.role not in ["HEAD_ADMIN", "REGIONAL_MANAGER", "AREA_MANAGER", UserRole.HEAD_ADMIN, UserRole.REGIONAL_MANAGER, UserRole.AREA_MANAGER]:
        raise HTTPException(status_code=403, detail="Cannot access sensors for this mine")
        
    return IoTService.get_sensors(db, mine_id)

@router.get("/telemetry/{sensor_id}", response_model=List[TelemetryResponse])
def get_sensor_telemetry(
    sensor_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from app.models.iot import IoTSensor
    sensor = db.query(IoTSensor).filter(IoTSensor.id == sensor_id).first()
    if not sensor:
        raise HTTPException(status_code=404, detail="Sensor not found")
        
    if current_user.mine_id and current_user.mine_id != sensor.mine_id and current_user.role not in ["HEAD_ADMIN", "REGIONAL_MANAGER", "AREA_MANAGER", UserRole.HEAD_ADMIN, UserRole.REGIONAL_MANAGER, UserRole.AREA_MANAGER]:
        raise HTTPException(status_code=403, detail="Cannot access telemetry for this sensor")
        
    return IoTService.get_telemetry(db, sensor_id)

@router.post("/demo/generate/{mine_id}", response_model=List[TelemetryResponse])
def generate_demo_telemetry(
    mine_id: str,
    event: DemoIoTEvent,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate synthetic telemetry data for demonstration.
    """
    # Only allow authorized roles to trigger demo data
    role_val = current_user.role if isinstance(current_user.role, str) else current_user.role.value
    if role_val not in ["HEAD_ADMIN", "MINE_MANAGER", "SAFETY_OFFICER", "ENVIRONMENTAL_OFFICER"]:
        raise HTTPException(status_code=403, detail="Not authorized to trigger demo events")
        
    if current_user.mine_id and current_user.mine_id != mine_id and role_val not in ["HEAD_ADMIN", "REGIONAL_MANAGER", "AREA_MANAGER"]:
        raise HTTPException(status_code=403, detail="Cannot trigger demo events for this mine")
        
    return IoTService.generate_demo_telemetry(db, mine_id, event.event_type)

from app.schemas.iot import TelemetryCreate

@router.post("/ingest", response_model=TelemetryResponse, status_code=201)
def ingest_telemetry(
    payload: TelemetryCreate,
    db: Session = Depends(get_db)
    # Note: For a real IoT ingest, we might use a special IoT machine token rather than user token
    # But since it's an API, we can just let the global router auth handle it or add machine auth later
):
    try:
        return IoTService.ingest_telemetry(db, payload.sensor_id, payload.value, payload.quality)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
