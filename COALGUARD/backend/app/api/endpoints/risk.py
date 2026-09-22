from app.api.deps import get_db, get_current_user
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.models.user import User
from app.models.mine import Mine
from app.models.mine_risk import MineRisk
from app.schemas.risk import MineRiskResponse, RiskOverviewItem
from app.services.risk_service import RiskService

router = APIRouter()

@router.post("/calculate/{mine_id}", response_model=MineRiskResponse)
def calculate_mine_risk(mine_id: str, db: Session = Depends(get_db)):
    try:
        return RiskService.calculate_mine_risk(db, mine_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

from datetime import datetime, timedelta, timezone
from typing import List, Optional
from app.models.safety_report import SafetyReport
from app.models.corrective_action import CorrectiveAction
from app.models.environment_reading import EnvironmentReading
from app.models.compliance_document import ComplianceDocument
from app.models.user import User
from app.models.enums import IncidentSeverity, ActionStatus, ActionPriority, DocumentStatus
from app.services.ml_service import MLService
from app.schemas.risk import WhatIfSimulationRequest, WhatIfSimulationResponse

@router.post("/simulate/{mine_id}", response_model=WhatIfSimulationResponse)
def simulate_risk(mine_id: str, req: WhatIfSimulationRequest, role: Optional[str] = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if role:
        role_val = role
    else:
        role_val = current_user.role if isinstance(current_user.role, str) else current_user.role.value
    if role_val not in ["MINE_MANAGER", "HEAD_ADMIN", "SAFETY_OFFICER", "ENVIRONMENTAL_OFFICER"]:
        raise HTTPException(status_code=403, detail="Unauthorized role for simulation")
        
    mine = db.query(Mine).filter(Mine.id == mine_id).first()
    if not mine:
        raise HTTPException(status_code=404, detail="Mine not found")
        
    # Get Baseline
    baseline = db.query(MineRisk).filter(MineRisk.mine_id == mine_id).order_by(MineRisk.calculated_at.desc()).first()
    if not baseline:
        raise HTTPException(status_code=400, detail="Cannot simulate without an existing baseline")
        
    baseline_score = baseline.overall_risk_score
    baseline_level = baseline.risk_level
    
    # Patch commit
    original_commit = db.commit
    db.commit = db.flush
    
    try:
        now = datetime.now(timezone.utc)
        factors_changed = []
        
        user = db.query(User).first()
        user_id = user.id if user else "test-user-id"
        
        # Apply Overrides
        if req.critical_safety_incidents_30d is not None:
            if req.critical_safety_incidents_30d < 0:
                raise HTTPException(status_code=422, detail="Incidents cannot be negative")
            db.query(SafetyReport).filter(SafetyReport.mine_id == mine_id, SafetyReport.incident_date >= now - timedelta(days=30)).delete()
            for _ in range(req.critical_safety_incidents_30d):
                db.add(SafetyReport(mine_id=mine_id, incident_type="Simulated", severity=IncidentSeverity.CRITICAL, description="SIM", location="SIM", reported_by=user_id, incident_date=now))
            factors_changed.append(f"Critical Safety Incidents: {req.critical_safety_incidents_30d}")

        if req.overdue_corrective_actions is not None:
            if req.overdue_corrective_actions < 0:
                raise HTTPException(status_code=422, detail="Actions cannot be negative")
            db.query(CorrectiveAction).filter(CorrectiveAction.mine_id == mine_id, CorrectiveAction.status.in_([ActionStatus.OPEN, ActionStatus.ASSIGNED, ActionStatus.IN_PROGRESS, ActionStatus.OVERDUE])).delete()
            for _ in range(req.overdue_corrective_actions):
                db.add(CorrectiveAction(mine_id=mine_id, title="SIM", description="SIM", issue_type="SAFETY", assigned_to=user_id, priority=ActionPriority.HIGH, status=ActionStatus.OVERDUE, deadline=now - timedelta(days=1)))
            factors_changed.append(f"Overdue Actions: {req.overdue_corrective_actions}")
                 
        if req.pm25_level is not None or req.pm10_level is not None:
            db.query(EnvironmentReading).filter(EnvironmentReading.mine_id == mine_id, EnvironmentReading.recorded_at >= now - timedelta(days=30)).delete()
            db.add(EnvironmentReading(mine_id=mine_id, recorded_at=now, pm10=req.pm10_level, pm25=req.pm25_level))
            if req.pm10_level is not None: factors_changed.append(f"PM10: {req.pm10_level}")
            if req.pm25_level is not None: factors_changed.append(f"PM2.5: {req.pm25_level}")
            
        if req.expired_compliance_documents is not None:
            if req.expired_compliance_documents < 0:
                raise HTTPException(status_code=422, detail="Docs cannot be negative")
            db.query(ComplianceDocument).filter(ComplianceDocument.mine_id == mine_id, ComplianceDocument.status.in_([DocumentStatus.EXPIRED, DocumentStatus.EXPIRING])).delete()
            for _ in range(req.expired_compliance_documents):
                db.add(ComplianceDocument(mine_id=mine_id, document_type="SIM", document_number="SIM", issue_date=now - timedelta(days=365), status=DocumentStatus.EXPIRED, expiry_date=now - timedelta(days=1)))
            factors_changed.append(f"Expired Documents: {req.expired_compliance_documents}")
            
        # Calculate Simulated Risk
        sim_risk = RiskService.calculate_mine_risk(db, mine_id)
        
        # ML Simulation
        try:
            MLService.predict_critical_risk(db, mine_id)
            sim_shap = MLService.explain_mine_prediction(db, mine_id)
            sim_pred = {
                "probability": sim_shap.get("prediction_probability", 0),
                "level": sim_shap.get("prediction_class", "LOW")
            }
        except Exception:
            sim_pred = None
            sim_shap = None
            
        absolute_change = sim_risk.overall_risk_score - baseline_score
        percentage_change = (absolute_change / baseline_score * 100) if baseline_score > 0 else 0
        
        return WhatIfSimulationResponse(
            baseline_score=baseline_score,
            simulated_score=sim_risk.overall_risk_score,
            baseline_level=baseline_level,
            simulated_level=sim_risk.risk_level,
            absolute_change=absolute_change,
            percentage_change=percentage_change,
            factors_changed=factors_changed,
            simulated_prediction=sim_pred,
            simulated_shap=sim_shap
        )
    finally:
        db.commit = original_commit
        db.rollback()

@router.get("/mine/{mine_id}", response_model=MineRiskResponse)
def get_latest_mine_risk(mine_id: str, db: Session = Depends(get_db)):
    risk = db.query(MineRisk).filter(MineRisk.mine_id == mine_id).order_by(MineRisk.calculated_at.desc()).first()
    if not risk:
        raise HTTPException(status_code=404, detail="Risk score not calculated yet for this mine")
    return risk

@router.get("/mine/{mine_id}/history", response_model=List[MineRiskResponse])
def get_risk_history(mine_id: str, db: Session = Depends(get_db)):
    mine = db.query(Mine).filter(Mine.id == mine_id).first()
    if not mine:
        raise HTTPException(status_code=404, detail="Mine not found")
        
    risks = db.query(MineRisk).filter(MineRisk.mine_id == mine_id).order_by(MineRisk.calculated_at.desc()).limit(20).all()
    return risks

@router.get("/overview", response_model=List[RiskOverviewItem])
def get_risk_overview(db: Session = Depends(get_db)):
    mines = db.query(Mine).all()
    results = []
    for m in mines:
        latest = db.query(MineRisk).filter(MineRisk.mine_id == m.id).order_by(MineRisk.calculated_at.desc()).first()
        if latest:
            results.append(RiskOverviewItem(
                mine_id=m.id,
                mine_name=m.name,
                overall_risk=latest.overall_risk_score,
                risk_level=latest.risk_level,
                calculated_at=latest.calculated_at
            ))
    return results

@router.get("/priority", response_model=List[RiskOverviewItem])
def get_risk_priority(db: Session = Depends(get_db)):
    # Same as overview but sorted by risk desc
    overview = get_risk_overview(db)
    return sorted(overview, key=lambda x: x.overall_risk, reverse=True)
