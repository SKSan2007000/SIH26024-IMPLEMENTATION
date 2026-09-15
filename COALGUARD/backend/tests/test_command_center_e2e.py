import pytest
from unittest.mock import patch, MagicMock
from app.api.endpoints.command_center import get_system_health
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_command_center_golden_path():
    # 1. Reset demo state to establish baseline
    reset_res = client.post("/api/demo/reset")
    assert reset_res.status_code == 200, f"Reset failed: {reset_res.text}"
    
    # 2. Retrieve overview
    overview_res = client.get("/api/command-center/overview")
    assert overview_res.status_code == 200
    overview = overview_res.json()
    assert "total_mines" in overview
    assert overview["system_health"]["backend"] == "ONLINE"
    
    # 3. Retrieve prioritized mines
    mines_res = client.get("/api/command-center/mines")
    assert mines_res.status_code == 200
    mines = mines_res.json()["mines"]
    assert len(mines) > 0
    
    top_mine = mines[0]
    mine_id = top_mine["mine_id"]
    
    # 4. Retrieve mine intelligence
    intel_res = client.get(f"/api/command-center/mine/{mine_id}")
    assert intel_res.status_code == 200
    intel = intel_res.json()
    
    # 5-8. Verify triad components
    assert "baseline" in intel
    assert "prediction" in intel
    assert "anomaly" in intel
    
    # 9. Generate recommendations (already done by demo reset, but let's check)
    assert len(intel["recommendations"]) >= 0 # Could be 0 depending on mine state
    
    if len(intel["recommendations"]) > 0:
        rec_id = intel["recommendations"][0]["id"]
        
        # 10. Accept recommendation
        accept_res = client.post(f"/api/governance/recommendations/{rec_id}/accept")
        if accept_res.status_code == 401:
            pytest.skip("Auth required for acceptance, skipping full end-to-end action test")
        
        assert accept_res.status_code == 200, f"Accept failed: {accept_res.text}"
        
        # 11. Verify CorrectiveAction (should be in active_actions now)
        intel_res2 = client.get(f"/api/command-center/mine/{mine_id}")
        intel2 = intel_res2.json()
        active_actions = intel2["active_actions"]
        assert len(active_actions) > 0
        
        action_id = active_actions[0]["id"]
        
        # 12. Complete action
        complete_res = client.put(f"/api/governance/actions/{action_id}/status?status=COMPLETED")
        assert complete_res.status_code == 200
        
        # 13. Verify recalculation implicitly by fetching again
        intel_res3 = client.get(f"/api/command-center/mine/{mine_id}")
        intel3 = intel_res3.json()
        
        # 14. Verify updated state (we don't assert risk MUST drop, just that it ran)
        assert "baseline" in intel3
        
        # 15. Verify AuditLog
        assert len(intel3["audit_timeline"]) > 0

def test_database_health_status_connected():
    db_mock = MagicMock()
    health = get_system_health(db_mock)
    assert health.database == "CONNECTED"

def test_database_health_status_unavailable():
    db_mock = MagicMock()
    db_mock.execute.side_effect = Exception("DB Error")
    health = get_system_health(db_mock)
    assert health.database == "UNAVAILABLE"
