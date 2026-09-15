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

client = TestClient(app)

@pytest.fixture
def test_mine_user(db_session):
    mine = db_session.query(Mine).filter_by(code="TEST_GOV_M1").first()
    if not mine:
        # We need region/area
        from app.models.region import Region
        from app.models.area import Area
        reg = Region(id="r1gov", name="rgov", code="RGOV")
        area = Area(id="a1gov", name="agov", code="AGOV", region_id="r1gov")
        db_session.add(reg)
        db_session.add(area)
        mine = Mine(id="gov_mine_1", name="Gov Mine", code="TEST_GOV_M1", region_id="r1gov", area_id="a1gov", status="ACTIVE")
        db_session.add(mine)
        
    user = db_session.query(User).filter_by(email="gov@test.com").first()
    if not user:
        user = User(id="gov_user_1", full_name="Gov User", email="gov@test.com", password_hash="hash", role="MINE_MANAGER")
        db_session.add(user)
        
    db_session.commit()
    return mine, user

def test_generate_and_fetch_recommendations(db_session, test_mine_user):
    mine, user = test_mine_user
    
    # We will hit the API to fetch recommendations. 
    # The API calls generate_recommendations, which will find baseline risks.
    # Since there are no baseline risks or ml predictions yet, it might return empty or generate something based on defaults.
    # Let's just create a dummy recommendation to test the endpoints.
    
    rec = GovernanceRecommendation(
        id=f"rec_test_1_{str(uuid.uuid4())[:8]}",
        mine_id=mine.id,
        source_type=RecommendationSource.BASELINE_RISK,
        recommendation_type="BASELINE_HIGH",
        title="Test Rec",
        description="Test Desc",
        reason="Test Reason",
        priority=ActionPriority.HIGH,
        status=RecommendationStatus.RECOMMENDED
    )
    db_session.add(rec)
    db_session.commit()
    
    res = client.get(f"/api/governance/recommendations/{mine.id}")
    assert res.status_code == 200
    data = res.json()
    if len(data) < 1:
        print("RECOMMENDATIONS DATA:", data)
    assert len(data) >= 1
    assert any(r["id"].startswith("rec_test_1") for r in data)

def test_accept_recommendation(db_session, test_mine_user):
    mine, user = test_mine_user
    
    rec = GovernanceRecommendation(
        id=f"rec_test_2_{str(uuid.uuid4())[:8]}",
        mine_id=mine.id,
        source_type=RecommendationSource.XGBOOST,
        recommendation_type="PREDICTION_CRITICAL",
        title="Predictive Rec",
        description="Predictive Desc",
        reason="Predictive Reason",
        priority=ActionPriority.CRITICAL,
        status=RecommendationStatus.RECOMMENDED
    )
    db_session.add(rec)
    db_session.commit()
    
    res = client.post(f"/api/governance/recommendations/{rec.id}/accept")
    if res.status_code != 200:
        print("ACCEPT ERROR:", res.text)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ACCEPTED"
    assert data["linked_action_id"] is not None
    
    # Check if action created
    action_res = client.get(f"/api/governance/actions/{mine.id}")
    assert action_res.status_code == 200
    actions = action_res.json()
    assert any(a["id"] == data["linked_action_id"] for a in actions)

def test_update_action_status(db_session, test_mine_user):
    mine, user = test_mine_user
    
    action = CorrectiveAction(
        id=f"act_test_1_{str(uuid.uuid4())[:8]}",
        mine_id=mine.id,
        issue_type="GOV",
        title="Action Test",
        description="Desc",
        assigned_to=user.id,
        priority=ActionPriority.HIGH,
        deadline=datetime.now(timezone.utc),
        status=ActionStatus.OPEN
    )
    db_session.add(action)
    db_session.commit()
    
    res = client.put(f"/api/governance/actions/{action.id}/status?status=COMPLETED")
    if res.status_code != 200:
        print("STATUS ERROR:", res.text)
    assert res.status_code == 200
    assert res.json()["status"] == "COMPLETED"

def test_demo_escalate():
    res = client.post("/api/governance/demo/escalate?days=10")
    assert res.status_code == 200
    assert "escalated_actions" in res.json()
