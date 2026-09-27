import os
import uuid
import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timezone, timedelta

from app.models.mine import Mine
from app.models.ml import MLModelVersion
from ml.data.generate_ml_data import generate_synthetic_data
from ml.features.feature_engineering import get_features
from ml.training.train_xgboost import extract_training_data, train_model
from ml.anomaly.isolation_forest import train_isolation_forest

@pytest.fixture
def setup_ml_data(client: TestClient, db_session):
    # Create some mines for testing
    from app.models.mine import Mine
    m1 = db_session.query(Mine).filter(Mine.code == "SECL-GEVRA").first().id
    m2 = db_session.query(Mine).filter(Mine.code == "SECL-KUSMUNDA").first().id
    # Generate tiny amount of synthetic data
    generate_synthetic_data(days=60, num_mines=2, db=db_session)
    train_model(db_session)
    train_isolation_forest(db_session)
    
    yield [m1, m2]

def test_synthetic_dataset_generation_and_features(setup_ml_data, db_session):
    mine_id = setup_ml_data[0]
    features = get_features(db_session, mine_id, datetime.now(timezone.utc))
    
    # 2. No missing required features
    required_keys = [
        'safety_incidents_30d', 'safety_incidents_7d', 'critical_incidents_30d', 'high_severity_incidents_30d',
        'pm10_avg_30d', 'pm10_avg_7d', 'pm10_trend', 'open_actions', 'overdue_actions', 'critical_open_actions',
        'current_baseline_risk', 'risk_7d_change'
    ]
    for key in required_keys:
        assert key in features
        assert features[key] is not None
        
    # 3. No future-data leakage
    # We should not see any incidents created AFTER as_of_date
    features_past = get_features(db_session, mine_id, datetime.now(timezone.utc) - timedelta(days=90))
    # Since we only generated 60 days, 90 days ago should be 0 incidents
    assert features_past['safety_incidents_30d'] == 0
    assert features_past['open_actions'] == 0

def test_model_training_and_artifacts(setup_ml_data, db_session):
    # 4, 5. XGBoost training & chronological split (handled in train_model but we test execution)
    train_model(db_session)
    
    # 10. Isolation Forest training
    # Already trained in setup_ml_data, just asserting results
    
    # 6, 12. Model artifact creation and ML model version
    xgb = db_session.query(MLModelVersion).filter(MLModelVersion.model_type == "XGBOOST_CRITICAL_RISK").order_by(MLModelVersion.created_at.desc()).first()
    iso = db_session.query(MLModelVersion).filter(MLModelVersion.model_type == "ISOLATION_FOREST_ANOMALY").order_by(MLModelVersion.created_at.desc()).first()
    
    all_models = db_session.query(MLModelVersion).all()
    if xgb is None:
        print("ALL MODELS:", [(m.id, m.model_type) for m in all_models])
    
    assert xgb is not None
    assert xgb.is_active == True
    assert iso is not None
    assert iso.is_active == True
    
    assert os.path.exists(f"ml/models/xgboost_{xgb.version}.pkl")
    assert os.path.exists(f"ml/models/isolation_forest_{iso.version}.pkl")

def test_ml_endpoints(client: TestClient, setup_ml_data):
    mine_id = setup_ml_data[0]
    
    # 8. Prediction endpoint
    resp = client.post(f"/api/ml/predict/{mine_id}")
    if resp.status_code != 200:
        print("PREDICT ERROR:", resp.text)
    assert resp.status_code == 200
    data = resp.json()
    
    # 7. Probability range 0-1
    assert 0.0 <= data["critical_probability"] <= 1.0
    assert 0 <= data["probability_percent"] <= 100
    assert data["prediction_class"] in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    
    # 11. Anomaly endpoint
    resp_ano = client.post(f"/api/ml/anomaly/{mine_id}")
    if resp_ano.status_code != 200:
        print("ANOMALY ERROR:", resp_ano.text)
    assert resp_ano.status_code == 200
    data_ano = resp_ano.json()
    assert data_ano["anomaly_severity"] in ["NORMAL", "UNUSUAL", "HIGH_ANOMALY"]
    assert "anomaly_score" in data_ano
    
    # 13. Governance triad endpoint
    resp_triad = client.get(f"/api/ml/intelligence/{mine_id}")
    assert resp_triad.status_code == 200
    data_triad = resp_triad.json()
    
    assert "baseline" in data_triad
    assert "prediction" in data_triad
    assert "anomaly" in data_triad
    
    # 14. Invalid mine ID
    resp_inv = client.post("/api/ml/predict/invalid-id")
    assert resp_inv.status_code == 404
