from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
import json

from app.models.governance import GovernanceRecommendation, AuditLog
from app.models.corrective_action import CorrectiveAction
from app.models.mine_risk import MineRisk
from app.models.ml import Prediction, AnomalyResult
from app.models.compliance_document import ComplianceDocument
from app.models.field_evidence import FieldEvidence
from app.models.risk_recalculation import RiskRecalculation
from app.models.governance_point_transaction import GovernancePointTransaction
from app.models.timeline_event import TimelineEvent
from app.models.notification import Notification
from app.models.enums import (
    RecommendationSource, 
    RecommendationStatus, 
    ActionPriority, 
    AuditEventType,
    ActionStatus,
    DocumentStatus
)
from app.services.ml_service import MLService
from app.services.risk_service import RiskService

class GovernanceService:
    @staticmethod
    def _log_audit(
        db: Session,
        mine_id: str,
        user_id: str,
        event_type: AuditEventType,
        new_status: str,
        recommendation_id: Optional[str] = None,
        action_id: Optional[str] = None,
        previous_status: Optional[str] = None,
        details: dict = None
    ):
        log = AuditLog(
            mine_id=mine_id,
            user_id=user_id,
            event_type=event_type,
            new_status=new_status,
            previous_status=previous_status,
            recommendation_id=recommendation_id,
            action_id=action_id,
            details=details or {}
        )
        db.add(log)
        return log

    @staticmethod
    def _create_recommendation_if_needed(
        db: Session,
        mine_id: str,
        rec_type: str,
        source: RecommendationSource,
        title: str,
        description: str,
        reason: str,
        priority: ActionPriority,
        severity: str,
        role: str = "MINE_MANAGER",
        source_ref: str = None,
        prediction_id: str = None,
        triggering_features: dict = None
    ):
        existing = db.query(GovernanceRecommendation).filter(
            GovernanceRecommendation.mine_id == mine_id,
            GovernanceRecommendation.recommendation_type == rec_type,
            GovernanceRecommendation.status.in_([
                RecommendationStatus.RECOMMENDED,
                RecommendationStatus.ACCEPTED
            ])
        ).first()

        if existing and existing.linked_action_id:
            action = db.query(CorrectiveAction).filter_by(id=existing.linked_action_id).first()
            if action and action.status in [ActionStatus.OPEN, ActionStatus.ASSIGNED, ActionStatus.IN_PROGRESS, ActionStatus.OVERDUE]:
                return None
        elif existing:
            return None

        rec = GovernanceRecommendation(
            mine_id=mine_id,
            source_type=source,
            source_reference=source_ref,
            recommendation_type=rec_type,
            title=title,
            description=description,
            reason=reason,
            priority=priority,
            severity=severity,
            recommended_role=role,
            prediction_id=prediction_id,
            triggering_features=triggering_features
        )
        db.add(rec)
        db.commit()
        db.refresh(rec)
        
        GovernanceService._log_audit(
            db=db,
            mine_id=mine_id,
            user_id="SYSTEM",
            event_type=AuditEventType.RECOMMENDATION_CREATED,
            new_status=RecommendationStatus.RECOMMENDED.value,
            recommendation_id=rec.id,
            details={"reason": reason, "priority": priority.value}
        )
        return rec

    @staticmethod
    def generate_recommendations(db: Session, mine_id: str):
        triad = MLService.get_intelligence_triad(db, mine_id)
        prediction_obj = db.query(Prediction).filter(Prediction.mine_id == mine_id).order_by(Prediction.created_at.desc()).first()
        pred_id = prediction_obj.id if prediction_obj else None
        
        explanation = MLService.explain_mine_prediction(db, mine_id)

        # Baseline Risk Rules
        baseline_level = triad["baseline"]["level"]
        if baseline_level == "CRITICAL":
            GovernanceService._create_recommendation_if_needed(
                db, mine_id, "BASELINE_CRITICAL", RecommendationSource.BASELINE_RISK,
                title="Immediate Governance Review",
                description="The mine's baseline risk has reached a critical level. Immediate review required.",
                reason="CRITICAL baseline risk calculated from operational data.",
                priority=ActionPriority.CRITICAL, severity="CRITICAL", role="MINE_MANAGER"
            )
        elif baseline_level == "HIGH":
            GovernanceService._create_recommendation_if_needed(
                db, mine_id, "BASELINE_HIGH", RecommendationSource.BASELINE_RISK,
                title="Priority Governance Review",
                description="The mine's baseline risk is high. Review operational safety and environment indicators.",
                reason="HIGH baseline risk calculated from operational data.",
                priority=ActionPriority.HIGH, severity="HIGH", role="AREA_MANAGER"
            )

        # XGBoost Prediction Rules
        pred_level = triad["prediction"]["level"]
        if pred_level in ["CRITICAL", "HIGH"]:
            priority = ActionPriority.CRITICAL if pred_level == "CRITICAL" else ActionPriority.HIGH
            GovernanceService._create_recommendation_if_needed(
                db, mine_id, f"PREDICTION_{pred_level}", RecommendationSource.XGBOOST,
                title="Preventive Safety Inspection",
                description=f"AI predicts a {triad['prediction']['probability_percent']}% probability of critical risk in the next 30 days.",
                reason="High XGBoost probability of impending critical risk.",
                priority=priority, severity=pred_level, role="SAFETY_OFFICER",
                prediction_id=pred_id
            )

        # Isolation Forest Anomaly Rules
        anomaly_sev = triad["anomaly"]["severity"]
        if anomaly_sev == "HIGH_ANOMALY":
            GovernanceService._create_recommendation_if_needed(
                db, mine_id, "ANOMALY_HIGH", RecommendationSource.ISOLATION_FOREST,
                title="Abnormal Operations Investigation",
                description="High severity anomaly detected in recent environmental/operational readings.",
                reason="Isolation Forest flagged current features as highly anomalous.",
                priority=ActionPriority.HIGH, severity="HIGH", role="ENVIRONMENTAL_OFFICER"
            )

        # SHAP Explanations Rules
        risk_increasing = explanation.get("top_risk_factors", [])
        for factor in risk_increasing:
            feature_name = factor.get("feature")
            if feature_name == "critical_open_actions":
                GovernanceService._create_recommendation_if_needed(
                    db, mine_id, "SHAP_OVERDUE_ACTIONS", RecommendationSource.SHAP,
                    title="Corrective Action Audit",
                    description="AI identified open critical actions as a major factor pushing risk higher.",
                    reason="SHAP identified critical_open_actions as a significant contributor.",
                    priority=ActionPriority.MEDIUM, severity="MEDIUM", role="MINE_MANAGER",
                    prediction_id=pred_id, triggering_features={"shap_factor": feature_name}
                )
            elif feature_name == "critical_incidents_30d":
                GovernanceService._create_recommendation_if_needed(
                    db, mine_id, "SHAP_SAFETY_INCIDENTS", RecommendationSource.SHAP,
                    title="Targeted Safety Review",
                    description="Recent critical incidents are strongly increasing predicted risk.",
                    reason="SHAP identified critical_incidents_30d as a significant contributor.",
                    priority=ActionPriority.HIGH, severity="HIGH", role="SAFETY_OFFICER",
                    prediction_id=pred_id, triggering_features={"shap_factor": feature_name}
                )
                
        # Compliance Document Expiry Rules
        expired_docs = db.query(ComplianceDocument).filter(
            ComplianceDocument.mine_id == mine_id,
            ComplianceDocument.status == DocumentStatus.EXPIRED
        ).all()
        for doc in expired_docs:
            GovernanceService._create_recommendation_if_needed(
                db, mine_id, f"DOC_EXPIRED_{doc.id}", RecommendationSource.COMPLIANCE,
                title=f"Renew Expired Document: {doc.document_type}",
                description=f"Document {doc.document_number} expired on {doc.expiry_date.isoformat() if doc.expiry_date else 'N/A'}.",
                reason="Compliance document is expired.",
                priority=ActionPriority.HIGH, severity="HIGH", role="AUDITOR_REGULATOR",
                source_ref=doc.id
            )

        return db.query(GovernanceRecommendation).filter(GovernanceRecommendation.mine_id == mine_id).all()

    @staticmethod
    def accept_recommendation(db: Session, rec_id: str, user_id: str, assigned_to: str):
        rec = db.query(GovernanceRecommendation).filter(GovernanceRecommendation.id == rec_id).first()
        if not rec:
            raise ValueError("Recommendation not found")
        if rec.status != RecommendationStatus.RECOMMENDED:
            raise ValueError(f"Cannot accept recommendation in status: {rec.status}")

        rec.status = RecommendationStatus.ACCEPTED
        rec.assigned_user_id = assigned_to
        rec.acknowledged_at = datetime.now(timezone.utc)

        deadline = datetime.now(timezone.utc) + timedelta(days=7)
        action = CorrectiveAction(
            mine_id=rec.mine_id,
            issue_type="GOVERNANCE_AI",
            issue_reference_id=rec.id,
            title=rec.title,
            description=f"[AI Recommended] {rec.description}\nReason: {rec.reason}",
            assigned_to=assigned_to,
            priority=rec.priority,
            deadline=deadline,
            status=ActionStatus.OPEN
        )
        db.add(action)
        db.flush()
        
        rec.linked_action_id = action.id
        
        GovernanceService._log_audit(
            db, rec.mine_id, user_id, AuditEventType.RECOMMENDATION_ACCEPTED, 
            RecommendationStatus.ACCEPTED.value, 
            recommendation_id=rec.id, action_id=action.id,
            previous_status=RecommendationStatus.RECOMMENDED.value,
            details={"assigned_to": assigned_to, "action_id": action.id}
        )
        
        db.commit()
        db.refresh(rec)
        db.refresh(action)
        return rec, action

    @staticmethod
    def reject_recommendation(db: Session, rec_id: str, user_id: str, reason: str):
        rec = db.query(GovernanceRecommendation).filter(GovernanceRecommendation.id == rec_id).first()
        if not rec:
            raise ValueError("Recommendation not found")
            
        if rec.status != RecommendationStatus.RECOMMENDED:
            raise ValueError(f"Cannot reject recommendation in status: {rec.status}")

        prev_status = rec.status.value
        rec.status = RecommendationStatus.REJECTED
        rec.rejected_at = datetime.now(timezone.utc)
        
        GovernanceService._log_audit(
            db, rec.mine_id, user_id, AuditEventType.RECOMMENDATION_REJECTED, 
            RecommendationStatus.REJECTED.value, 
            recommendation_id=rec.id,
            previous_status=prev_status,
            details={"rejection_reason": reason}
        )
        
        db.commit()
        db.refresh(rec)
        return rec

    @staticmethod
    def verify_action_closed_loop(db: Session, action_id: str, user, notes: Optional[str] = None):
        """
        Closed-Loop Verification:
        1. Capture risk before
        2. Set action to VERIFIED
        3. Recalculate risk using full engine -> risk after
        4. Store RiskRecalculation record (risk_before, risk_after, risk_delta)
        5. Award Governance Points
        6. Emit TimelineEvent and AuditLog
        """
        action = db.query(CorrectiveAction).filter(CorrectiveAction.id == action_id).first()
        if not action:
            raise ValueError("Action not found")

        user_role = user.role.value if hasattr(user.role, "value") else str(user.role)
        allowed_verifiers = ["MINE_MANAGER", "SUPERVISOR", "AREA_MANAGER", "REGIONAL_MANAGER", "HEAD_ADMIN", "SAFETY_OFFICER", "ENVIRONMENTAL_OFFICER", "SYSTEM"]
        if user_role not in allowed_verifiers:
            raise ValueError(f"User role {user_role} is not authorized to verify actions")

        # 1. Capture Risk Before
        latest_risk_before = db.query(MineRisk).filter(MineRisk.mine_id == action.mine_id).order_by(MineRisk.calculated_at.desc()).first()
        risk_before_score = latest_risk_before.overall_risk_score if latest_risk_before else 75.0
        risk_before_level = latest_risk_before.risk_level if latest_risk_before else "HIGH"

        # 2. Update Action to VERIFIED
        prev_status = action.status.value if hasattr(action.status, "value") else str(action.status)
        action.status = ActionStatus.VERIFIED
        action.completed_at = datetime.now(timezone.utc)
        action.updated_at = datetime.now(timezone.utc)

        # Complete linked recommendation if any
        rec = db.query(GovernanceRecommendation).filter(GovernanceRecommendation.linked_action_id == action.id).first()
        if rec:
            rec.status = RecommendationStatus.COMPLETED
            rec.completed_at = datetime.now(timezone.utc)

        db.commit()

        # 3. Recalculate Risk After
        risk_after_record = RiskService.calculate_mine_risk(db, action.mine_id)
        risk_after_score = risk_after_record.overall_risk_score
        risk_after_level = risk_after_record.risk_level
        risk_delta = round(risk_after_score - risk_before_score, 1)

        # Trigger ML update if available
        try:
            MLService.predict_critical_risk(db, action.mine_id)
            MLService.detect_anomaly(db, action.mine_id)
        except Exception:
            pass

        # 4. Fetch evidence
        latest_evidence = db.query(FieldEvidence).filter(FieldEvidence.corrective_action_id == action.id).order_by(FieldEvidence.created_at.desc()).first()
        evidence_id = latest_evidence.id if latest_evidence else None

        user_id_val = user.id if hasattr(user, "id") else str(user)

        # 5. Persist RiskRecalculation Record
        recalc = RiskRecalculation(
            mine_id=action.mine_id,
            action_id=action.id,
            evidence_id=evidence_id,
            verified_by_user_id=user_id_val,
            risk_before=risk_before_score,
            risk_after=risk_after_score,
            risk_delta=risk_delta,
            risk_level_before=risk_before_level,
            risk_level_after=risk_after_level,
            intervention_summary=f"Remediated issue: {action.title}",
            notes=notes or "Supervisor verified field evidence and closed the action."
        )
        db.add(recalc)

        # 6. Award Governance Points
        # Points to assignee for solving issue (+25) + evidence submitted (+5)
        tx1 = GovernancePointTransaction(
            user_id=action.assigned_to,
            mine_id=action.mine_id,
            points=25,
            category="ACTION_RESOLVED",
            reason=f"Resolved high-priority corrective action: {action.title}",
            action_id=action.id
        )
        db.add(tx1)

        # Points to verifier (+10)
        tx2 = GovernancePointTransaction(
            user_id=user_id_val,
            mine_id=action.mine_id,
            points=10,
            category="SUPERVISOR_VERIFICATION",
            reason=f"Verified field remediation for action: {action.title}",
            action_id=action.id
        )
        db.add(tx2)

        # 7. Timeline Event
        timeline_ev = TimelineEvent(
            mine_id=action.mine_id,
            department=action.issue_type,
            event_type="CLOSED_LOOP_VERIFICATION",
            title=f"Verified: {action.title}",
            description=f"Action verified by supervisor. Risk recalibrated: {risk_before_score} -> {risk_after_score} ({risk_delta:+} pts).",
            severity="LOW",
            user_id=user_id_val,
            entity_type="CorrectiveAction",
            entity_id=action.id,
            metadata_json={
                "risk_before": risk_before_score,
                "risk_after": risk_after_score,
                "risk_delta": risk_delta,
                "recalculation_id": recalc.id
            }
        )
        db.add(timeline_ev)

        # 8. Notification
        notif = Notification(
            user_id=action.assigned_to,
            title="Corrective Action Verified",
            message=f"Your corrective action '{action.title}' was verified. Risk improved by {abs(risk_delta):.1f} pts! +25 Governance Points awarded."
        )
        db.add(notif)

        # 9. Audit Log
        GovernanceService._log_audit(
            db, action.mine_id, user_id_val, AuditEventType.ACTION_VERIFIED,
            ActionStatus.VERIFIED.value, action_id=action.id, previous_status=prev_status,
            details={
                "risk_before": risk_before_score,
                "risk_after": risk_after_score,
                "risk_delta": risk_delta,
                "recalculation_id": recalc.id
            }
        )

        db.commit()
        db.refresh(action)
        db.refresh(recalc)

        return {
            "action": action,
            "recalculation": recalc,
            "risk_before": risk_before_score,
            "risk_after": risk_after_score,
            "risk_delta": risk_delta,
            "risk_level_after": risk_after_level
        }

    @staticmethod
    def update_action_status(db: Session, action_id: str, status: ActionStatus, user):
        action = db.query(CorrectiveAction).filter(CorrectiveAction.id == action_id).first()
        if not action:
            raise ValueError("Action not found")
            
        if action.status == status:
            return action

        if action.status in [ActionStatus.COMPLETED, ActionStatus.VERIFIED, ActionStatus.CLOSED] and status in [ActionStatus.OPEN, ActionStatus.ASSIGNED, ActionStatus.IN_PROGRESS]:
            raise ValueError(f"Cannot change status from {action.status.value if hasattr(action.status, 'value') else action.status} to {status.value if hasattr(status, 'value') else status}")

        if status == ActionStatus.VERIFIED:
            res = GovernanceService.verify_action_closed_loop(db, action_id, user)
            return res["action"]

        user_role = user.role.value if hasattr(user.role, "value") else str(user.role)
        if user_role == "FIELD_OFFICER" and status in [ActionStatus.COMPLETED, ActionStatus.VERIFIED]:
            raise ValueError("FIELD_OFFICER is not authorized to directly set actions to COMPLETED or VERIFIED")

        prev = action.status.value if hasattr(action.status, "value") else str(action.status)
        action.status = status
        action.updated_at = datetime.now(timezone.utc)
        
        if status in [ActionStatus.COMPLETED, ActionStatus.CLOSED]:
            action.completed_at = datetime.now(timezone.utc)
            rec = db.query(GovernanceRecommendation).filter(GovernanceRecommendation.linked_action_id == action.id).first()
            if rec:
                rec.status = RecommendationStatus.COMPLETED
                rec.completed_at = datetime.now(timezone.utc)
        
        event_map = {
            ActionStatus.IN_PROGRESS: AuditEventType.ACTION_STARTED,
            ActionStatus.COMPLETED: AuditEventType.ACTION_COMPLETED,
            ActionStatus.VERIFIED: AuditEventType.ACTION_VERIFIED,
            ActionStatus.ASSIGNED: AuditEventType.ACTION_ASSIGNED,
            ActionStatus.IN_REVIEW: AuditEventType.ACTION_STATUS_CHANGED,
        }
        
        event_type = event_map.get(status, AuditEventType.ACTION_STATUS_CHANGED)
        user_id_val = user.id if hasattr(user, "id") else str(user)
        
        GovernanceService._log_audit(
            db, action.mine_id, user_id_val, event_type, 
            status.value, 
            action_id=action.id, previous_status=prev
        )
        
        db.commit()
        
        if status in [ActionStatus.COMPLETED, ActionStatus.CLOSED]:
            RiskService.calculate_mine_risk(db, action.mine_id)
            try:
                MLService.predict_critical_risk(db, action.mine_id)
                MLService.detect_anomaly(db, action.mine_id)
            except Exception:
                pass

        db.refresh(action)
        return action

    @staticmethod
    def process_escalations(db: Session, fast_forward_days: int = 0):
        current_time = datetime.now(timezone.utc) + timedelta(days=fast_forward_days)
        
        active_actions = db.query(CorrectiveAction).filter(
            CorrectiveAction.status.in_([ActionStatus.OPEN, ActionStatus.ASSIGNED, ActionStatus.IN_PROGRESS, ActionStatus.OVERDUE])
        ).all()
        
        escalated_count = 0
        for action in active_actions:
            dl = action.deadline
            if dl.tzinfo is None:
                dl = dl.replace(tzinfo=timezone.utc)

            days_overdue = (current_time - dl).days
            
            if days_overdue >= 1 and action.status != ActionStatus.OVERDUE and action.escalation_level == 0:
                action.status = ActionStatus.OVERDUE
                GovernanceService._log_audit(
                    db, action.mine_id, "SYSTEM", AuditEventType.ACTION_STATUS_CHANGED, 
                    ActionStatus.OVERDUE.value, action_id=action.id, previous_status=ActionStatus.OPEN.value,
                    details={"reason": "1 day overdue"}
                )
                escalated_count += 1
                
            if days_overdue >= 3 and action.escalation_level < 1:
                action.escalation_level = 1
                GovernanceService._log_audit(
                    db, action.mine_id, "SYSTEM", AuditEventType.ACTION_ESCALATED, 
                    action.status.value, action_id=action.id, previous_status=action.status.value,
                    details={"reason": "3 days overdue - Escalated to Level 1 (Area Manager)"}
                )
                escalated_count += 1
                
            if days_overdue >= 7 and action.escalation_level < 2:
                action.escalation_level = 2
                GovernanceService._log_audit(
                    db, action.mine_id, "SYSTEM", AuditEventType.ACTION_ESCALATED, 
                    action.status.value, action_id=action.id, previous_status=action.status.value,
                    details={"reason": "7 days overdue - Escalated to Level 2 (Regional Manager)"}
                )
                escalated_count += 1

        db.commit()
        return escalated_count
