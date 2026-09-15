import os
import sys
from datetime import datetime, timedelta, timezone
from sqlalchemy import func
from sqlalchemy.orm import Session

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from app.models.safety_report import SafetyReport
from app.models.environment_reading import EnvironmentReading
from app.models.corrective_action import CorrectiveAction
from app.models.mine_risk import MineRisk
from app.models.enums import IncidentSeverity, ActionStatus, ActionPriority

def _naive(dt):
    return dt.replace(tzinfo=None) if dt else None

def get_features(db: Session, mine_id: str, as_of_date: datetime) -> dict:
    """
    Extracts fixed-length feature vector for a mine at a specific point in time.
    Strictly filters data <= as_of_date to prevent data leakage.
    """
    date_7d_ago = as_of_date - timedelta(days=7)
    date_30d_ago = as_of_date - timedelta(days=30)
    
    date_7d_ago_n = _naive(date_7d_ago)
    as_of_date_n = _naive(as_of_date)
    
    features = {}
    
    # 1. Safety Features
    incidents_30d = db.query(SafetyReport).filter(
        SafetyReport.mine_id == mine_id,
        SafetyReport.incident_date <= as_of_date,
        SafetyReport.incident_date >= date_30d_ago
    ).all()
    
    features['safety_incidents_30d'] = len(incidents_30d)
    features['safety_incidents_7d'] = sum(1 for i in incidents_30d if _naive(i.incident_date) >= date_7d_ago_n)
    features['critical_incidents_30d'] = sum(1 for i in incidents_30d if i.severity == IncidentSeverity.CRITICAL)
    features['high_severity_incidents_30d'] = sum(1 for i in incidents_30d if i.severity in [IncidentSeverity.HIGH, IncidentSeverity.CRITICAL])
    
    # 2. Environment Features
    env_30d = db.query(EnvironmentReading).filter(
        EnvironmentReading.mine_id == mine_id,
        EnvironmentReading.recorded_at <= as_of_date,
        EnvironmentReading.recorded_at >= date_30d_ago
    ).all()
    
    pm10_vals = [e.pm10 for e in env_30d if e.pm10 is not None]
    features['pm10_avg_30d'] = sum(pm10_vals)/len(pm10_vals) if pm10_vals else 0.0
    
    pm10_7d_vals = [e.pm10 for e in env_30d if e.pm10 is not None and _naive(e.recorded_at) >= date_7d_ago_n]
    features['pm10_avg_7d'] = sum(pm10_7d_vals)/len(pm10_7d_vals) if pm10_7d_vals else features['pm10_avg_30d']
    
    features['pm10_trend'] = features['pm10_avg_7d'] - features['pm10_avg_30d']
    
    # 3. Corrective Actions
    open_actions = db.query(CorrectiveAction).filter(
        CorrectiveAction.mine_id == mine_id,
        CorrectiveAction.created_at <= as_of_date,
        CorrectiveAction.status == ActionStatus.OPEN
    ).all()
    
    features['open_actions'] = len(open_actions)
    features['overdue_actions'] = sum(1 for a in open_actions if _naive(a.deadline) <= as_of_date_n)
    features['critical_open_actions'] = sum(1 for a in open_actions if a.priority == ActionPriority.CRITICAL)
    
    # 4. Risk History
    # Get latest risk BEFORE or AT as_of_date
    latest_risk = db.query(MineRisk).filter(
        MineRisk.mine_id == mine_id,
        MineRisk.calculated_at <= as_of_date
    ).order_by(MineRisk.calculated_at.desc()).first()
    
    features['current_baseline_risk'] = latest_risk.overall_risk_score if latest_risk else 0.0
    
    risk_7d = db.query(MineRisk).filter(
        MineRisk.mine_id == mine_id,
        MineRisk.calculated_at <= date_7d_ago
    ).order_by(MineRisk.calculated_at.desc()).first()
    
    risk_7d_score = risk_7d.overall_risk_score if risk_7d else features['current_baseline_risk']
    features['risk_7d_change'] = features['current_baseline_risk'] - risk_7d_score
    
    return features
