from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from app.api.deps import get_db
from app.models.user import User
from app.models.incident_report import IncidentReport
from app.schemas.incident_report import IncidentReportCreate, IncidentReportPublicCreate, IncidentReportResponse, IncidentReportUpdate
from app.services.incident_service import IncidentService
from app.models.enums import UserRole, IncidentStatus
from app.api.deps import get_current_user

router = APIRouter()

@router.post("/public", response_model=IncidentReportResponse)
def submit_public_incident(
    *,
    db: Session = Depends(get_db),
    incident_in: IncidentReportPublicCreate
) -> IncidentReportResponse:
    """
    Submit an incident report publicly (anonymous or identified worker).
    Does not require authentication.
    """
    return IncidentService.create_public_incident(db=db, incident_in=incident_in)

@router.post("/", response_model=IncidentReportResponse, dependencies=[Depends(get_current_user)])
def submit_incident(
    *,
    db: Session = Depends(get_db),
    incident_in: IncidentReportCreate,
    current_user: User = Depends(get_current_user)
) -> IncidentReportResponse:
    """
    Submit an incident report (authenticated user).
    """
    return IncidentService.create_authenticated_incident(db=db, incident_in=incident_in, user_id=current_user.id)

@router.get("/mine/{mine_id}", response_model=List[IncidentReportResponse], dependencies=[Depends(get_current_user)])
def get_mine_incidents(
    mine_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all incident reports for a specific mine.
    Requires manager or higher role.
    """
    if current_user.role not in [UserRole.HEAD_ADMIN, UserRole.REGIONAL_MANAGER, UserRole.AREA_MANAGER, UserRole.MINE_MANAGER, UserRole.SAFETY_OFFICER, UserRole.ENVIRONMENTAL_OFFICER]:
        raise HTTPException(status_code=403, detail="Not enough permissions to view incidents")
        
    if current_user.mine_id and current_user.mine_id != mine_id and current_user.role not in [UserRole.HEAD_ADMIN, UserRole.REGIONAL_MANAGER, UserRole.AREA_MANAGER]:
        raise HTTPException(status_code=403, detail="Cannot access incidents for this mine")
        
    return db.query(IncidentReport).filter(IncidentReport.mine_id == mine_id).order_by(IncidentReport.created_at.desc()).all()

@router.get("/{report_id}", response_model=IncidentReportResponse, dependencies=[Depends(get_current_user)])
def get_incident(
    report_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific incident report.
    """
    report = db.query(IncidentReport).filter(IncidentReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Incident report not found")
        
    if current_user.mine_id and current_user.mine_id != report.mine_id and current_user.role not in [UserRole.HEAD_ADMIN, UserRole.REGIONAL_MANAGER, UserRole.AREA_MANAGER]:
        raise HTTPException(status_code=403, detail="Cannot access this incident")
        
    return report

@router.put("/{report_id}/status", response_model=IncidentReportResponse, dependencies=[Depends(get_current_user)])
def update_incident_status(
    report_id: str,
    status_update: IncidentReportUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update the status of an incident report.
    """
    report = db.query(IncidentReport).filter(IncidentReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Incident report not found")
        
    if current_user.role not in [UserRole.HEAD_ADMIN, UserRole.REGIONAL_MANAGER, UserRole.AREA_MANAGER, UserRole.MINE_MANAGER, UserRole.SAFETY_OFFICER, UserRole.ENVIRONMENTAL_OFFICER]:
        raise HTTPException(status_code=403, detail="Not enough permissions to update incidents")
        
    if current_user.mine_id and current_user.mine_id != report.mine_id and current_user.role not in [UserRole.HEAD_ADMIN, UserRole.REGIONAL_MANAGER, UserRole.AREA_MANAGER]:
        raise HTTPException(status_code=403, detail="Cannot update incident for this mine")
        
    return IncidentService.update_incident_status(db=db, report_id=report_id, new_status=status_update.status, user_id=current_user.id)
