from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ComponentScore(BaseModel):
    name: str
    score: float
    max_score: float
    description: str

class GovernanceScoreResponse(BaseModel):
    mine_id: str
    governance_score: float
    governance_level: str
    component_scores: List[ComponentScore]
    calculation_version: str
    calculated_at: datetime
    explanation: str
    positive_contributors: List[str]
    negative_contributors: List[str]
