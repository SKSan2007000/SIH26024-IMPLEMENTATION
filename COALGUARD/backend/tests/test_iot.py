from app.models.user import User
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.iot import IoTSensor, Telemetry, SensorType

def test_get_sensors(client: TestClient, db_session: Session):
    from app.models.mine import Mine
    test_mine = db_session.query(Mine).first()
    # Create test sensor
    sensor = IoTSensor(
        mine_id=db_session.query(Mine).first().id,
        sensor_name="Test Sensor",
        sensor_type=SensorType.PM10,
        zone="Test Zone",
        unit="µg/m³",
        threshold_warning=50.0,
        threshold_critical=100.0
    )
    db_session.add(sensor)
    db_session.commit()
    db_session.refresh(sensor)

    response = client.get(f"/api/iot/sensors/{db_session.query(Mine).first().id}?user_id={db_session.query(User).first().id}")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["sensor_name"] == "Test Sensor"

def test_generate_telemetry(client: TestClient, db_session: Session):
    from app.models.mine import Mine
    test_mine = db_session.query(Mine).first()
    # This should generate telemetry for the sensor we just added
    # But wait, db_session.query(Mine).first() might be isolated per test if using fixtures properly. Let's ensure a sensor exists.
    sensor = IoTSensor(
        mine_id=db_session.query(Mine).first().id,
        sensor_name="Test Sensor 2",
        sensor_type=SensorType.PM10,
        zone="Test Zone 2",
        unit="µg/m³",
        threshold_warning=50.0,
        threshold_critical=100.0
    )
    db_session.add(sensor)
    db_session.commit()
    db_session.refresh(sensor)
    
    response = client.post(f"/api/iot/demo/generate/{db_session.query(Mine).first().id}?user_id={db_session.query(User).first().id}", json={"sensor_id": "ALL", "event_type": "NORMAL"})
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    
    # Check that a telemetry record was added
    response = client.get(f"/api/iot/telemetry/{sensor.id}?user_id={db_session.query(User).first().id}")
    assert response.status_code == 200
    assert len(response.json()) >= 1
