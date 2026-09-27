import pytest
from fastapi.testclient import TestClient

from app.models.mine import Mine
from ml.explainability.shap_explainer import get_human_readable_label

def test_human_readable_labels():
    assert get_human_readable_label("safety_incidents_30d") == "Safety Incidents in Last 30 Days"
    assert get_human_readable_label("unknown_feature") == "Unknown Feature"
    assert get_human_readable_label("critical_open_actions") == "Critical Open Corrective Actions"

from ml.training.train_xgboost import train_model
from ml.data.generate_ml_data import generate_synthetic_data
from app.models.ml import MLModelVersion

@pytest.fixture
def ensure_model(db_session):
    # Check if active model exists
    active = db_session.query(MLModelVersion).filter(MLModelVersion.model_type == "XGBOOST_CRITICAL_RISK", MLModelVersion.is_active == True).first()
    if not active:
        # Create minimal synthetic data and train model
        generate_synthetic_data(days=60, num_mines=1)
        train_model(db_session)

def test_explain_endpoints(client: TestClient, ensure_model, db_session):
    # Find any active mine
    mine = db_session.query(Mine).first()
    if not mine:
        pytest.skip("No mines available for test")
        
    mine_id = mine.id
    
    # Test local explanation
    resp = client.get(f"/api/ml/explain/{mine_id}")
    assert resp.status_code == 200
    data = resp.json()
    
    # Verify structure matches SHAP explainer output
    assert "mine_id" in data
    assert "model_version" in data
    assert "prediction_probability" in data
    assert "top_risk_factors" in data
    assert "top_protective_factors" in data
    assert "all_feature_contributions" in data
    
    # If the XGBoost model hasn't been trained yet (fresh DB), this might return an error key
    if "error" not in data:
        # Verify sorting and classifications
        for factor in data["top_risk_factors"]:
            assert factor["impact_direction"] == "INCREASES_RISK"
            assert factor["shap_value"] > 0
            
        for factor in data["top_protective_factors"]:
            assert factor["impact_direction"] == "REDUCES_RISK"
            assert factor["shap_value"] < 0
            
    # Test invalid mine
    resp_invalid = client.get("/api/ml/explain/invalid-mine-id")
    assert resp_invalid.status_code == 404
    
    # Test global model explanation
    resp_global = client.get("/api/ml/explain/model")
    assert resp_global.status_code == 200
    global_data = resp_global.json()
    assert "model_version" in global_data
    if "error" not in global_data:
        assert "global_feature_importance" in global_data
        assert "samples_explained" in global_data
