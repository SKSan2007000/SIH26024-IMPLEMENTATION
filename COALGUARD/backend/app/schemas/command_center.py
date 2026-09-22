from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Dict, Any
from app.schemas.governance import GovernanceRecommendationResponse, AuditLogResponse
from app.schemas.corrective_action import CorrectiveActionResponse

class SystemHealth(BaseModel):
    backend: str
    database: str
    ml_engine: str
    shap_engine: str
    governance_engine: str

class CommandCenterOverviewResponse(BaseModel):
    total_mines: int
    critical_mines: int
    high_risk_mines: int
    predicted_critical_mines: int
    anomalies_detected: int
    open_actions: int
    overdue_actions: int
    system_health: SystemHealth

class CommandCenterMineItem(BaseModel):
    mine_id: str
    mine_name: str
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    baseline_risk_score: float
    baseline_risk_level: str
    predicted_critical_probability: float
    anomaly_status: str
    anomaly_score: float
    open_action_count: int
    overdue_action_count: int
    priority_indicator: int

    model_config = ConfigDict(from_attributes=True)

class CommandCenterMinesResponse(BaseModel):
    mines: List[CommandCenterMineItem]

class MineIntelligenceResponse(BaseModel):
    mine_id: str
    mine_name: str
    baseline: Dict[str, Any]
    prediction: Dict[str, Any]
    anomaly: Dict[str, Any]
    shap_explanation: Optional[Dict[str, Any]] = None
    recommendations: List[GovernanceRecommendationResponse]
    active_actions: List[CorrectiveActionResponse]
    audit_timeline: List[AuditLogResponse]
    system_status: SystemHealth

    model_config = ConfigDict(from_attributes=True)

class CommandCenterActivityResponse(BaseModel):
    activities: List[AuditLogResponse]

    model_config = ConfigDict(from_attributes=True)
