import pytest
import uuid
import os
from datetime import datetime, timezone
from PIL import Image
from app.models.mine import Mine
from app.models.user import User
from app.models.corrective_action import CorrectiveAction
from app.models.field_evidence import FieldEvidence
from app.models.evidence_analysis import EvidenceAnalysis
from app.models.governance import AuditLog
from app.models.enums import UserRole, ActionStatus, AuditEventType

# Setup some dummy images
os.makedirs("uploads", exist_ok=True)

def create_dummy_image(filename, size=(200, 200), color=(255, 0, 0)):
    filepath = os.path.join("uploads", filename)
    img = Image.new('RGB', size, color=color)
    img.save(filepath)
    return f"/uploads/{filename}"

def create_corrupted_image(filename):
    filepath = os.path.join("uploads", filename)
    with open(filepath, "wb") as f:
        f.write(b"not an image file content")
    return f"/uploads/{filename}"

def create_empty_file(filename):
    filepath = os.path.join("uploads", filename)
    with open(filepath, "wb") as f:
        pass
    return f"/uploads/{filename}"

@pytest.fixture
def setup_data(db_session):
    # Base data
    mine = db_session.query(Mine).first()
    if not mine:
        mine = Mine(id=str(uuid.uuid4()), name="Test Mine", code="TM-01", region_id="r1", area_id="a1")
        db_session.add(mine)

    admin = db_session.query(User).filter(User.role == UserRole.HEAD_ADMIN).first()
    field_officer = User(
        id=str(uuid.uuid4()), 
        full_name="Field Officer", 
        email=f"field_{uuid.uuid4().hex}@test.com", 
        password_hash="dummy", 
        role=UserRole.FIELD_OFFICER, 
        mine_id=mine.id
    )
    db_session.add(field_officer)

    action = CorrectiveAction(
        id=str(uuid.uuid4()),
        mine_id=mine.id,
        title="Test Action",
        description="Test Description",
        issue_type="SAFETY",
        priority="HIGH",
        deadline=datetime.now(timezone.utc),
        assigned_to=field_officer.id,
        status=ActionStatus.IN_REVIEW
    )
    db_session.add(action)
    db_session.commit()

    return {
        "mine": mine,
        "admin": admin,
        "field_officer": field_officer,
        "action": action
    }

