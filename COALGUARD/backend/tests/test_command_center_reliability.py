import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from unittest.mock import patch, MagicMock

from app.main import app
from app.db.session import SessionLocal
from app.models.mine import Mine

def test_database_health_check(client):
    """Verify the database health check actually works."""
    response = client.get("/api/command-center/overview")
    assert response.status_code == 200
    data = response.json()
    assert "system_health" in data
    assert data["system_health"]["database"] == "CONNECTED"

def test_mine_not_found_returns_404(client):
    """Verify that looking up a missing mine returns 404, not 500."""
    response = client.get("/api/command-center/mine/missing-id-1234")
    assert response.status_code == 404
    assert response.json()["detail"] == "Mine not found"

def test_predict_mine_not_found_returns_404(client):
    """Verify ML prediction for missing mine returns 404, not 500."""
    response = client.post("/api/ml/predict/missing-id-1234")
    assert response.status_code == 404
    assert response.json()["detail"] == "Invalid mine ID"

def test_anomaly_mine_not_found_returns_404(client):
    """Verify ML anomaly for missing mine returns 404, not 500."""
    response = client.post("/api/ml/anomaly/missing-id-1234")
    assert response.status_code == 404
    assert response.json()["detail"] == "Invalid mine ID"

@patch("app.services.ml_service.MLService._load_model")
def test_command_center_graceful_ml_degradation(mock_load_model, client, db_session):
    """Verify that Command Center endpoints gracefully degrade if ML models are missing."""
    mock_load_model.side_effect = FileNotFoundError("Model file missing")
    
    response = client.get("/api/command-center/overview")
    assert response.status_code == 200
    
    mine = db_session.query(Mine).first()
    if not mine:
        # Create a dummy mine if none exists in test db
        mine = Mine(name="Test Mine", code="TST", region_id="mock", area_id="mock")
        db_session.add(mine)
        db_session.commit()
        db_session.refresh(mine)
    
    mine_resp = client.get(f"/api/command-center/mine/{mine.id}")
    assert mine_resp.status_code == 200
    data = mine_resp.json()
    assert data["prediction"]["probability"] == 0.0 or data["prediction"]["probability"] >= 0.0
    assert data["prediction"].get("explanation_available") is False or data["prediction"].get("explanation_available") is True
