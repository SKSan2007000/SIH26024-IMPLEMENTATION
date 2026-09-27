from app.api.deps import get_db, get_current_user
from app.models.user import User
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime, timezone
from app.models.mine import Mine
from app.models.safety_report import SafetyReport
from app.models.environment_reading import EnvironmentReading
from app.models.contractor import Contractor
from app.models.inspection import Inspection
from app.models.compliance_document import ComplianceDocument
from app.models.corrective_action import CorrectiveAction
from app.models.enums import IncidentSeverity, DocumentStatus, ActionStatus
from app.schemas.reports import MineSummaryReport, RecentActivity
from app.models.mine_risk import MineRisk
from app.schemas.risk import RiskSummaryResponse, RiskOverviewItem

router = APIRouter()

@router.get("/mine/{mine_id}/summary", response_model=MineSummaryReport)
def get_mine_summary(mine_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from app.api.deps import require_mine_access
    require_mine_access(mine_id, current_user, db)
    mine = db.query(Mine).filter(Mine.id == mine_id).first()
    if not mine:
        raise HTTPException(status_code=404, detail="Mine not found")

    safety_count = db.query(SafetyReport).filter(SafetyReport.mine_id == mine_id).count()
    critical_safety = db.query(SafetyReport).filter(
        SafetyReport.mine_id == mine_id, 
        SafetyReport.severity == IncidentSeverity.CRITICAL
    ).count()

    env_count = db.query(EnvironmentReading).filter(EnvironmentReading.mine_id == mine_id).count()
    
    contractors = db.query(Contractor).filter(Contractor.mine_id == mine_id).all()
    contractor_count = len(contractors)
    contractor_violation_count = sum(c.violation_count for c in contractors)

    inspection_count = db.query(Inspection).filter(Inspection.mine_id == mine_id).count()

    now = datetime.now(timezone.utc)
    # The models might not be timezone aware depending on SQLite vs PG, handle safely
    now_naive = now.replace(tzinfo=None)

    overdue_compliance = db.query(ComplianceDocument).filter(
        ComplianceDocument.mine_id == mine_id,
        ComplianceDocument.expiry_date < now_naive
    ).count()
    
    expired_docs = db.query(ComplianceDocument).filter(
        ComplianceDocument.mine_id == mine_id,
        ComplianceDocument.status == DocumentStatus.EXPIRED
    ).count()

    open_actions = db.query(CorrectiveAction).filter(
        CorrectiveAction.mine_id == mine_id,
        CorrectiveAction.status == ActionStatus.OPEN
    ).count()
    
    overdue_actions = db.query(CorrectiveAction).filter(
        CorrectiveAction.mine_id == mine_id,
        CorrectiveAction.status == ActionStatus.OVERDUE
    ).count()

    return MineSummaryReport(
        safety_report_count=safety_count,
        critical_safety_count=critical_safety,
        environment_reading_count=env_count,
        contractor_count=contractor_count,
        contractor_violation_count=contractor_violation_count,
        inspection_count=inspection_count,
        overdue_compliance_count=overdue_compliance,
        expired_document_count=expired_docs,
        open_corrective_actions=open_actions,
        overdue_corrective_actions=overdue_actions
    )

@router.get("/mine/{mine_id}/recent-activity", response_model=List[RecentActivity])
def get_recent_activity(mine_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from app.api.deps import require_mine_access
    require_mine_access(mine_id, current_user, db)
    mine = db.query(Mine).filter(Mine.id == mine_id).first()
    if not mine:
        raise HTTPException(status_code=404, detail="Mine not found")

    activities = []
    
    reports = db.query(SafetyReport).filter(SafetyReport.mine_id == mine_id).order_by(SafetyReport.created_at.desc()).limit(5).all()
    for r in reports:
        activities.append(RecentActivity(
            timestamp=r.created_at.isoformat(),
            event_type="SAFETY_REPORT",
            description=f"New safety report: {r.incident_type}",
            severity=r.severity.value
        ))

    inspections = db.query(Inspection).filter(Inspection.mine_id == mine_id).order_by(Inspection.created_at.desc()).limit(5).all()
    for i in inspections:
        activities.append(RecentActivity(
            timestamp=i.created_at.isoformat(),
            event_type="INSPECTION",
            description=f"Inspection scheduled: {i.inspection_type}",
            severity=i.severity.value if i.severity else "LOW"
        ))

    actions = db.query(CorrectiveAction).filter(CorrectiveAction.mine_id == mine_id).order_by(CorrectiveAction.created_at.desc()).limit(5).all()
    for a in actions:
        activities.append(RecentActivity(
            timestamp=a.created_at.isoformat(),
            event_type="CORRECTIVE_ACTION",
            description=f"Action assigned: {a.title}",
            severity=a.priority.value
        ))

    # Sort combined activities by timestamp descending
    activities.sort(key=lambda x: x.timestamp, reverse=True)
    return activities[:10]

@router.get("/risk-summary", response_model=RiskSummaryResponse)
def get_risk_summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from app.api.deps import get_accessible_mine_ids
    mine_ids_allowed = get_accessible_mine_ids(current_user, db)
    mines = db.query(Mine).filter(Mine.id.in_(mine_ids_allowed)).all()
    
    total = len(mines)
    critical = 0
    high = 0
    medium = 0
    low = 0
    total_score = 0.0
    
    overview_items = []
    
    for m in mines:
        latest = db.query(MineRisk).filter(MineRisk.mine_id == m.id).order_by(MineRisk.calculated_at.desc()).first()
        if latest:
            if latest.risk_level == "CRITICAL": critical += 1
            elif latest.risk_level == "HIGH": high += 1
            elif latest.risk_level == "MEDIUM": medium += 1
            else: low += 1
            
            total_score += latest.overall_risk_score
            overview_items.append(RiskOverviewItem(
                mine_id=m.id,
                mine_name=m.name,
                overall_risk=latest.overall_risk_score,
                risk_level=latest.risk_level,
                calculated_at=latest.calculated_at
            ))
            
    overview_items.sort(key=lambda x: x.overall_risk, reverse=True)
    
    return RiskSummaryResponse(
        total_mines=total,
        critical_mines=critical,
        high_risk_mines=high,
        medium_risk_mines=medium,
        low_risk_mines=low,
        average_risk=total_score / len(overview_items) if overview_items else 0.0,
        highest_risk_mine=overview_items[0] if overview_items else None,
        top_risk_mines=overview_items[:5]
    )