def test_analyze_valid_evidence(client, db_session, setup_data):
    # Setup valid evidence
    photo_path = create_dummy_image("valid.jpg", size=(800, 600))
    evidence = FieldEvidence(
        id=str(uuid.uuid4()),
        corrective_action_id=setup_data["action"].id,
        mine_id=setup_data["mine"].id,
        submitted_by_user_id=setup_data["field_officer"].id,
        photo_path=photo_path,
        latitude=0.0,
        longitude=0.0,
        remarks="Test remark"
    )
    db_session.add(evidence)
    db_session.commit()

    response = client.post(
        f"/api/field-evidence/{evidence.id}/analyze",
        data={"user_id": setup_data["admin"].id}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["evidence_id"] == evidence.id
    assert data["analysis_status"] == "ANALYZED"
    assert data["engine"] == "DEMO_ANALYZER"
    assert "relevance_score" in data
    assert "quality_score" in data
    assert data["ocr_text"] == "Test remark"

    # Verify audit log
    audit = db_session.query(AuditLog).filter(AuditLog.event_type == AuditEventType.FIELD_EVIDENCE_ANALYZED).first()
    assert audit is not None
    assert audit.action_id == setup_data["action"].id
    assert audit.details["engine"] == "DEMO_ANALYZER"

def test_analyze_unauthorized_user(client, db_session, setup_data):
    # Create another field officer
    other_officer = User(id=str(uuid.uuid4()), full_name="Other", email=f"o_{uuid.uuid4().hex}@test.com", password_hash="dummy", role=UserRole.FIELD_OFFICER)
    db_session.add(other_officer)
    
    photo_path = create_dummy_image("unauth.jpg")
    evidence = FieldEvidence(
        id=str(uuid.uuid4()),
        corrective_action_id=setup_data["action"].id,
        mine_id=setup_data["mine"].id,
        submitted_by_user_id=setup_data["field_officer"].id,
        photo_path=photo_path,
        latitude=0.0,
        longitude=0.0
    )
    db_session.add(evidence)
    db_session.commit()

    response = client.post(
        f"/api/field-evidence/{evidence.id}/analyze",
        data={"user_id": other_officer.id}
    )
    assert response.status_code == 403

def test_analyze_low_resolution(client, db_session, setup_data):
    photo_path = create_dummy_image("lowres.jpg", size=(50, 50))
    evidence = FieldEvidence(
        id=str(uuid.uuid4()),
        corrective_action_id=setup_data["action"].id,
        mine_id=setup_data["mine"].id,
        submitted_by_user_id=setup_data["field_officer"].id,
        photo_path=photo_path,
        latitude=0.0,
        longitude=0.0
    )
    db_session.add(evidence)
    db_session.commit()

    response = client.post(
        f"/api/field-evidence/{evidence.id}/analyze",
        data={"user_id": setup_data["admin"].id}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["analysis_status"] == "FAILED"
    assert "Extremely low-resolution image" in data["analysis_summary"]

def test_analyze_corrupted_image(client, db_session, setup_data):
    photo_path = create_corrupted_image("corrupt.jpg")
    evidence = FieldEvidence(
        id=str(uuid.uuid4()),
        corrective_action_id=setup_data["action"].id,
        mine_id=setup_data["mine"].id,
        submitted_by_user_id=setup_data["field_officer"].id,
        photo_path=photo_path,
        latitude=0.0,
        longitude=0.0
    )
    db_session.add(evidence)
    db_session.commit()

    response = client.post(
        f"/api/field-evidence/{evidence.id}/analyze",
        data={"user_id": setup_data["admin"].id}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["analysis_status"] == "FAILED"
    assert "Corrupted or unsupported" in data["analysis_summary"]

def test_analyze_missing_evidence(client, db_session, setup_data):
    response = client.post(
        f"/api/field-evidence/invalid-id/analyze",
        data={"user_id": setup_data["admin"].id}
    )
    assert response.status_code == 404

def test_get_evidence_analysis(client, db_session, setup_data):
    photo_path = create_dummy_image("get.jpg")
    evidence = FieldEvidence(
        id=str(uuid.uuid4()),
        corrective_action_id=setup_data["action"].id,
        mine_id=setup_data["mine"].id,
        submitted_by_user_id=setup_data["field_officer"].id,
        photo_path=photo_path,
        latitude=0.0,
        longitude=0.0
    )
    analysis = EvidenceAnalysis(
        evidence_id=evidence.id,
        engine="DEMO_ANALYZER",
        analysis_status="ANALYZED",
        relevance_score=99.0
    )
    db_session.add(evidence)
    db_session.add(analysis)
    db_session.commit()

    response = client.get(f"/api/field-evidence/{evidence.id}/analysis?user_id={setup_data['admin'].id}")
    assert response.status_code == 200
    data = response.json()
    assert data["relevance_score"] == 99.0

def test_repeated_analysis_returns_existing(client, db_session, setup_data):
    photo_path = create_dummy_image("repeated.jpg")
    evidence = FieldEvidence(
        id=str(uuid.uuid4()),
        corrective_action_id=setup_data["action"].id,
        mine_id=setup_data["mine"].id,
        submitted_by_user_id=setup_data["field_officer"].id,
        photo_path=photo_path,
        latitude=0.0,
        longitude=0.0
    )
    db_session.add(evidence)
    db_session.commit()

    r1 = client.post(f"/api/field-evidence/{evidence.id}/analyze", data={"user_id": setup_data["admin"].id})
    r2 = client.post(f"/api/field-evidence/{evidence.id}/analyze", data={"user_id": setup_data["admin"].id})
    
    assert r1.status_code == 200
    assert r2.status_code == 200
    assert r1.json()["id"] == r2.json()["id"]
