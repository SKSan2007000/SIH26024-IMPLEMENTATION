from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from datetime import datetime, timezone
import json

from app.api.deps import get_db, get_current_user, get_accessible_mine_ids
from app.models.mine import Mine
from app.models.mine_risk import MineRisk
from app.models.ml import Prediction, AnomalyResult, MLModelVersion
from app.models.corrective_action import CorrectiveAction
from app.models.governance import GovernanceRecommendation, AuditLog
from app.models.enums import ActionStatus, RecommendationStatus
from app.services.ml_service import MLService
from app.services.governance_service import GovernanceService
from app.schemas.command_center import (
    CommandCenterOverviewResponse,
    CommandCenterMinesResponse,
    CommandCenterMineItem,
    MineIntelligenceResponse,
    CommandCenterActivityResponse,
    SystemHealth
)
from app.models.user import User

router = APIRouter()

def get_system_health(db: Session) -> SystemHealth:
    health = SystemHealth(
        backend="ONLINE",
        database="UNAVAILABLE",
        ml_engine="UNAVAILABLE",
        shap_engine="UNAVAILABLE",
        governance_engine="UNAVAILABLE"
    )
    
    # Check Database
    try:
        db.execute(text("SELECT 1")).scalar()
        health.database = "CONNECTED"
        health.governance_engine = "READY" # Governance operates if DB operates
    except Exception:
        pass
        
    # Check ML Engine
    try:
        active_xgb = db.query(MLModelVersion).filter(
            MLModelVersion.model_type == "XGBOOST_CRITICAL_RISK",
            MLModelVersion.is_active == True
        ).first()
        active_if = db.query(MLModelVersion).filter(
            MLModelVersion.model_type == "ISOLATION_FOREST_ANOMALY",
            MLModelVersion.is_active == True
        ).first()
        if active_xgb and active_if:
            health.ml_engine = "READY"
            health.shap_engine = "READY"
        else:
            health.ml_engine = "DEGRADED"
            health.shap_engine = "DEGRADED"
    except Exception:
        pass
        
    return health

