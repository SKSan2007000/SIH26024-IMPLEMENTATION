import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.db.base import Base

class MLModelVersion(Base):
    __tablename__ = "ml_model_versions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    model_type = Column(String, nullable=False) # e.g. "XGBOOST_CRITICAL_RISK", "ISOLATION_FOREST_ANOMALY"
    version = Column(String, nullable=False)
    training_dataset_version = Column(String, nullable=False)
    trained_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    feature_count = Column(Integer, nullable=False)
    metrics_json = Column(JSON, nullable=True)
    is_active = Column(Boolean, nullable=False, default=False)

    predictions = relationship("Prediction", back_populates="model_version")
    anomalies = relationship("AnomalyResult", back_populates="model_version")

class Prediction(Base):
    __tablename__ = "ml_predictions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    mine_id = Column(String, ForeignKey("mines.id"), nullable=False, index=True)
    model_version_id = Column(String, ForeignKey("ml_model_versions.id"), nullable=False)
    
    critical_probability = Column(Float, nullable=False)
    prediction_class = Column(String, nullable=False) # LOW, MEDIUM, HIGH, CRITICAL
    prediction_horizon_days = Column(Integer, nullable=False, default=30)
    top_risk_factors = Column(JSON, nullable=True)
    
    # Relationships
    mine = relationship("Mine")
    model_version = relationship("MLModelVersion", back_populates="predictions")

class AnomalyResult(Base):
    __tablename__ = "ml_anomaly_results"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    mine_id = Column(String, ForeignKey("mines.id"), nullable=False, index=True)
    model_version_id = Column(String, ForeignKey("ml_model_versions.id"), nullable=False)
    
    anomaly_score = Column(Float, nullable=False)
    is_anomaly = Column(Boolean, nullable=False, default=False)
    anomaly_severity = Column(String, nullable=False) # NORMAL, UNUSUAL, HIGH_ANOMALY
    
    # Relationships
    mine = relationship("Mine")
    model_version = relationship("MLModelVersion", back_populates="anomalies")
