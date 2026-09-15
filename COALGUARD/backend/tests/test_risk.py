import uuid
from fastapi.testclient import TestClient

from app.models.mine import Mine
from app.models.region import Region
from app.models.area import Area
def test_risk_calculation(client: TestClient, db_session):
    uid = str(uuid.uuid4())[:8]
    reg = db_session.query(Region).first()
    area = db_session.query(Area).first()
    mine = Mine(name="M1", code=f"M-{uid}", region_id=reg.id, area_id=area.id, latitude=0, longitude=0)
    db_session.add(mine)
    db_session.commit()
    mine_id = mine.id
    user_id = client.post("/api/users/", json={"full_name": "U1", "email": f"u{uid}@u.com", "password": "p", "role": "SAFETY_OFFICER"}).json()["id"]

    # Calculate initial risk (should be 0 or LOW)
    res = client.post(f"/api/risk/calculate/{mine_id}")
    assert res.status_code == 200
    assert res.json()["overall_risk_score"] == 0.0
    assert res.json()["risk_level"] == "LOW"

    from datetime import datetime, timezone
    
    # Add a critical safety incident
    client.post("/api/safety-reports/", json={
        "mine_id": mine_id, "reported_by": user_id, "incident_type": "Fire", "severity": "CRITICAL", "description": "d", "location": "l", "incident_date": datetime.now(timezone.utc).isoformat()
    })
    
    # Recalculate risk
    res = client.post(f"/api/risk/calculate/{mine_id}")
    assert res.status_code == 200
    data = res.json()
    assert data["safety_score"] == 100.0
    # Because of Criticality override and action_score=0 (mitigation 40), final risk should be at least 60 (HIGH/MEDIUM)
    assert data["overall_risk_score"] >= 60.0
    assert data["risk_level"] in ["MEDIUM", "HIGH", "CRITICAL"]

def test_risk_history_and_priority(client: TestClient, db_session):
    uid = str(uuid.uuid4())[:8]
    reg = db_session.query(Region).first()
    area = db_session.query(Area).first()
    mine = Mine(name="M2", code=f"M2-{uid}", region_id=reg.id, area_id=area.id, latitude=0, longitude=0)
    db_session.add(mine)
    db_session.commit()
    mine_id = mine.id

    res1 = client.post(f"/api/risk/calculate/{mine_id}")
    res2 = client.post(f"/api/risk/calculate/{mine_id}")
    
    # History should contain 2 records
    history = client.get(f"/api/risk/mine/{mine_id}/history")
    assert history.status_code == 200
    assert len(history.json()) == 2
    
    # Priority
    priority = client.get("/api/risk/priority")
    assert priority.status_code == 200
    assert isinstance(priority.json(), list)

def test_risk_summary(client: TestClient):
    res = client.get("/api/reports/risk-summary")
    assert res.status_code == 200
    assert "critical_mines" in res.json()

def test_completed_action_changes_mine_risk(client: TestClient, db_session):
    """
    Verify mathematical causality:
    completed action -> active action set changes -> corrective_action_score changes 
    -> risk formula changes -> new MineRisk record
    """
    uid = str(uuid.uuid4())[:8]
    # 1. Setup Mine
    reg = db_session.query(Region).first()
    area = db_session.query(Area).first()
    mine = Mine(name="M3", code=f"MM-{uid}", region_id=reg.id, area_id=area.id, latitude=0, longitude=0)
    db_session.add(mine)
    db_session.commit()
    mine_id = mine.id
    user_id = client.post("/api/users/", json={"full_name": "Tester", "email": f"t{uid}@t.com", "password": "p", "role": "SAFETY_OFFICER"}).json()["id"]

    from datetime import datetime, timezone, timedelta
    from app.models.corrective_action import CorrectiveAction
    from app.models.enums import ActionPriority, ActionStatus
    
    # 2. Add Critical Safety Incident (drives safety_score up to 100)
    client.post("/api/safety-reports/", json={
        "mine_id": mine_id, "reported_by": user_id, "incident_type": "Fire", "severity": "CRITICAL", 
        "description": "d", "location": "l", "incident_date": datetime.now(timezone.utc).isoformat()
    })

    # 3. Add an open Corrective Action (drives action_score up)
    action = CorrectiveAction(
        mine_id=mine_id,
        issue_type="GOVERNANCE_AI",
        title="Fix critical safety",
        description="Desc",
        assigned_to=user_id,
        priority=ActionPriority.CRITICAL,
        status=ActionStatus.OPEN,
        deadline=datetime.now(timezone.utc) + timedelta(days=2)
    )
    db_session.add(action)
    db_session.commit()
    db_session.refresh(action)

    # 4. Calculate Risk Before Completion
    res_before = client.post(f"/api/risk/calculate/{mine_id}")
    data_before = res_before.json()
    score_before = data_before["overall_risk_score"]
    action_score_before = data_before["corrective_action_score"]
    time_before = data_before["calculated_at"]
    
    assert data_before["safety_score"] == 100.0, "Safety score should be 100"
    assert action_score_before > 0, "Action score should reflect the open action"

    # 5. Complete the Action via API
    # Assuming governance route isn't authenticated strictly in tests, or we mock auth
    comp_res = client.put(f"/api/governance/actions/{action.id}/status?status=COMPLETED")
    assert comp_res.status_code == 200

    # 6. Calculate Risk After Completion
    # The API call above already triggers recalculation, so we just fetch latest or calculate again
    res_after = client.post(f"/api/risk/calculate/{mine_id}")
    data_after = res_after.json()
    score_after = data_after["overall_risk_score"]
    action_score_after = data_after["corrective_action_score"]
    time_after = data_after["calculated_at"]

    # 7. Assertions
    assert action_score_after < action_score_before, "Action score must decrease after action is completed"
    assert score_after < score_before, "Overall risk score must be materially lower after mitigation"
    assert time_after > time_before, "A new MineRisk record must be generated"

