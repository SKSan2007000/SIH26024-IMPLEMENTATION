import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.base import Base
from app.api.deps import get_db

# Import all models to ensure Base.metadata is fully populated
from app.models.region import Region
from app.models.area import Area
from app.models.mine import Mine
from app.models.department import Department
from app.models.user import User
from app.models.safety_report import SafetyReport
from app.models.environment_reading import EnvironmentReading
from app.models.contractor import Contractor
from app.models.inspection import Inspection
from app.models.compliance_document import ComplianceDocument
from app.models.corrective_action import CorrectiveAction
from app.models.governance import GovernanceRecommendation, AuditLog
from app.models.mine_risk import MineRisk
from app.models.ml import Prediction, AnomalyResult, MLModelVersion
from app.models.field_evidence import FieldEvidence

import sys
import os
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "scripts"))

TEST_SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

def override_get_current_user():
    db = TestingSessionLocal()
    from app.models.user import User
    user = db.query(User).filter(User.role == "HEAD_ADMIN").first()
    if not user:
        user = User(id="test-admin", full_name="Test Admin", email="admin@test.com", role="HEAD_ADMIN")
        db.add(user)
        db.commit()
        db.refresh(user)
    db.close()
    return user

from app.api.deps import get_current_user, reusable_oauth2

@pytest.fixture(autouse=True)
def reset_dependency_overrides():
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[reusable_oauth2] = lambda: "test-token"
    app.dependency_overrides[get_current_user] = override_get_current_user
    yield
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[reusable_oauth2] = lambda: "test-token"
    app.dependency_overrides[get_current_user] = override_get_current_user

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    
    # Patch session so seed uses the test DB
    import app.db.session
    original_session = app.db.session.SessionLocal
    app.db.session.SessionLocal = TestingSessionLocal
    
    try:
        from seed import seed_db
        seed_db()
    except Exception as e:
        print(f"Failed to seed test DB: {e}")

    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def client() -> TestClient:
    return TestClient(app)

@pytest.fixture
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
