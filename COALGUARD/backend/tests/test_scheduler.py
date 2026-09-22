import pytest
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.models.mine import Mine
from app.models.compliance_document import ComplianceDocument
from app.models.corrective_action import CorrectiveAction
from app.models.governance import GovernanceRecommendation, AuditLog
from app.models.mine_risk import MineRisk
from app.models.daily_task import DailyTask
from app.models.user import User
from app.models.enums import (
    UserRole, DocumentStatus, ActionStatus, RecommendationStatus, ActionPriority, AuditEventType, TaskStatus
)
from app.services.task_scheduler_service import TaskSchedulerService

def test_generate_daily_tasks(db_session: Session):
    # Setup test data
    mine = db_session.query(Mine).first()
    safety_officer = db_session.query(User).filter(User.role == UserRole.SAFETY_OFFICER).first()
    today = datetime.now(timezone.utc).date()
    
    # 1. Expired Doc
    doc = ComplianceDocument(
        mine_id=mine.id,
        document_number="DOC-123",
        document_type="LICENSE",
        issue_date=datetime.now(timezone.utc),
        status=DocumentStatus.EXPIRED,
        expiry_date=datetime.now(timezone.utc),
        description="Test Expired Doc"
    )
    db_session.add(doc)
    
    # 2. Open Corrective Action
    action = CorrectiveAction(
        mine_id=mine.id,
        issue_type="SAFETY",
        title="Test Action",
        description="Fix it",
        assigned_to=safety_officer.id,
        priority=ActionPriority.HIGH,
        deadline=datetime.now(timezone.utc),
        status=ActionStatus.OPEN
    )
    db_session.add(action)
    
    # 3. Governance Rec
    rec = GovernanceRecommendation(
        mine_id=mine.id,
        source_type="SHAP",
        recommendation_type="SAFETY",
        reason="Test",
        priority=ActionPriority.HIGH,
        title="Test Rec",
        description="Do this",
        status=RecommendationStatus.RECOMMENDED
    )
    db_session.add(rec)
    
    from app.models.ml import MLModelVersion, AnomalyResult
    # 4. Mine Risk Anomaly
    model_version = MLModelVersion(
        model_type="ISOLATION_FOREST_ANOMALY",
        version="v1.0",
        training_dataset_version="v1",
        feature_count=10,
        is_active=True
    )
    db_session.add(model_version)
    db_session.flush() # To get ID

    risk = AnomalyResult(
        mine_id=mine.id,
        model_version_id=model_version.id,
        anomaly_score=0.9,
        is_anomaly=True,
        anomaly_severity="HIGH_ANOMALY"
    )
    db_session.add(risk)
    
    db_session.commit()

    # Clear existing tasks
    db_session.query(DailyTask).delete()
    db_session.commit()

    # Generate Tasks
    TaskSchedulerService.generate_daily_tasks(db_session)

    # Verify Database State strictly for this mine to avoid seed data pollution
    tasks = db_session.query(DailyTask).filter(DailyTask.mine_id == mine.id).all()
    assert len(tasks) == 4
    roles = {t.role for t in tasks}
    assert UserRole.ENVIRONMENTAL_OFFICER in roles
    assert UserRole.MINE_MANAGER in roles
    assert UserRole.SAFETY_OFFICER in roles

    # Verify Audit Log
    audit = db_session.query(AuditLog).filter(AuditLog.event_type == AuditEventType.DAILY_TASKS_GENERATED).first()
    assert audit is not None
    assert "System generated" in audit.details["description"]

    # Ensure no duplicates on repeated run
    tasks_created_again = TaskSchedulerService.generate_daily_tasks(db_session)
    assert tasks_created_again == 0
    assert db_session.query(DailyTask).filter(DailyTask.mine_id == mine.id).count() == 4

def test_api_generate_endpoint(client):
    response = client.post("/api/tasks/generate-daily")
    assert response.status_code == 200
    data = response.json()
    assert "tasks_generated" in data

def test_api_get_tasks(client):
    response = client.get("/api/tasks")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
