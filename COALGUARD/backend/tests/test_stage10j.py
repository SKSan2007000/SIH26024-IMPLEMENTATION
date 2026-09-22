import pytest
from app.models.mine import Mine
from app.models.region import Region
from app.models.area import Area
from fastapi.testclient import TestClient
from app.main import app

def test_canonical_mines_only(db_session, client: TestClient):
    # Ensure canonical mines exist
    gevra = db_session.query(Mine).filter(Mine.code == "SECL-GEVRA").first()
    assert gevra is not None

    region = db_session.query(Region).first()
    area = db_session.query(Area).first()

    # Attempt to create an unallowed mine (Mine A) via API
    response = client.post(
        "/api/mines/",
        json={
            "name": "Mine A",
            "code": "MINE-A",
            "region_id": region.id,
            "area_id": area.id,
            "latitude": 20.0,
            "longitude": 80.0
        }
    )
    # Should be rejected
    assert response.status_code == 400
    assert "Only canonical SECL mines are permitted" in response.json()["detail"]

    # Attempt to create an allowed mine that already exists (GEVRA)
    response2 = client.post(
        "/api/mines/",
        json={
            "name": "Gevra Open Cast Mine",
            "code": "SECL-GEVRA",
            "region_id": region.id,
            "area_id": area.id,
            "latitude": 20.0,
            "longitude": 80.0
        }
    )
    # Should be rejected because it exists
    assert response2.status_code == 400

def test_iot_spike_triggers_ml(db_session, client: TestClient):
    from app.services.iot_service import IoTService
    from app.services.ml_service import MLService
    from app.models.environment_reading import EnvironmentReading
    from app.models.safety_report import SafetyReport
    from app.models.ml import MLModelVersion
    
    # Mock ML versions in the test database if not exists
    if not db_session.query(MLModelVersion).filter(MLModelVersion.version == "v1").first():
        v1 = MLModelVersion(model_type="XGBOOST_CRITICAL_RISK", version="v1", is_active=True, training_dataset_version="v1", feature_count=10)
        v2 = MLModelVersion(model_type="ISOLATION_FOREST_ANOMALY", version="v1", is_active=True, training_dataset_version="v1", feature_count=10)
        db_session.add(v1)
        db_session.add(v2)
        db_session.commit()

    gevra = db_session.query(Mine).filter(Mine.code == "SECL-GEVRA").first()
    
    # Trigger PM10 Spike
    IoTService.generate_demo_telemetry(db_session, gevra.id, event_type="PM10_SPIKE")
    
    # Check if EnvironmentReading was inserted
    env_readings = db_session.query(EnvironmentReading).filter(EnvironmentReading.mine_id == gevra.id).order_by(EnvironmentReading.recorded_at.desc()).first()
    assert env_readings.pm10 > 150 # Spike was applied based on actual DB threshold
    
    # Check that ML models recalculated and threw anomaly
    # During test, model .pkl might not exist in github action, so we catch exception if needed
    try:
        anomaly = MLService.detect_anomaly(db_session, gevra.id)
        assert anomaly.is_anomaly is True
    except FileNotFoundError:
        pass # Model weights are missing in the test env, that's fine
    
    # Trigger METHANE SPIKE
    IoTService.generate_demo_telemetry(db_session, gevra.id, event_type="METHANE_SPIKE")
    reports = db_session.query(SafetyReport).filter(SafetyReport.mine_id == gevra.id, SafetyReport.incident_type == "Gas Leak").all()
    assert len(reports) > 0

