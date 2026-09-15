import pytest
import io
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone

from app.models.mine import Mine
from app.models.user import User
from app.models.corrective_action import CorrectiveAction
from app.models.enums import UserRole, ActionStatus, ActionPriority, AuditEventType
from app.models.governance import AuditLog
from app.models.field_evidence import FieldEvidence

def create_mock_data(db_session: Session):
    mine = db_session.query(Mine).first()
    
    # Check if we already created it (since DB might not reset between tests)
    field_officer = db_session.query(User).filter(User.email == "fo@test.com").first()
    if not field_officer:
        # Create Field Officer
        field_officer = User(
            id="test-field-officer",
            full_name="Test FO",
            email="fo@test.com",
            password_hash="fake",
            role=UserRole.FIELD_OFFICER,
            mine_id=mine.id
        )
        
        # Create another Field Officer
        other_officer = User(
            id="other-field-officer",
            full_name="Other FO",
            email="other@test.com",
            password_hash="fake",
            role=UserRole.FIELD_OFFICER,
            mine_id=mine.id
        )
        
        # Create Supervisor
        supervisor = User(
            id="test-supervisor",
            full_name="Test Sup",
            email="sup@test.com",
            password_hash="fake",
            role=UserRole.MINE_MANAGER,
            mine_id=mine.id
        )
        
        db_session.add_all([field_officer, other_officer, supervisor])
        
        action = CorrectiveAction(
            id="test-action-id",
            mine_id=mine.id,
            title="Fix Vent",
            description="Fix the vent",
            issue_type="SAFETY",
            assigned_to=field_officer.id,
            priority=ActionPriority.HIGH,
            deadline=datetime.now(timezone.utc) + timedelta(days=2),
            status=ActionStatus.IN_PROGRESS
        )
        db_session.add(action)
        db_session.commit()
    else:
        other_officer = db_session.query(User).filter(User.email == "other@test.com").first()
        supervisor = db_session.query(User).filter(User.email == "sup@test.com").first()
        action = db_session.query(CorrectiveAction).filter(CorrectiveAction.id == "test-action-id").first()
    
    # Clean up evidence from previous tests to ensure isolation
    db_session.query(FieldEvidence).delete()
    db_session.commit()
    
    return mine, field_officer, other_officer, supervisor, action


