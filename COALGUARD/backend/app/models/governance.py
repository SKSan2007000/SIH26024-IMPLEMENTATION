import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, ForeignKey, Enum, DateTime, JSON, Integer
from sqlalchemy.orm import relationship
from app.db.base import Base
from app.models.enums import RecommendationSource, RecommendationStatus, ActionPriority, AuditEventType

class GovernanceRecommendation(Base):
    __tablename__ = "governance_recommendations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    mine_id = Column(String, ForeignKey("mines.id"), nullable=False, index=True)
    source_type = Column(Enum(RecommendationSource), nullable=False)
    source_reference = Column(String, nullable=True) # e.g. "XGB_0.85" or an ID
    recommendation_type = Column(String, nullable=False) # Internal key for deduplication
    
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    reason = Column(String, nullable=False)
    
    priority = Column(Enum(ActionPriority), nullable=False)
    severity = Column(String, nullable=True)
    
    recommended_department_id = Column(String, ForeignKey("departments.id"), nullable=True)
    recommended_role = Column(String, nullable=True)
    assigned_user_id = Column(String, ForeignKey("users.id"), nullable=True)
    
    status = Column(Enum(RecommendationStatus), nullable=False, default=RecommendationStatus.RECOMMENDED)
    due_date = Column(DateTime, nullable=True)
    
    acknowledged_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    rejected_at = Column(DateTime, nullable=True)
    
    escalation_level = Column(Integer, default=0)
    
    # Traceability
    prediction_id = Column(String, ForeignKey("ml_predictions.id"), nullable=True)
    model_version = Column(String, nullable=True)
    triggering_features = Column(JSON, nullable=True) # E.g., SHAP snapshot
    linked_action_id = Column(String, ForeignKey("corrective_actions.id"), nullable=True)

    # Relationships
    mine = relationship("Mine")
    recommended_department = relationship("Department")
    assigned_user = relationship("User")
    linked_action = relationship("CorrectiveAction")
    prediction = relationship("Prediction")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    mine_id = Column(String, ForeignKey("mines.id"), nullable=False, index=True)
    recommendation_id = Column(String, ForeignKey("governance_recommendations.id"), nullable=True)
    action_id = Column(String, ForeignKey("corrective_actions.id"), nullable=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    event_type = Column(Enum(AuditEventType), nullable=False)
    previous_status = Column(String, nullable=True)
    new_status = Column(String, nullable=False)
    details = Column(JSON, nullable=True)

    # Relationships
    mine = relationship("Mine")
    recommendation = relationship("GovernanceRecommendation")
    action = relationship("CorrectiveAction")
    user = relationship("User")
