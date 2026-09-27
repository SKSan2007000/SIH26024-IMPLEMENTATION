import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import SessionLocal
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
from app.models.enums import (
    UserRole, DepartmentType, MineStatus, IncidentSeverity, IncidentStatus,
    EnvironmentSource, InspectionStatus, DocumentStatus, ActionPriority, ActionStatus
)
import datetime
from datetime import timedelta
from app.core.security import get_password_hash

def seed_db():
    db = SessionLocal()
    
    # 1. Regions
    r1 = Region(name="Northern Region", code="NR")
    r2 = Region(name="Eastern Region", code="ER")
    db.add(r1)
    db.add(r2)
    db.commit()
    db.refresh(r1)
    db.refresh(r2)
    
    # 2. Areas
    a1 = Area(name="Area Alpha", code="A-ALPHA", region_id=r1.id)
    a2 = Area(name="Area Beta", code="A-BETA", region_id=r2.id)
    db.add(a1)
    db.add(a2)
    db.commit()
    db.refresh(a1)
    db.refresh(a2)
    
    # 3. Mines
    m1 = Mine(name="Gevra Open Cast Mine", code="SECL-GEVRA", region_id=r1.id, area_id=a1.id, latitude=22.338, longitude=82.593)
    m2 = Mine(name="Kusmunda Open Cast Mine", code="SECL-KUSMUNDA", region_id=r2.id, area_id=a2.id, latitude=22.332, longitude=82.684)
    m3 = Mine(name="Dipka Open Cast Mine", code="SECL-DIPKA", region_id=r1.id, area_id=a1.id, latitude=22.315, longitude=82.548)
    db.add(m1)
    db.add(m2)
    db.add(m3)
    db.commit()
    db.refresh(m1)
    
    # 4. Departments
    d1 = Department(name="Safety", type=DepartmentType.SAFETY, mine_id=m1.id)
    d2 = Department(name="Environment", type=DepartmentType.ENVIRONMENT, mine_id=m1.id)
    d3 = Department(name="Contractor", type=DepartmentType.CONTRACTOR, mine_id=m1.id)
    d4 = Department(name="Inspection", type=DepartmentType.INSPECTION, mine_id=m1.id)
    d5 = Department(name="Compliance", type=DepartmentType.COMPLIANCE, mine_id=m1.id)
    d6 = Department(name="Corrective Action", type=DepartmentType.CORRECTIVE_ACTION, mine_id=m1.id)
    db.add_all([d1, d2, d3, d4, d5, d6])
    db.commit()
    db.refresh(d1)
    
    # 5. Users
    u1 = User(
        full_name="Admin User", 
        email="admin@coalguard.ai", 
        password_hash=get_password_hash("admin123"), 
        role=UserRole.HEAD_ADMIN
    )
    u2 = User(
        full_name="Safety Officer A", 
        email="safety@coalguard.ai", 
        password_hash=get_password_hash("safety123"), 
        role=UserRole.SAFETY_OFFICER,
        region_id=r1.id,
        area_id=a1.id,
        mine_id=m1.id,
        department_id=d1.id
    )
    db.add(u1)
    db.add(u2)
    db.commit()
    db.refresh(u1)
    db.refresh(u2)
    # --- STAGE 3 SEED DATA ---
    now = datetime.datetime.utcnow()

    # Gevra Open Cast Mine Data (High Risk Profile)
    # Safety
    db.add(SafetyReport(mine_id=m1.id, reported_by=u2.id, incident_type="Equipment Failure", severity=IncidentSeverity.CRITICAL, description="Conveyor belt caught fire.", location="Section 4", incident_date=now - timedelta(days=2), status=IncidentStatus.OPEN))
    db.add(SafetyReport(mine_id=m1.id, reported_by=u2.id, incident_type="Slip/Trip", severity=IncidentSeverity.MEDIUM, description="Worker tripped.", location="Section 1", incident_date=now - timedelta(days=5), status=IncidentStatus.RESOLVED))
    db.add(SafetyReport(mine_id=m1.id, reported_by=u2.id, incident_type="Gas Leak", severity=IncidentSeverity.HIGH, description="Methane spike detected.", location="Section 2", incident_date=now - timedelta(days=1), status=IncidentStatus.UNDER_REVIEW))

    # Environment
    db.add(EnvironmentReading(mine_id=m1.id, pm25=85.5, pm10=140.2, temperature=32.0, humidity=45.0, wind_speed=12.5, wind_direction=180, source=EnvironmentSource.SENSOR, recorded_at=now - timedelta(hours=2)))
    db.add(EnvironmentReading(mine_id=m1.id, pm25=95.1, pm10=160.8, temperature=33.5, humidity=42.0, wind_speed=14.0, wind_direction=190, source=EnvironmentSource.SENSOR, recorded_at=now - timedelta(hours=1)))
    
    # Contractors
    c1 = Contractor(mine_id=m1.id, name="HeavyLift Co.", contractor_code="HL-001", compliance_status="POOR", training_status="INCOMPLETE", certification_status="EXPIRED", certification_expiry=(now - timedelta(days=10)).isoformat(), violation_count=3, performance_score=45.0)
    db.add(c1)

    # Inspections
    db.add(Inspection(mine_id=m1.id, officer_id=u2.id, inspection_type="Monthly Safety Audit", scheduled_date=now - timedelta(days=7), completed_date=now - timedelta(days=6), findings="Multiple violations found in Section 4", severity=IncidentSeverity.HIGH, status=InspectionStatus.COMPLETED))

    # Compliance
    db.add(ComplianceDocument(mine_id=m1.id, document_type="Environmental Clearance", document_number="ENV-2023-A1", issue_date=now - timedelta(days=400), expiry_date=now - timedelta(days=5), status=DocumentStatus.EXPIRED, description="Operating license"))

    # Actions
    db.add(CorrectiveAction(mine_id=m1.id, issue_type="SAFETY", title="Repair Conveyor Belt", description="Replace damaged motors", assigned_to=u2.id, priority=ActionPriority.CRITICAL, deadline=now - timedelta(days=1), status=ActionStatus.OVERDUE))

    # Kusmunda Open Cast Mine Data (Moderate Risk)
    db.add(SafetyReport(mine_id=m2.id, reported_by=u1.id, incident_type="Minor Cut", severity=IncidentSeverity.LOW, description="First aid applied", location="Workshop", incident_date=now - timedelta(days=10), status=IncidentStatus.CLOSED))
    db.add(EnvironmentReading(mine_id=m2.id, pm25=45.0, pm10=80.0, temperature=28.0, humidity=50.0, wind_speed=8.0, wind_direction=90, source=EnvironmentSource.MANUAL, recorded_at=now))
    db.add(Contractor(mine_id=m2.id, name="Diggers Ltd", contractor_code="DL-002", compliance_status="GOOD", training_status="COMPLETE", certification_status="VALID", certification_expiry=(now + timedelta(days=180)).isoformat(), violation_count=0, performance_score=90.0))
    
    db.commit()

    print("DEVELOPMENT SEED DATA INSERTED SUCCESSFULLY.")
    print("WARNING: NEVER USE THESE CREDENTIALS IN PRODUCTION.")
    db.close()

if __name__ == "__main__":
    seed_db()
