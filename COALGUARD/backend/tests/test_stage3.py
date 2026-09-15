import uuid
from fastapi.testclient import TestClient

def test_create_safety_report(client: TestClient, db_session):
    uid = str(uuid.uuid4())[:8]
    # setup mine
    from app.models.mine import Mine
    mine = db_session.query(Mine).filter(Mine.code == "SECL-GEVRA").first()
    mine_id = mine.id
    user_id = client.post("/api/users/", json={"full_name": "U1", "email": f"u{uid}@u.com", "password": "p", "role": "SAFETY_OFFICER"}).json()["id"]

    res = client.post("/api/safety-reports/", json={
        "mine_id": mine_id, "reported_by": user_id, "incident_type": "Fire", "severity": "HIGH", "description": "d", "location": "l", "incident_date": "2023-01-01T00:00:00Z"
    })
    assert res.status_code == 201

def test_read_safety_reports(client: TestClient, db_session):
    res = client.get("/api/safety-reports/")
    assert res.status_code == 200
    assert isinstance(res.json(), list)

def test_create_environment_reading(client: TestClient, db_session):
    uid = str(uuid.uuid4())[:8]
    from app.models.mine import Mine
    mine = db_session.query(Mine).filter(Mine.code == "SECL-GEVRA").first()
    mine_id = mine.id

    res = client.post("/api/environment/readings", json={
        "mine_id": mine_id, "pm25": 40.5, "pm10": 100.0
    })
    assert res.status_code == 201

def test_invalid_environment_values(client: TestClient, db_session):
    res = client.post("/api/environment/readings", json={
        "mine_id": "fake", "pm25": -10.0
    })
    assert res.status_code == 422 # Pydantic validation fails for pm25 >= 0

def test_create_contractor(client: TestClient, db_session):
    uid = str(uuid.uuid4())[:8]
    from app.models.mine import Mine
    mine = db_session.query(Mine).filter(Mine.code == "SECL-GEVRA").first()
    mine_id = mine.id

    res = client.post("/api/contractors/", json={
        "mine_id": mine_id, "name": "C1", "contractor_code": f"C-{uid}", "compliance_status": "GOOD", "training_status": "DONE", "certification_status": "VALID", "performance_score": 95.0
    })
    assert res.status_code == 201

def test_create_inspection(client: TestClient, db_session):
    uid = str(uuid.uuid4())[:8]
    from app.models.mine import Mine
    mine = db_session.query(Mine).filter(Mine.code == "SECL-GEVRA").first()
    mine_id = mine.id
    user_id = client.post("/api/users/", json={"full_name": "U1", "email": f"u{uid}@u.com", "password": "p", "role": "SAFETY_OFFICER"}).json()["id"]

    res = client.post("/api/inspections/", json={
        "mine_id": mine_id, "officer_id": user_id, "inspection_type": "Audit", "scheduled_date": "2023-01-01T00:00:00Z"
    })
    assert res.status_code == 201

def test_create_compliance_document(client: TestClient, db_session):
    uid = str(uuid.uuid4())[:8]
    from app.models.mine import Mine
    mine = db_session.query(Mine).filter(Mine.code == "SECL-GEVRA").first()
    mine_id = mine.id

    res = client.post("/api/compliance/documents", json={
        "mine_id": mine_id, "document_type": "Doc", "document_number": f"D-{uid}", "issue_date": "2020-01-01T00:00:00Z", "expiry_date": "2025-01-01T00:00:00Z"
    })
    assert res.status_code == 201

def test_expired_document_detection(client: TestClient, db_session):
    uid = str(uuid.uuid4())[:8]
    from app.models.mine import Mine
    mine = db_session.query(Mine).filter(Mine.code == "SECL-GEVRA").first()
    mine_id = mine.id

    res = client.post("/api/compliance/documents", json={
        "mine_id": mine_id, "document_type": "Doc", "document_number": f"D2-{uid}", "issue_date": "2020-01-01T00:00:00Z", "expiry_date": "2020-01-02T00:00:00Z"
    })
    assert res.status_code == 201
    assert res.json()["status"] == "EXPIRED"

def test_create_corrective_action(client: TestClient, db_session):
    uid = str(uuid.uuid4())[:8]
    from app.models.mine import Mine
    mine = db_session.query(Mine).filter(Mine.code == "SECL-GEVRA").first()
    mine_id = mine.id
    user_id = client.post("/api/users/", json={"full_name": "U1", "email": f"u{uid}@u.com", "password": "p", "role": "SAFETY_OFFICER"}).json()["id"]

    res = client.post("/api/corrective-actions/", json={
        "mine_id": mine_id, "issue_type": "SAFETY", "title": "Fix", "description": "Fix it", "assigned_to": user_id, "priority": "HIGH", "deadline": "2023-01-01T00:00:00Z"
    })
    assert res.status_code == 201

def test_invalid_mine_reference_rejected(client: TestClient, db_session):
    uid = str(uuid.uuid4())[:8]
    user_id = client.post("/api/users/", json={"full_name": "U1", "email": f"u{uid}@u.com", "password": "p", "role": "SAFETY_OFFICER"}).json()["id"]

    res = client.post("/api/corrective-actions/", json={
        "mine_id": "invalid-mine-id", "issue_type": "SAFETY", "title": "Fix", "description": "Fix it", "assigned_to": user_id, "priority": "HIGH", "deadline": "2023-01-01T00:00:00Z"
    })
    assert res.status_code == 400
    assert "mine" in res.json()["detail"].lower()

def test_invalid_assigned_officer_rejected(client: TestClient, db_session):
    uid = str(uuid.uuid4())[:8]
    from app.models.mine import Mine
    mine = db_session.query(Mine).filter(Mine.code == "SECL-GEVRA").first()
    mine_id = mine.id

    res = client.post("/api/corrective-actions/", json={
        "mine_id": mine_id, "issue_type": "SAFETY", "title": "Fix", "description": "Fix it", "assigned_to": "invalid-user", "priority": "HIGH", "deadline": "2023-01-01T00:00:00Z"
    })
    assert res.status_code == 400
    assert "user" in res.json()["detail"].lower()

def test_mine_summary_endpoint(client: TestClient, db_session):
    uid = str(uuid.uuid4())[:8]
    from app.models.mine import Mine
    from app.models.region import Region
    from app.models.area import Area
    reg = db_session.query(Region).first()
    area = db_session.query(Area).first()
    mine = Mine(name="M9", code=f"M9-{uid}", region_id=reg.id, area_id=area.id, latitude=0, longitude=0)
    db_session.add(mine)
    db_session.commit()
    mine_id = mine.id
    res = client.get(f"/api/reports/mine/{mine_id}/summary")
    assert res.status_code == 200
    data = res.json()
    assert data["safety_report_count"] == 0

def test_recent_activity_endpoint(client: TestClient, db_session):
    uid = str(uuid.uuid4())[:8]
    from app.models.mine import Mine
    mine = db_session.query(Mine).filter(Mine.code == "SECL-GEVRA").first()
    mine_id = mine.id

    res = client.get(f"/api/reports/mine/{mine_id}/recent-activity")
    assert res.status_code == 200
    assert isinstance(res.json(), list)
