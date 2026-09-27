from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Dict, Any

from app.api.deps import get_db, get_current_user
from app.models.user import User

router = APIRouter()

# Default in-memory configurable runtime settings for prototype
_RUNTIME_SETTINGS = {
    "risk_weights": {
        "safety": 0.30,
        "corrective_actions": 0.20,
        "inspection": 0.15,
        "recurrence": 0.10,
        "environment": 0.10,
        "documentation": 0.10,
        "historical": 0.05
    },
    "risk_thresholds": {
        "low_max": 24.9,
        "medium_max": 49.9,
        "high_max": 74.9,
        "critical_min": 75.0
    },
    "sla_hours": {
        "CRITICAL": 2,
        "HIGH": 8,
        "MEDIUM": 24,
        "LOW": 72
    },
    "sensor_thresholds": {
        "PM25_warning": 60.0,
        "PM25_critical": 120.0,
        "PM10_warning": 100.0,
        "PM10_critical": 200.0,
        "temperature_warning": 45.0,
        "temperature_critical": 55.0,
        "methane_warning": 1.0,
        "methane_critical": 2.0
    },
    "daily_portal_opening_time": "08:00",
    "alert_notifications_enabled": True
}

class SettingsUpdateRequest(BaseModel):
    risk_weights: Dict[str, float] = None
    risk_thresholds: Dict[str, float] = None
    sla_hours: Dict[str, int] = None
    sensor_thresholds: Dict[str, float] = None
    daily_portal_opening_time: str = None
    alert_notifications_enabled: bool = None

@router.get("/", response_model=Dict[str, Any])
def get_system_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve system risk weights, SLAs, thresholds, and governance configurations"""
    return _RUNTIME_SETTINGS

@router.put("/", response_model=Dict[str, Any])
def update_system_settings(
    payload: SettingsUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update runtime governance configurations (Admin only)"""
    user_role = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    if user_role not in ["HEAD_ADMIN", "MINE_MANAGER"]:
        raise HTTPException(status_code=403, detail="Only administrators can update governance settings")

    if payload.risk_weights:
        _RUNTIME_SETTINGS["risk_weights"].update(payload.risk_weights)
    if payload.risk_thresholds:
        _RUNTIME_SETTINGS["risk_thresholds"].update(payload.risk_thresholds)
    if payload.sla_hours:
        _RUNTIME_SETTINGS["sla_hours"].update(payload.sla_hours)
    if payload.sensor_thresholds:
        _RUNTIME_SETTINGS["sensor_thresholds"].update(payload.sensor_thresholds)
    if payload.daily_portal_opening_time is not None:
        _RUNTIME_SETTINGS["daily_portal_opening_time"] = payload.daily_portal_opening_time
    if payload.alert_notifications_enabled is not None:
        _RUNTIME_SETTINGS["alert_notifications_enabled"] = payload.alert_notifications_enabled

    return _RUNTIME_SETTINGS