@router.get("/overview", response_model=CommandCenterOverviewResponse)
def get_command_center_overview(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from app.api.deps import get_accessible_mine_ids
    health = get_system_health(db)
    
    mine_ids_allowed = get_accessible_mine_ids(current_user, db)
    total_mines = len(mine_ids_allowed)
    
    all_mines = db.query(Mine).filter(Mine.id.in_(mine_ids_allowed)).all()
    mine_ids = [m.id for m in all_mines]
    
    # Bulk fetch latest risks
    risks = db.query(MineRisk).order_by(MineRisk.calculated_at.desc()).all()
    latest_risks = {}
    for r in risks:
        if r.mine_id not in latest_risks:
            latest_risks[r.mine_id] = r
            
    # Bulk fetch latest predictions
    predictions = db.query(Prediction).order_by(Prediction.created_at.desc()).all()
    latest_predictions = {}
    for p in predictions:
        if p.mine_id not in latest_predictions:
            latest_predictions[p.mine_id] = p
            
    # Bulk fetch latest anomalies
    anomalies = db.query(AnomalyResult).order_by(AnomalyResult.created_at.desc()).all()
    latest_anomalies = {}
    for a in anomalies:
        if a.mine_id not in latest_anomalies:
            latest_anomalies[a.mine_id] = a
    
    critical_mines = 0
    high_risk_mines = 0
    predicted_critical_mines = 0
    anomalies_detected = 0
    
    for m in all_mines:
        risk = latest_risks.get(m.id)
        if risk:
            if risk.risk_level == "CRITICAL":
                critical_mines += 1
            elif risk.risk_level == "HIGH":
                high_risk_mines += 1
                
        pred = latest_predictions.get(m.id)
        if pred and pred.prediction_class == "CRITICAL":
            predicted_critical_mines += 1
            
        anom = latest_anomalies.get(m.id)
        if anom and anom.is_anomaly:
            anomalies_detected += 1

    open_actions = db.query(CorrectiveAction).filter(
        CorrectiveAction.status.in_([ActionStatus.OPEN, ActionStatus.ASSIGNED, ActionStatus.IN_PROGRESS])
    ).count()
    
    overdue_actions = db.query(CorrectiveAction).filter(
        CorrectiveAction.status == ActionStatus.OVERDUE
    ).count()

    return CommandCenterOverviewResponse(
        total_mines=total_mines,
        critical_mines=critical_mines,
        high_risk_mines=high_risk_mines,
        predicted_critical_mines=predicted_critical_mines,
        anomalies_detected=anomalies_detected,
        open_actions=open_actions,
        overdue_actions=overdue_actions,
        system_health=health
    )

@router.get("/mines", response_model=CommandCenterMinesResponse)
def get_command_center_mines(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from app.api.deps import get_accessible_mine_ids
    mine_ids_allowed = get_accessible_mine_ids(current_user, db)
    all_mines = db.query(Mine).filter(Mine.id.in_(mine_ids_allowed)).all()
    
    # Bulk fetch latest risks
    risks = db.query(MineRisk).order_by(MineRisk.calculated_at.desc()).all()
    latest_risks = {}
    for r in risks:
        if r.mine_id not in latest_risks:
            latest_risks[r.mine_id] = r
            
    # Bulk fetch latest predictions
    predictions = db.query(Prediction).order_by(Prediction.created_at.desc()).all()
    latest_predictions = {}
    for p in predictions:
        if p.mine_id not in latest_predictions:
            latest_predictions[p.mine_id] = p
            
    # Bulk fetch latest anomalies
    anomalies = db.query(AnomalyResult).order_by(AnomalyResult.created_at.desc()).all()
    latest_anomalies = {}
    for a in anomalies:
        if a.mine_id not in latest_anomalies:
            latest_anomalies[a.mine_id] = a
            
    # Bulk fetch open actions
    open_actions = db.query(CorrectiveAction).filter(
        CorrectiveAction.status.in_([ActionStatus.OPEN, ActionStatus.ASSIGNED, ActionStatus.IN_PROGRESS])
    ).all()
    open_action_counts = {}
    for a in open_actions:
        open_action_counts[a.mine_id] = open_action_counts.get(a.mine_id, 0) + 1
        
    # Bulk fetch overdue actions
    overdue_actions = db.query(CorrectiveAction).filter(
        CorrectiveAction.status == ActionStatus.OVERDUE
    ).all()
    overdue_action_counts = {}
    for a in overdue_actions:
        overdue_action_counts[a.mine_id] = overdue_action_counts.get(a.mine_id, 0) + 1
        
    items = []
    
    for m in all_mines:
        baseline_risk = latest_risks.get(m.id)
        pred = latest_predictions.get(m.id)
        anom = latest_anomalies.get(m.id)
        
        baseline_level = baseline_risk.risk_level if baseline_risk else "LOW"
        baseline_score = baseline_risk.overall_risk_score if baseline_risk else 0.0
        
        pred_prob = pred.critical_probability if pred else 0.0
        anomaly_status = anom.anomaly_severity if anom else "NORMAL"
        anomaly_score = anom.anomaly_score if anom else 0.0
        
        open_count = open_action_counts.get(m.id, 0)
        overdue_count = overdue_action_counts.get(m.id, 0)
        
        # Priority calculation
        priority = 6
        if baseline_level == "CRITICAL":
            priority = 1
        elif pred_prob > 0.6:
            priority = 2
        elif anomaly_status == "HIGH_ANOMALY":
            priority = 3
        elif overdue_count > 0:
            priority = 5
        elif open_count > 0:
            priority = 4
            
        items.append(CommandCenterMineItem(
            mine_id=m.id,
            mine_name=m.name,
            location=f"{m.region.name} - {m.area.name}",
            latitude=m.latitude,
            longitude=m.longitude,
            baseline_risk_score=baseline_score,
            baseline_risk_level=baseline_level,
            predicted_critical_probability=pred_prob,
            anomaly_status=anomaly_status,
            anomaly_score=anomaly_score,
            open_action_count=open_count,
            overdue_action_count=overdue_count,
            priority_indicator=priority
        ))
        
    items.sort(key=lambda x: (x.priority_indicator, -x.baseline_risk_score))
    
    return CommandCenterMinesResponse(mines=items)

@router.get("/mine/{mine_id}", response_model=MineIntelligenceResponse)
def get_mine_intelligence(mine_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    mine = db.query(Mine).filter(Mine.id == mine_id).first()
    if not mine:
        raise HTTPException(status_code=404, detail="Mine not found")
    from app.api.deps import require_mine_access
    require_mine_access(mine_id, current_user, db)
        
    health = get_system_health(db)
    
    # 1. Triad
    triad = MLService.get_intelligence_triad(db, mine_id)
    
    # 2. SHAP Explanation
    shap_explanation = None
    if health.ml_engine == "READY":
        try:
            shap_explanation = MLService.explain_mine_prediction(db, mine_id)
        except Exception:
            health.shap_engine = "DEGRADED"
            
    # 3. Governance Recommendations
    recommendations = db.query(GovernanceRecommendation).filter(
        GovernanceRecommendation.mine_id == mine_id,
        GovernanceRecommendation.status == RecommendationStatus.RECOMMENDED
    ).all()
    
    # 4. Active Actions
    active_actions = db.query(CorrectiveAction).filter(
        CorrectiveAction.mine_id == mine_id,
        CorrectiveAction.status.in_([ActionStatus.OPEN, ActionStatus.ASSIGNED, ActionStatus.IN_PROGRESS, ActionStatus.OVERDUE])
    ).all()
    
    # 5. Audit Timeline
    audit_timeline = db.query(AuditLog).filter(
        AuditLog.mine_id == mine_id
    ).order_by(AuditLog.created_at.desc()).limit(20).all()

    return MineIntelligenceResponse(
        mine_id=mine.id,
        mine_name=mine.name,
        baseline=triad["baseline"],
        prediction=triad["prediction"],
        anomaly=triad["anomaly"],
        shap_explanation=shap_explanation,
        recommendations=recommendations,
        active_actions=active_actions,
        audit_timeline=audit_timeline,
        system_status=health
    )

@router.get("/activity", response_model=CommandCenterActivityResponse)
def get_recent_activity(db: Session = Depends(get_db)):
    activities = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(50).all()
    return CommandCenterActivityResponse(activities=activities)
