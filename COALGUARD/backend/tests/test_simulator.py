import pytest
from app.models.mine import Mine
from app.models.mine_risk import MineRisk
from app.models.safety_report import SafetyReport
from app.models.enums import UserRole
from app.services.risk_service import RiskService

def test_simulator_rbac(client, db_session):
    mine = db_session.query(Mine).first()
    RiskService.calculate_mine_risk(db_session, mine.id)
    
    # Unauthorized
    response = client.post(f"/api/risk/simulate/{mine.id}?role=GUEST", json={})
    assert response.status_code == 403
    
def test_simulator_valid(client, db_session):
    mine = db_session.query(Mine).first()
    RiskService.calculate_mine_risk(db_session, mine.id)
    
    # Run simulation
    payload = {
        "critical_safety_incidents_30d": 10,
        "overdue_corrective_actions": 5
    }
    response = client.post(f"/api/risk/simulate/{mine.id}?role=MINE_MANAGER", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    assert data["simulated_score"] > 0
    assert "Critical Safety Incidents: 10" in data["factors_changed"]
    
def test_simulator_negative_values(client, db_session):
    mine = db_session.query(Mine).first()
    RiskService.calculate_mine_risk(db_session, mine.id)
    
    payload = {
        "critical_safety_incidents_30d": -1
    }
    response = client.post(f"/api/risk/simulate/{mine.id}?role=MINE_MANAGER", json=payload)
    assert response.status_code == 422
    
def test_simulator_non_destructive(client, db_session):
    mine = db_session.query(Mine).first()
    RiskService.calculate_mine_risk(db_session, mine.id)
    
    initial_reports = db_session.query(SafetyReport).filter(SafetyReport.mine_id == mine.id).count()
    initial_risks = db_session.query(MineRisk).filter(MineRisk.mine_id == mine.id).count()
    
    payload = {
        "critical_safety_incidents_30d": 50
    }
    response = client.post(f"/api/risk/simulate/{mine.id}?role=MINE_MANAGER", json=payload)
    assert response.status_code == 200
    
    final_reports = db_session.query(SafetyReport).filter(SafetyReport.mine_id == mine.id).count()
    final_risks = db_session.query(MineRisk).filter(MineRisk.mine_id == mine.id).count()
    
    # Assert DB state was NOT modified
    assert initial_reports == final_reports
    assert initial_risks == final_risks
