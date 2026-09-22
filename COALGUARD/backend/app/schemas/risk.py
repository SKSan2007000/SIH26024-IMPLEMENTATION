from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime

class MineRiskBase(BaseModel):
    mine_id: str
    overall_risk_score: float = Field(ge=0, le=100)
    safety_score: float = Field(ge=0, le=100)
    recurrence_score: float = Field(ge=0, le=100)
    corrective_action_score: float = Field(ge=0, le=100)
    inspection_score: float = Field(ge=0, le=100)
    environment_score: float = Field(ge=0, le=100)
    documentation_score: float = Field(ge=0, le=100)
    historical_performance_score: float = Field(ge=0, le=100)
    velocity: float = Field(default=0.0)
    data_confidence: float = Field(default=100.0)
    risk_level: str
    calculation_version: str

class MineRiskCreate(MineRiskBase):
    pass

class MineRiskResponse(MineRiskBase):
    id: str
    calculated_at: datetime
    created_at: datetime
    updated_at: datetime

class RiskOverviewItem(BaseModel):
    mine_id: str
    mine_name: str
    overall_risk: float
    risk_level: str
    calculated_at: datetime
    
class WhatIfSimulationRequest(BaseModel):
    critical_safety_incidents_30d: Optional[int] = None
    overdue_corrective_actions: Optional[int] = None
    pm25_level: Optional[float] = None
    pm10_level: Optional[float] = None
    expired_compliance_documents: Optional[int] = None

class WhatIfSimulationResponse(BaseModel):
    baseline_score: float
    simulated_score: float
    baseline_level: str
    simulated_level: str
    absolute_change: float
    percentage_change: float
    factors_changed: List[str]
    simulated_prediction: Optional[Any] = None
    simulated_shap: Optional[Any] = None

class RiskSummaryResponse(BaseModel):
    total_mines: int
    critical_mines: int
    high_risk_mines: int
    medium_risk_mines: int
    low_risk_mines: int
    average_risk: float
    highest_risk_mine: Optional[RiskOverviewItem]
    top_risk_mines: List[RiskOverviewItem]
