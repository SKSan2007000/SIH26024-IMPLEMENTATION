import pytest
import uuid
import os
from datetime import datetime, timezone
from app.models.mine import Mine
from app.models.user import User
from app.models.incident_report import IncidentReport
from app.models.corrective_action import CorrectiveAction
from app.models.governance import AuditLog
from app.models.enums import UserRole, IncidentCategory, IncidentSeverity, IncidentStatus, ActionStatus, AuditEventType

@pytest.fixture
def setup_data(db_session):
    # Setup Mine
    mine = db_session.query(Mine).filter(Mine.code == "TM-01").first()
    if not mine:
        mine = Mine(id=str(uuid.uuid4()), name="Test Mine", code="TM-01", region_id="r1", area_id="a1")
        db_session.add(mine)

    # Setup User
    field_officer = User(
        id=str(uuid.uuid4()), 
        full_name="Field Officer", 
        email=f"field_{uuid.uuid4().hex}@test.com", 
        password_hash="dummy", 
        role=UserRole.FIELD_OFFICER, 
        mine_id=mine.id
    )
    db_session.add(field_officer)
    
    manager = User(
        id=str(uuid.uuid4()), 
        full_name="Mine Manager", 
        email=f"manager_{uuid.uuid4().hex}@test.com", 
        password_hash="dummy", 
        role=UserRole.MINE_MANAGER, 
        mine_id=mine.id
    )
    db_session.add(manager)
    db_session.commit()
    
    return {
        "mine": mine,
        "officer": field_officer,
        "manager": manager
    }

def test_submit_public_incident(client, db_session, setup_data):
    mine = setup_data["mine"]
    payload = {
        "mine_code": mine.code,
        "category": "SAFETY",
        "severity": "LOW",
        "description": "I saw a loose wire on the ground. It looks dangerous.",
        "reporter_name": "John Doe",
        "reporter_contact": "john@example.com",
        "is_anonymous": False,
        "latitude": 34.0522,
        "longitude": -118.2437
    }
    
    response = client.post("/api/incident-reports/public", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    assert data["category"] == "SAFETY"
    assert data["severity"] == "LOW"
    assert data["status"] == "OPEN"
    assert data["mine_id"] == mine.id
    
    # Check DB
    report = db_session.query(IncidentReport).filter(IncidentReport.id == data["id"]).first()
    assert report is not None
    assert report.reporter_name == "John Doe"

def test_submit_anonymous_incident(client, db_session, setup_data):
    mine = setup_data["mine"]
    payload = {
        "mine_code": mine.code,
        "category": "ENVIRONMENT",
        "severity": "MEDIUM",
        "description": "Oil spill near the river bank.",
        "reporter_name": "Secret Guy", # should be cleared
        "reporter_contact": "secret@example.com",
        "is_anonymous": True
    }
    
    response = client.post("/api/incident-reports/public", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    report = db_session.query(IncidentReport).filter(IncidentReport.id == data["id"]).first()
    assert report.reporter_name is None
    assert report.reporter_contact is None

def test_submit_critical_incident_escalation(client, db_session, setup_data):
    mine = setup_data["mine"]
    payload = {
        "mine_code": mine.code,
        "category": "EQUIPMENT",
        "severity": "CRITICAL",
        "description": "The main ventilation fan has stopped working completely.",
        "is_anonymous": True
    }
    
    response = client.post("/api/incident-reports/public", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    # Check if CorrectiveAction was created
    report = db_session.query(IncidentReport).filter(IncidentReport.id == data["id"]).first()
    assert report.linked_action_id is not None
    
    action = db_session.query(CorrectiveAction).filter(CorrectiveAction.id == report.linked_action_id).first()
    assert action is not None
    assert action.priority.value == "CRITICAL"
    assert action.status.value == "OPEN"
    
    # Check Audit log
    audit = db_session.query(AuditLog).filter(AuditLog.event_type == AuditEventType.INCIDENT_ESCALATED, AuditLog.mine_id == mine.id).order_by(AuditLog.created_at.desc()).first()
    assert audit is not None
    assert audit.action_id == action.id

def test_authenticated_submission_and_get(client, db_session, setup_data):
    officer = setup_data["officer"]
    mine = setup_data["mine"]
    
    payload = {
        "mine_id": mine.id,
        "category": "COMPLIANCE",
        "severity": "MEDIUM",
        "description": "Safety logs have not been filled out for 3 days."
    }
    
    response = client.post(f"/api/incident-reports/?user_id={officer.id}", json=payload)
    assert response.status_code == 200
    report_id = response.json()["id"]
    
    # Fetch it as manager
    manager = setup_data["manager"]
    
    response = client.get(f"/api/incident-reports/mine/{mine.id}?user_id={manager.id}")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert any(r["id"] == report_id for r in data)
    
    # Update status
    response = client.put(f"/api/incident-reports/{report_id}/status?user_id={manager.id}", json={"status": "UNDER_REVIEW"})
    assert response.status_code == 200
    assert response.json()["status"] == "UNDER_REVIEW"
