from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from app.models.enums import RecommendationSource, RecommendationStatus, ActionPriority, AuditEventType

class GovernanceRecommendationBase(BaseModel):
    title: str
    description: str
    reason: str
    priority: ActionPriority
    severity: Optional[str] = None
    recommended_department_id: Optional[str] = None
    recommended_role: Optional[str] = None
    due_date: Optional[datetime] = None

class GovernanceRecommendationCreate(GovernanceRecommendationBase):
    mine_id: str
    source_type: RecommendationSource
    source_reference: Optional[str] = None
    recommendation_type: str
    prediction_id: Optional[str] = None
    model_version: Optional[str] = None
    triggering_features: Optional[Dict[str, Any]] = None

class GovernanceRecommendationResponse(GovernanceRecommendationBase):
    id: str
    mine_id: str
    source_type: RecommendationSource
    source_reference: Optional[str] = None
    recommendation_type: str
    status: RecommendationStatus
    assigned_user_id: Optional[str] = None
    acknowledged_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    rejected_at: Optional[datetime] = None
    escalation_level: int
    prediction_id: Optional[str] = None
    model_version: Optional[str] = None
    triggering_features: Optional[Dict[str, Any]] = None
    linked_action_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class AuditLogResponse(BaseModel):
    id: str
    mine_id: str
    recommendation_id: Optional[str] = None
    action_id: Optional[str] = None
    user_id: str
    event_type: AuditEventType
    previous_status: Optional[str] = None
    new_status: str
    details: Optional[Dict[str, Any]] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class RecommendationActionRequest(BaseModel):
    reason: Optional[str] = None
