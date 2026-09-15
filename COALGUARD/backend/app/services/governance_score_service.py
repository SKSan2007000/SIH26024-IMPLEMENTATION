from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

from app.models.corrective_action import CorrectiveAction
from app.models.field_evidence import FieldEvidence
from app.models.governance import GovernanceRecommendation
from app.models.governance_point_transaction import GovernancePointTransaction
from app.models.user import User
from app.models.mine import Mine
from app.models.enums import ActionStatus, RecommendationStatus
from app.schemas.governance_score import GovernanceScoreResponse, ComponentScore

class GovernanceScoreService:
    VERSION = "2.0-verified"

    @classmethod
    def calculate_score(cls, db: Session, mine_id: str) -> GovernanceScoreResponse:
        # 1. Fetch Data
        cas = db.query(CorrectiveAction).filter(CorrectiveAction.mine_id == mine_id).all()
        total_cas = len(cas)
        
        recs = db.query(GovernanceRecommendation).filter(GovernanceRecommendation.mine_id == mine_id).all()
        total_recs = len(recs)
        
        # 2. Computations
        resolved_cas = [ca for ca in cas if ca.status in [ActionStatus.COMPLETED, ActionStatus.VERIFIED, ActionStatus.CLOSED]]
        resolved_count = len(resolved_cas)
        
        verified_cas = [ca for ca in cas if ca.status == ActionStatus.VERIFIED]
        verified_count = len(verified_cas)
        
        overdue_or_escalated_cas = [ca for ca in cas if ca.status == ActionStatus.OVERDUE or ca.escalation_level > 0]
        problem_cas_count = len(overdue_or_escalated_cas)
        
        accepted_recs = [rec for rec in recs if rec.status in [RecommendationStatus.ACCEPTED, RecommendationStatus.CONVERTED_TO_ACTION, RecommendationStatus.COMPLETED]]
        accepted_count = len(accepted_recs)
        
        # Field evidence
        if resolved_count > 0:
            resolved_ids = [ca.id for ca in resolved_cas]
            cas_with_evidence = db.query(FieldEvidence.corrective_action_id).filter(
                FieldEvidence.mine_id == mine_id, 
                FieldEvidence.corrective_action_id.in_(resolved_ids)
            ).distinct().count()
        else:
            cas_with_evidence = 0
            
        # 3. Calculate 5 Components
        # C1: Resolution Rate (Max 30)
        c1_score = 30.0
        if total_cas > 0:
            c1_score = (resolved_count / total_cas) * 30.0
            
        # C2: Evidence Rate (Max 20)
        c2_score = 20.0
        if resolved_count > 0:
            c2_score = min(20.0, (cas_with_evidence / resolved_count) * 20.0)
            
        # C3: Verification Rate (Max 20)
        c3_score = 20.0
        if resolved_count > 0:
            c3_score = (verified_count / resolved_count) * 20.0
            
        # C4: On-Time / Escalation Penalty (Max 20)
        c4_score = max(0.0, 20.0 - (problem_cas_count * 5.0))
        
        # C5: Recommendation Acceptance Rate (Max 10)
        c5_score = 10.0
        if total_recs > 0:
            c5_score = (accepted_count / total_recs) * 10.0
            
        total_score = round(c1_score + c2_score + c3_score + c4_score + c5_score, 1)
        
        # 4. Define Level
        if total_score >= 85:
            level = "EXCELLENT"
        elif total_score >= 70:
            level = "GOOD"
        elif total_score >= 50:
            level = "MARGINAL"
        else:
            level = "POOR"
            
        # 5. Explanations
        positives = []
        negatives = []
        
        if c1_score >= 25:
            positives.append(f"Strong resolution rate ({resolved_count}/{total_cas} resolved).")
        elif c1_score < 15:
            negatives.append(f"Poor resolution rate ({total_cas - resolved_count} open actions).")
            
        if c2_score >= 15:
            positives.append("Consistent field evidence submitted for resolved actions.")
        elif c2_score < 10 and resolved_count > 0:
            negatives.append(f"Resolved actions are missing field evidence ({cas_with_evidence}/{resolved_count}).")
            
        if c3_score >= 15:
            positives.append("Supervisors are actively verifying resolved actions.")
        elif c3_score < 10 and resolved_count > 0:
            negatives.append("Many resolved actions lack Supervisor verification.")
            
        if problem_cas_count > 0:
            negatives.append(f"{problem_cas_count} action(s) are overdue or escalated.")
        else:
            positives.append("Zero overdue or escalated actions.")
            
        if c5_score >= 8:
            positives.append("High acceptance rate for AI Recommendations.")
            
        explanation = f"Score of {total_score:.1f}/100 indicates {level} governance compliance."
        
        components = [
            ComponentScore(name="Resolution Rate", score=round(c1_score, 1), max_score=30.0, description="Ratio of resolved actions to total open actions."),
            ComponentScore(name="Evidence Completeness", score=round(c2_score, 1), max_score=20.0, description="Ratio of resolved actions that contain valid field evidence."),
            ComponentScore(name="Supervisor Verification", score=round(c3_score, 1), max_score=20.0, description="Ratio of resolved actions formally verified by a supervisor."),
            ComponentScore(name="On-Time Performance", score=round(c4_score, 1), max_score=20.0, description="Starts at 20, deducts points for overdue and escalated actions."),
            ComponentScore(name="AI Acceptance Rate", score=round(c5_score, 1), max_score=10.0, description="Ratio of AI recommendations accepted or converted to actions.")
        ]
        
        return GovernanceScoreResponse(
            mine_id=mine_id,
            governance_score=total_score,
            governance_level=level,
            component_scores=components,
            calculation_version=cls.VERSION,
            calculated_at=datetime.now(timezone.utc),
            explanation=explanation,
            positive_contributors=positives,
            negative_contributors=negatives
        )

    @classmethod
    def get_leaderboard(cls, db: Session) -> List[Dict[str, Any]]:
        """Returns leaderboard of officers ranked by accumulated governance points"""
        users = db.query(User).all()
        results = []
        
        for u in users:
            total_points = db.query(func.sum(GovernancePointTransaction.points)).filter(
                GovernancePointTransaction.user_id == u.id
            ).scalar() or 0
            
            tx_count = db.query(GovernancePointTransaction).filter(
                GovernancePointTransaction.user_id == u.id
            ).count()
            
            if total_points > 0 or u.role in ["FIELD_OFFICER", "SAFETY_OFFICER", "ENVIRONMENTAL_OFFICER", "MINE_MANAGER", "SUPERVISOR"]:
                mine_name = u.mine.name if u.mine else "Corporate / Headquarters"
                role_val = u.role.value if hasattr(u.role, "value") else str(u.role)
                results.append({
                    "user_id": u.id,
                    "full_name": u.full_name,
                    "email": u.email,
                    "role": role_val,
                    "mine_name": mine_name,
                    "total_points": int(total_points),
                    "activities_count": tx_count
                })
                
        results.sort(key=lambda x: x["total_points"], reverse=True)
        return results

    @classmethod
    def get_point_transactions(cls, db: Session, mine_id: Optional[str] = None, user_id: Optional[str] = None) -> List[Dict[str, Any]]:
        query = db.query(GovernancePointTransaction)
        if mine_id:
            query = query.filter(GovernancePointTransaction.mine_id == mine_id)
        if user_id:
            query = query.filter(GovernancePointTransaction.user_id == user_id)
            
        txs = query.order_by(GovernancePointTransaction.created_at.desc()).limit(50).all()
        return [
            {
                "id": t.id,
                "user_id": t.user_id,
                "user_name": t.user.full_name if t.user else "Unknown",
                "mine_id": t.mine_id,
                "mine_name": t.mine.name if t.mine else "Unknown",
                "points": t.points,
                "category": t.category,
                "reason": t.reason,
                "created_at": t.created_at.isoformat()
            }
            for t in txs
        ]
