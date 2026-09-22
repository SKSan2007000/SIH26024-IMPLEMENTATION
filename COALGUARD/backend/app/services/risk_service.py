from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional

from app.models.mine import Mine
from app.models.mine_risk import MineRisk
from app.models.safety_report import SafetyReport
from app.models.environment_reading import EnvironmentReading
from app.models.contractor import Contractor
from app.models.inspection import Inspection
from app.models.compliance_document import ComplianceDocument
from app.models.corrective_action import CorrectiveAction
from app.models.risk_recalculation import RiskRecalculation
from app.models.enums import IncidentSeverity, IncidentStatus, ActionPriority, ActionStatus, DocumentStatus
from app.schemas.risk import MineRiskCreate

class RiskService:
    # Recommended Weights based on SIH multi-department specification
    WEIGHTS = {
        "safety": 0.30,
        "corrective_actions": 0.20,
        "inspection": 0.15,
        "recurrence": 0.10,
        "environment": 0.10,
        "documentation": 0.10,
        "historical": 0.05
    }

    @staticmethod
    def get_risk_level(score: float) -> str:
        if score < 25.0: return "LOW"
        if score < 50.0: return "MEDIUM"
        if score < 75.0: return "HIGH"
        return "CRITICAL"

    @classmethod
    def calculate_mine_risk(cls, db: Session, mine_id: str) -> MineRisk:
        mine = db.query(Mine).filter(Mine.id == mine_id).first()
        if not mine:
            raise ValueError("Mine not found")

        now = datetime.now(timezone.utc)
        thirty_days_ago = now - timedelta(days=30)
        # Handle naive datetime depending on DB driver
        now_naive = now.replace(tzinfo=None)
        thirty_days_ago_naive = thirty_days_ago.replace(tzinfo=None)

        # 1. Safety Score
        safety_reports = db.query(SafetyReport).filter(
            SafetyReport.mine_id == mine_id,
            SafetyReport.incident_date >= thirty_days_ago_naive
        ).all()
        
        safety_score = 0.0
        incident_types: Dict[str, int] = {}
        
        for r in safety_reports:
            # Active or open incidents contribute heavily
            if r.status in [IncidentStatus.OPEN, IncidentStatus.UNDER_REVIEW]:
                if r.severity == IncidentSeverity.CRITICAL:
                    safety_score += 100
                elif r.severity == IncidentSeverity.HIGH:
                    safety_score += 60
                elif r.severity == IncidentSeverity.MEDIUM:
                    safety_score += 25
                else:
                    safety_score += 10
            else:
                # Resolved incidents contribute less
                if r.severity == IncidentSeverity.CRITICAL:
                    safety_score += 30
                elif r.severity == IncidentSeverity.HIGH:
                    safety_score += 15
                else:
                    safety_score += 5
                
            incident_types[r.incident_type] = incident_types.get(r.incident_type, 0) + 1
            
        safety_score = min(100.0, safety_score)

        # 2. Recurrence Score (Violation recurrence detection)
        recurrence_score = 0.0
        if incident_types:
            max_recurrence = max(incident_types.values())
            if max_recurrence >= 3:
                recurrence_score = 100.0
            elif max_recurrence == 2:
                recurrence_score = 50.0

        # 3. Corrective Action Score
        actions = db.query(CorrectiveAction).filter(
            CorrectiveAction.mine_id == mine_id,
            CorrectiveAction.status.in_([ActionStatus.OPEN, ActionStatus.ASSIGNED, ActionStatus.IN_PROGRESS, ActionStatus.OVERDUE, ActionStatus.IN_REVIEW])
        ).all()
        
        action_score = 0.0
        for a in actions:
            if a.priority == ActionPriority.CRITICAL:
                action_score += 45
            elif a.priority == ActionPriority.HIGH:
                action_score += 30
            elif a.priority == ActionPriority.MEDIUM:
                action_score += 15
            else:
                action_score += 5
            
            if a.status == ActionStatus.OVERDUE or (a.deadline and a.deadline.replace(tzinfo=None) < now_naive):
                action_score += 25
                
        action_score = min(100.0, action_score)

        # 4. Inspection Score
        inspections = db.query(Inspection).filter(
            Inspection.mine_id == mine_id,
            Inspection.completed_date >= thirty_days_ago_naive
        ).all()
        
        inspection_score = 0.0
        for i in inspections:
            if i.severity == IncidentSeverity.CRITICAL:
                inspection_score = max(inspection_score, 100.0)
            elif i.severity == IncidentSeverity.HIGH:
                inspection_score = max(inspection_score, 80.0)
            elif i.severity == IncidentSeverity.MEDIUM:
                inspection_score = max(inspection_score, 50.0)
            elif i.severity == IncidentSeverity.LOW:
                inspection_score = max(inspection_score, 20.0)

        # 5. Environment Score
        readings = db.query(EnvironmentReading).filter(
            EnvironmentReading.mine_id == mine_id
        ).order_by(EnvironmentReading.recorded_at.desc()).limit(1).all()
        
        env_score = 0.0
        if readings:
            r = readings[0]
            if r.pm25 is not None:
                # 30 is safe baseline, 120+ is hazardous
                pm25_score = min(100.0, max(0.0, (r.pm25 - 30.0) * 1.5))
                env_score = max(env_score, pm25_score)
            if r.pm10 is not None:
                # 50 is safe baseline, 150+ is hazardous
                pm10_score = min(100.0, max(0.0, (r.pm10 - 50.0)))
                env_score = max(env_score, pm10_score)

        # 6. Documentation / Compliance Score
        docs = db.query(ComplianceDocument).filter(
            ComplianceDocument.mine_id == mine_id,
            ComplianceDocument.status.in_([DocumentStatus.EXPIRED, DocumentStatus.EXPIRING])
        ).all()
        
        doc_score = 0.0
        for d in docs:
            if d.status == DocumentStatus.EXPIRED or (d.expiry_date and d.expiry_date.replace(tzinfo=None) < now_naive):
                doc_score += 50
            else:
                doc_score += 20
        doc_score = min(100.0, doc_score)

        # 7. Historical Performance
        history = db.query(MineRisk).filter(
            MineRisk.mine_id == mine_id,
            MineRisk.calculated_at < thirty_days_ago_naive
        ).order_by(MineRisk.calculated_at.desc()).limit(5).all()
        
        hist_score = 0.0
        if history:
            hist_score = sum(h.overall_risk_score for h in history) / len(history)

        # Base Multi-Department Fusion Formula
        base_risk = (
            (safety_score * cls.WEIGHTS["safety"]) +
            (action_score * cls.WEIGHTS["corrective_actions"]) +
            (inspection_score * cls.WEIGHTS["inspection"]) +
            (recurrence_score * cls.WEIGHTS["recurrence"]) +
            (env_score * cls.WEIGHTS["environment"]) +
            (doc_score * cls.WEIGHTS["documentation"]) +
            (hist_score * cls.WEIGHTS["historical"])
        )

        # Criticality Override & Mitigation Discount
        max_factor = max(safety_score, action_score, inspection_score)
        
        mitigation_discount = 15.0 + (25.0 * (1.0 - (action_score / 100.0)))
        
        # Reward active remediation velocity
        recent_completed = db.query(CorrectiveAction).filter(
            CorrectiveAction.mine_id == mine_id,
            CorrectiveAction.status.in_([ActionStatus.COMPLETED, ActionStatus.VERIFIED, ActionStatus.CLOSED]),
            CorrectiveAction.updated_at >= thirty_days_ago_naive
        ).all()
        
        for a in recent_completed:
            if a.priority in [ActionPriority.CRITICAL, ActionPriority.HIGH]:
                mitigation_discount += 12.0
            else:
                mitigation_discount += 6.0
                
        mitigation_discount = min(45.0, mitigation_discount)
        
        final_risk = max(base_risk, max_factor - mitigation_discount)
        final_risk = min(100.0, max(0.0, final_risk))

        risk_level = cls.get_risk_level(final_risk)

        # 8. Velocity & Data Confidence
        last_risk = db.query(MineRisk).filter(
            MineRisk.mine_id == mine_id
        ).order_by(MineRisk.calculated_at.desc()).first()
        
        velocity = 0.0
        if last_risk:
            velocity = round(final_risk - last_risk.overall_risk_score, 2)
            
        data_confidence = 100.0
        if not readings:
            data_confidence -= 15.0
        if not inspections:
            data_confidence -= 10.0
        if len(history) < 2:
            data_confidence -= 5.0
            
        # Create Record
        risk_record = MineRisk(
            mine_id=mine_id,
            overall_risk_score=round(final_risk, 1),
            safety_score=round(safety_score, 1),
            recurrence_score=round(recurrence_score, 1),
            corrective_action_score=round(action_score, 1),
            inspection_score=round(inspection_score, 1),
            environment_score=round(env_score, 1),
            documentation_score=round(doc_score, 1),
            historical_performance_score=round(hist_score, 1),
            velocity=velocity,
            data_confidence=round(data_confidence, 1),
            risk_level=risk_level,
            calculated_at=datetime.now(timezone.utc),
            calculation_version="v2.0-fused"
        )
        db.add(risk_record)
        db.commit()
        db.refresh(risk_record)

        return risk_record

    @classmethod
    def get_risk_breakdown(cls, db: Session, mine_id: str) -> Dict[str, Any]:
        """Provides human-interpretable risk driver contributions for UI."""
        latest = db.query(MineRisk).filter(MineRisk.mine_id == mine_id).order_by(MineRisk.calculated_at.desc()).first()
        if not latest:
            latest = cls.calculate_mine_risk(db, mine_id)
            
        drivers = [
            {"category": "Safety Incidents", "contribution": round(latest.safety_score * cls.WEIGHTS["safety"], 1), "raw_score": latest.safety_score, "weight": "30%"},
            {"category": "Corrective Actions", "contribution": round(latest.corrective_action_score * cls.WEIGHTS["corrective_actions"], 1), "raw_score": latest.corrective_action_score, "weight": "20%"},
            {"category": "Inspections", "contribution": round(latest.inspection_score * cls.WEIGHTS["inspection"], 1), "raw_score": latest.inspection_score, "weight": "15%"},
            {"category": "Repeated Violations", "contribution": round(latest.recurrence_score * cls.WEIGHTS["recurrence"], 1), "raw_score": latest.recurrence_score, "weight": "10%"},
            {"category": "Environmental Anomaly", "contribution": round(latest.environment_score * cls.WEIGHTS["environment"], 1), "raw_score": latest.environment_score, "weight": "10%"},
            {"category": "Compliance Documents", "contribution": round(latest.documentation_score * cls.WEIGHTS["documentation"], 1), "raw_score": latest.documentation_score, "weight": "10%"},
            {"category": "Historical Trend", "contribution": round(latest.historical_performance_score * cls.WEIGHTS["historical"], 1), "raw_score": latest.historical_performance_score, "weight": "5%"}
        ]
        drivers.sort(key=lambda x: x["contribution"], reverse=True)
        
        velocity_trend = "STABLE"
        if latest.velocity > 1.0:
            velocity_trend = "DETERIORATING"
        elif latest.velocity < -1.0:
            velocity_trend = "IMPROVING"
            
        return {
            "mine_id": mine_id,
            "overall_risk_score": latest.overall_risk_score,
            "risk_level": latest.risk_level,
            "risk_velocity": latest.velocity,
            "velocity_trend": velocity_trend,
            "confidence": latest.data_confidence,
            "top_drivers": drivers,
            "calculated_at": latest.calculated_at.isoformat() if latest.calculated_at else None
        }
