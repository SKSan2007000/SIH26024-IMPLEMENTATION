from fastapi.testclient import TestClient
from datetime import datetime, timezone, timedelta
import uuid
import pytest
from app.main import app
from app.models.enums import RecommendationSource, RecommendationStatus, ActionPriority, ActionStatus
from app.models.governance import GovernanceRecommendation, AuditLog
from app.models.corrective_action import CorrectiveAction
from app.models.mine import Mine
from app.models.user import User
from app.api.endpoints.governance import get_current_user

client = TestClient(app)

@pytest.fixture
def test_mine(db_session):
    mine = db_session.query(Mine).filter_by(code="TEST_GOV_GATE").first()
    if not mine:
        from app.models.region import Region
        from app.models.area import Area
        reg = Region(id="r1govg", name="rgovg", code="RGOVG")
        area = Area(id="a1govg", name="agovg", code="AGOVG", region_id="r1govg")
        db_session.add(reg)
        db_session.add(area)
        mine = Mine(id="gov_mine_gate", name="Gov Mine Gate", code="TEST_GOV_GATE", region_id="r1govg", area_id="a1govg", status="ACTIVE")
        db_session.add(mine)
        db_session.commit()
    return mine

def create_action(db_session, mine_id):
    action = CorrectiveAction(
        id=f"act_gate_{str(uuid.uuid4())[:8]}",
        mine_id=mine_id,
        issue_type="GOV",
        title="Action Test Gate",
        description="Desc",
        assigned_to="dummy",
        priority=ActionPriority.HIGH,
        deadline=datetime.now(timezone.utc),
        status=ActionStatus.OPEN
    )
    db_session.add(action)
    db_session.commit()
    db_session.refresh(action)
    return action

@pytest.fixture(autouse=True)
def clear_overrides():
    yield
    if get_current_user in app.dependency_overrides:
        del app.dependency_overrides[get_current_user]

def test_field_officer_in_review_allowed(db_session, test_mine):
    action = create_action(db_session, test_mine.id)
    user = User(id="fo_user", role="FIELD_OFFICER", email="fo@test.com", password_hash="hash")
    app.dependency_overrides[get_current_user] = lambda: user
    
    res = client.put(f"/api/governance/actions/{action.id}/status?status=IN_REVIEW")
    assert res.status_code == 200
    assert res.json()["status"] == "IN_REVIEW"

def test_field_officer_completed_rejected(db_session, test_mine):
    action = create_action(db_session, test_mine.id)
    user = User(id="fo_user", role="FIELD_OFFICER", email="fo@test.com", password_hash="hash")
    app.dependency_overrides[get_current_user] = lambda: user
    
    res = client.put(f"/api/governance/actions/{action.id}/status?status=COMPLETED")
    assert res.status_code == 400
    assert "FIELD_OFFICER is not authorized" in res.json()["detail"]

def test_field_officer_verified_rejected(db_session, test_mine):
    action = create_action(db_session, test_mine.id)
    user = User(id="fo_user", role="FIELD_OFFICER", email="fo@test.com", password_hash="hash")
    app.dependency_overrides[get_current_user] = lambda: user
    
    res = client.put(f"/api/governance/actions/{action.id}/status?status=VERIFIED")
    assert res.status_code == 400
    assert "FIELD_OFFICER is not authorized" in res.json()["detail"]

def test_mine_manager_verified_allowed(db_session, test_mine):
    action = create_action(db_session, test_mine.id)
    user = User(id="mm_user", role="MINE_MANAGER", email="mm@test.com", password_hash="hash")
    app.dependency_overrides[get_current_user] = lambda: user
    
    res = client.put(f"/api/governance/actions/{action.id}/status?status=VERIFIED")
    assert res.status_code == 200
    assert res.json()["status"] == "VERIFIED"
    
    # Verify AuditLog is created
    logs = db_session.query(AuditLog).filter(AuditLog.action_id == action.id).all()
    assert len(logs) > 0
    assert any(log.new_status == "VERIFIED" for log in logs)

def test_unauthorized_role_verified_rejected(db_session, test_mine):
    action = create_action(db_session, test_mine.id)
    user = User(id="au_user", role="AUDITOR_REGULATOR", email="au@test.com", password_hash="hash")
    app.dependency_overrides[get_current_user] = lambda: user
    
    res = client.put(f"/api/governance/actions/{action.id}/status?status=VERIFIED")
    assert res.status_code == 400
    assert "is not authorized" in res.json()["detail"]

def test_invalid_status_transition_completed_to_open(db_session, test_mine):
    action = create_action(db_session, test_mine.id)
    user = User(id="mm_user", role="MINE_MANAGER", email="mm@test.com", password_hash="hash")
    app.dependency_overrides[get_current_user] = lambda: user
    
    client.put(f"/api/governance/actions/{action.id}/status?status=COMPLETED")
    
    res = client.put(f"/api/governance/actions/{action.id}/status?status=OPEN")
    assert res.status_code == 400
    assert "Cannot change status" in res.json()["detail"]