def test_field_evidence_success(client: TestClient, db_session: Session):
    mine, field_officer, _, _, action = create_mock_data(db_session)
    
    file_content = b"fake image content"
    
    response = client.post(
        "/api/field-evidence/",
        data={
            "corrective_action_id": action.id,
            "mine_id": mine.id,
            "submitter_id": field_officer.id,
            "latitude": "-23.123",
            "longitude": "149.123",
            "remarks": "Fixed it"
        },
        files={"photo": ("test.jpg", file_content, "image/jpeg")}
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["corrective_action_id"] == action.id
    assert data["latitude"] == -23.123
    assert data["photo_path"].startswith("/uploads/")
    
    # Check audit log
    audit = db_session.query(AuditLog).filter(AuditLog.event_type == AuditEventType.FIELD_EVIDENCE_SUBMITTED).first()
    assert audit is not None
    assert audit.user_id == field_officer.id


def test_field_evidence_unauthorized_officer(client: TestClient, db_session: Session):
    mine, _, other_officer, _, action = create_mock_data(db_session)
    
    file_content = b"fake image content"
    
    response = client.post(
        "/api/field-evidence/",
        data={
            "corrective_action_id": action.id,
            "mine_id": mine.id,
            "submitter_id": other_officer.id,
            "latitude": "-23.123",
            "longitude": "149.123"
        },
        files={"photo": ("test.jpg", file_content, "image/jpeg")}
    )
    
    assert response.status_code == 403


def test_field_evidence_invalid_gps(client: TestClient, db_session: Session):
    mine, field_officer, _, _, action = create_mock_data(db_session)
    
    file_content = b"fake image content"
    
    response = client.post(
        "/api/field-evidence/",
        data={
            "corrective_action_id": action.id,
            "mine_id": mine.id,
            "submitter_id": field_officer.id,
            "latitude": "-95.0", # invalid
            "longitude": "149.123"
        },
        files={"photo": ("test.jpg", file_content, "image/jpeg")}
    )
    
    assert response.status_code == 400
    assert "latitude" in response.json()["detail"].lower()


def test_field_evidence_invalid_file_type(client: TestClient, db_session: Session):
    mine, field_officer, _, _, action = create_mock_data(db_session)
    
    file_content = b"console.log('hi')"
    
    response = client.post(
        "/api/field-evidence/",
        data={
            "corrective_action_id": action.id,
            "mine_id": mine.id,
            "submitter_id": field_officer.id,
            "latitude": "-23.123",
            "longitude": "149.123"
        },
        files={"photo": ("test.js", file_content, "application/javascript")}
    )
    
    assert response.status_code == 400


def test_field_evidence_oversized_file(client: TestClient, db_session: Session):
    mine, field_officer, _, _, action = create_mock_data(db_session)
    
    # 6MB file
    file_content = b"0" * (6 * 1024 * 1024)
    
    response = client.post(
        "/api/field-evidence/",
        data={
            "corrective_action_id": action.id,
            "mine_id": mine.id,
            "submitter_id": field_officer.id,
            "latitude": "-23.123",
            "longitude": "149.123"
        },
        files={"photo": ("test.jpg", file_content, "image/jpeg")}
    )
    
    assert response.status_code == 400


def test_submit_for_review_without_evidence(client: TestClient, db_session: Session):
    _, field_officer, _, _, action = create_mock_data(db_session)
    
    response = client.post(
        f"/api/field-evidence/{action.id}/submit-for-review",
        data={"submitter_id": field_officer.id}
    )
    
    assert response.status_code == 400


def test_submit_for_review_with_evidence(client: TestClient, db_session: Session):
    mine, field_officer, _, _, action = create_mock_data(db_session)
    
    # First submit evidence
    client.post(
        "/api/field-evidence/",
        data={
            "corrective_action_id": action.id,
            "mine_id": mine.id,
            "submitter_id": field_officer.id,
            "latitude": "-23.123",
            "longitude": "149.123"
        }
    )
    
    # Then submit for review
    response = client.post(
        f"/api/field-evidence/{action.id}/submit-for-review",
        data={"submitter_id": field_officer.id}
    )
    
    assert response.status_code == 200
    
    # Check DB status
    db_session.refresh(action)
    assert action.status == ActionStatus.IN_REVIEW
    
    # Check audit log
    audit = db_session.query(AuditLog).filter(AuditLog.event_type == AuditEventType.ACTION_SUBMITTED_FOR_REVIEW).first()
    assert audit is not None


def test_supervisor_view_evidence(client: TestClient, db_session: Session):
    mine, field_officer, _, supervisor, action = create_mock_data(db_session)
    
    # First submit evidence
    resp = client.post(
        "/api/field-evidence/",
        data={
            "corrective_action_id": action.id,
            "mine_id": mine.id,
            "submitter_id": field_officer.id,
            "latitude": "-23.123",
            "longitude": "149.123"
        }
    )
    evidence_id = resp.json()["id"]
    
    # List evidence
    response = client.get(f"/api/field-evidence/action/{action.id}")
    assert response.status_code == 200
    assert len(response.json()) == 1
    
    # Supervisor gets photo (would be a FileResponse, so we just check status)
    photo_resp = client.get(f"/api/field-evidence/photo/{evidence_id}?user_id={supervisor.id}")
    # If no actual file is written (e.g. photo wasn't provided in the mock post), it returns 404. Let's do it properly
    
    # Submit WITH photo
    resp2 = client.post(
        "/api/field-evidence/",
        data={
            "corrective_action_id": action.id,
            "mine_id": mine.id,
            "submitter_id": field_officer.id,
            "latitude": "-23.123",
            "longitude": "149.123"
        },
        files={"photo": ("test.jpg", b"fake image", "image/jpeg")}
    )
    evidence_id2 = resp2.json()["id"]
    
    photo_resp = client.get(f"/api/field-evidence/photo/{evidence_id2}?user_id={supervisor.id}")
    assert photo_resp.status_code == 200
    assert photo_resp.content == b"fake image"
