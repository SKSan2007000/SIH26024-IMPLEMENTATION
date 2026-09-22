import sys
import os
import uuid
import datetime
from datetime import timedelta, timezone

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db.session import SessionLocal, engine
from app.db.base import Base
from app.core.security import get_password_hash
from app.models.region import Region
from app.models.area import Area
from app.models.mine import Mine
from app.models.mine_zone import MineZone
from app.models.department import Department
from app.models.user import User
from app.models.safety_report import SafetyReport
from app.models.environment_reading import EnvironmentReading
from app.models.contractor import Contractor
from app.models.inspection import Inspection
from app.models.compliance_document import ComplianceDocument
from app.models.corrective_action import CorrectiveAction
from app.models.field_evidence import FieldEvidence
from app.models.evidence_analysis import EvidenceAnalysis
from app.models.incident_report import IncidentReport
from app.models.daily_task import DailyTask
from app.models.iot import IoTSensor, Telemetry, SensorType, SensorStatus
from app.models.mine_risk import MineRisk
from app.models.ml import MLModelVersion, Prediction, AnomalyResult
from app.models.governance import GovernanceRecommendation, AuditLog
from app.models.timeline_event import TimelineEvent
from app.models.governance_point_transaction import GovernancePointTransaction
from app.models.notification import Notification
from app.models.enums import (
    UserRole, DepartmentType, MineStatus, MineZoneType, RiskLevel,
    IncidentSeverity, IncidentStatus, IncidentCategory, EnvironmentSource,
    InspectionStatus, DocumentStatus, ActionPriority, ActionStatus,
    RecommendationSource, RecommendationStatus, TaskStatus, AuditEventType,
    AnalysisEngine, AnalysisStatus
)
from app.services.risk_service import RiskService

def seed_database():
    print("=" * 60)
    print("STARTING DETERMINISTIC COALGUARD AI SEEDING...")
    print("=" * 60)

    # Drop and recreate all tables for clean schema consistency
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        now = datetime.datetime.now(timezone.utc)

        # 1. Regions
        r_central = Region(name="Central Coalfields Region", code="CCR")
        r_eastern = Region(name="Eastern Coalfields Region", code="ECR")
        db.add_all([r_central, r_eastern])
        db.commit()
        db.refresh(r_central)
        db.refresh(r_eastern)

        # 2. Areas
        a_korba = Area(name="Korba Operational Area", code="AREA-KRB", region_id=r_central.id)
        a_bilaspur = Area(name="Bilaspur Mining Area", code="AREA-BSP", region_id=r_central.id)
        a_dhanbad = Area(name="Dhanbad Mining Area", code="AREA-DHN", region_id=r_eastern.id)
        db.add_all([a_korba, a_bilaspur, a_dhanbad])
        db.commit()
        db.refresh(a_korba)
        db.refresh(a_bilaspur)
        db.refresh(a_dhanbad)

        # 3. 5 Synthetic Mines
        m_alpha = Mine(
            name="Mine Alpha (Gevra Sector)",
            code="MINE-ALPHA",
            region_id=r_central.id,
            area_id=a_korba.id,
            latitude=22.350,
            longitude=82.680,
            mine_type="Open Cast",
            production_category="Category A (High Yield)",
            status="ACTIVE"
        )
        m_beta = Mine(
            name="Mine Beta (Kusmunda Sector)",
            code="MINE-BETA",
            region_id=r_central.id,
            area_id=a_korba.id,
            latitude=22.320,
            longitude=82.690,
            mine_type="Open Cast",
            production_category="Category A (High Yield)",
            status="ACTIVE"
        )
        m_gamma = Mine(
            name="Mine Gamma (Dipka Sector)",
            code="MINE-GAMMA",
            region_id=r_central.id,
            area_id=a_bilaspur.id,
            latitude=22.315,
            longitude=82.550,
            mine_type="Open Cast",
            production_category="Category B (Medium Yield)",
            status="ACTIVE"
        )
        m_delta = Mine(
            name="Mine Delta (Manikpur Sector)",
            code="MINE-DELTA",
            region_id=r_central.id,
            area_id=a_bilaspur.id,
            latitude=22.300,
            longitude=82.720,
            mine_type="Open Cast",
            production_category="Category B (Medium Yield)",
            status="ACTIVE"
        )
        m_omega = Mine(
            name="Mine Omega (Jharia Sector)",
            code="MINE-OMEGA",
            region_id=r_eastern.id,
            area_id=a_dhanbad.id,
            latitude=23.750,
            longitude=86.420,
            mine_type="Underground & Open Cast",
            production_category="Category A (Deep Seam)",
            status="ACTIVE"
        )

        db.add_all([m_alpha, m_beta, m_gamma, m_delta, m_omega])
        db.commit()
        db.refresh(m_alpha)
        db.refresh(m_beta)
        db.refresh(m_gamma)
        db.refresh(m_delta)
        db.refresh(m_omega)

        # 4. Operational Zones for Mine Alpha
        z_pit1 = MineZone(mine_id=m_alpha.id, name="Main Open Pit - Section 4", zone_code="PIT-04", zone_type=MineZoneType.PIT, risk_level=RiskLevel.CRITICAL, latitude=22.352, longitude=82.682, elevation=-45.0, description="Deep extraction pit with active face operations")
        z_haul = MineZone(mine_id=m_alpha.id, name="North-South Haul Road", zone_code="HAUL-01", zone_type=MineZoneType.HAUL_ROAD, risk_level=RiskLevel.HIGH, latitude=22.348, longitude=82.678, elevation=5.0, description="Heavy dumper transport corridor")
        z_proc = MineZone(mine_id=m_alpha.id, name="Coal Handling & Processing Plant", zone_code="CHPP-A", zone_type=MineZoneType.PROCESSING, risk_level=RiskLevel.MEDIUM, latitude=22.345, longitude=82.675, elevation=12.0, description="Crushing, washing, and conveyor loading units")
        z_stock = MineZone(mine_id=m_alpha.id, name="Primary Stockyard", zone_code="STK-01", zone_type=MineZoneType.STOCKYARD, risk_level=RiskLevel.MEDIUM, latitude=22.342, longitude=82.672, elevation=8.0, description="Coal stock stockpiles with water sprinklers")
        z_env = MineZone(mine_id=m_alpha.id, name="Perimeter Environmental Monitoring Station", zone_code="ENV-STN-1", zone_type=MineZoneType.ENVIRONMENTAL, risk_level=RiskLevel.HIGH, latitude=22.355, longitude=82.685, elevation=15.0, description="Continuous ambient air and noise monitoring mast")
        z_worker = MineZone(mine_id=m_alpha.id, name="Worker Administrative & Muster Area", zone_code="ADM-01", zone_type=MineZoneType.WORKER_AREA, risk_level=RiskLevel.LOW, latitude=22.340, longitude=82.670, elevation=10.0, description="Shift muster, safety briefings, and first aid depot")

        db.add_all([z_pit1, z_haul, z_proc, z_stock, z_env, z_worker])

        # Zones for other mines
        db.add_all([
            MineZone(mine_id=m_beta.id, name="Pit West", zone_code="B-PIT-W", zone_type=MineZoneType.PIT, risk_level=RiskLevel.MEDIUM, latitude=22.322, longitude=82.692),
            MineZone(mine_id=m_beta.id, name="Haul Route 2", zone_code="B-HAUL-2", zone_type=MineZoneType.HAUL_ROAD, risk_level=RiskLevel.LOW, latitude=22.318, longitude=82.688),
            MineZone(mine_id=m_gamma.id, name="Central Pit", zone_code="G-PIT-1", zone_type=MineZoneType.PIT, risk_level=RiskLevel.LOW, latitude=22.315, longitude=82.550),
            MineZone(mine_id=m_delta.id, name="Quarry North", zone_code="D-QRY-N", zone_type=MineZoneType.PIT, risk_level=RiskLevel.LOW, latitude=22.300, longitude=82.720),
            MineZone(mine_id=m_omega.id, name="Shaft 3 Pit", zone_code="O-SHF-3", zone_type=MineZoneType.PIT, risk_level=RiskLevel.MEDIUM, latitude=23.750, longitude=86.420),
        ])
        db.commit()

        # 5. Departments for Mine Alpha
        d_safety = Department(name="Safety & Health", type=DepartmentType.SAFETY, mine_id=m_alpha.id)
        d_env = Department(name="Environmental Management", type=DepartmentType.ENVIRONMENT, mine_id=m_alpha.id)
        d_contractor = Department(name="Contractor Governance", type=DepartmentType.CONTRACTOR, mine_id=m_alpha.id)
        d_insp = Department(name="DGMS & Internal Inspections", type=DepartmentType.INSPECTION, mine_id=m_alpha.id)
        d_comp = Department(name="Statutory Compliance", type=DepartmentType.COMPLIANCE, mine_id=m_alpha.id)
        d_action = Department(name="Corrective Action Center", type=DepartmentType.CORRECTIVE_ACTION, mine_id=m_alpha.id)
        db.add_all([d_safety, d_env, d_contractor, d_insp, d_comp, d_action])
        db.commit()
        db.refresh(d_safety)
        db.refresh(d_env)
        db.refresh(d_contractor)
        db.refresh(d_insp)
        db.refresh(d_comp)
        db.refresh(d_action)

        # 6. Deterministic Demo Users (Matching SIH Credentials)
        demo_users_spec = [
            {
                "email": "admin@coalguard.ai",
                "password": "Admin@123",
                "full_name": "Dr. Rajeshwar Sharma (Head Admin)",
                "role": UserRole.HEAD_ADMIN,
                "region_id": None,
                "area_id": None,
                "mine_id": None,
                "department_id": None
            },
            {
                "email": "regional@coalguard.ai",
                "password": "Regional@123",
                "full_name": "A. K. Verma (Regional Manager)",
                "role": UserRole.REGIONAL_MANAGER,
                "region_id": r_central.id,
                "area_id": None,
                "mine_id": None,
                "department_id": None
            },
            {
                "email": "area@coalguard.ai",
                "password": "Area@123",
                "full_name": "P. N. Roy (Area General Manager)",
                "role": UserRole.AREA_MANAGER,
                "region_id": r_central.id,
                "area_id": a_korba.id,
                "mine_id": None,
                "department_id": None
            },
            {
                "email": "manager@coalguard.ai",
                "password": "Manager@123",
                "full_name": "Vikramaditya Rao (Mine Manager)",
                "role": UserRole.MINE_MANAGER,
                "region_id": r_central.id,
                "area_id": a_korba.id,
                "mine_id": m_alpha.id,
                "department_id": None
            },
            {
                "email": "supervisor@coalguard.ai",
                "password": "Supervisor@123",
                "full_name": "B. S. Chawla (Shift Supervisor)",
                "role": UserRole.SUPERVISOR,
                "region_id": r_central.id,
                "area_id": a_korba.id,
                "mine_id": m_alpha.id,
                "department_id": d_action.id
            },
            {
                "email": "safety@coalguard.ai",
                "password": "Safety@123",
                "full_name": "Sunita Mishra (Safety Officer)",
                "role": UserRole.SAFETY_OFFICER,
                "region_id": r_central.id,
                "area_id": a_korba.id,
                "mine_id": m_alpha.id,
                "department_id": d_safety.id
            },
            {
                "email": "environment@coalguard.ai",
                "password": "Environment@123",
                "full_name": "Tanya Sengupta (Environmental Officer)",
                "role": UserRole.ENVIRONMENTAL_OFFICER,
                "region_id": r_central.id,
                "area_id": a_korba.id,
                "mine_id": m_alpha.id,
                "department_id": d_env.id
            },
            {
                "email": "contractor@coalguard.ai",
                "password": "Contractor@123",
                "full_name": "M. K. Patel (Contractor Officer)",
                "role": UserRole.CONTRACTOR_OFFICER,
                "region_id": r_central.id,
                "area_id": a_korba.id,
                "mine_id": m_alpha.id,
                "department_id": d_contractor.id
            },
            {
                "email": "field@coalguard.ai",
                "password": "Field@123",
                "full_name": "Rohan Deshmukh (Field Inspection Officer)",
                "role": UserRole.FIELD_OFFICER,
                "region_id": r_central.id,
                "area_id": a_korba.id,
                "mine_id": m_alpha.id,
                "department_id": d_insp.id
            },
            {
                "email": "auditor@coalguard.ai",
                "password": "Auditor@123",
                "full_name": "K. Somnath (Auditor / DGMS Regulator)",
                "role": UserRole.AUDITOR_REGULATOR,
                "region_id": None,
                "area_id": None,
                "mine_id": None,
                "department_id": None
            },
            # Compatibility Aliases for Local Dev / Tests
            {
                "email": "admin@coalguard.local",
                "password": "admin123",
                "full_name": "Dr. Rajeshwar Sharma (Head Admin)",
                "role": UserRole.HEAD_ADMIN,
                "region_id": None,
                "area_id": None,
                "mine_id": None,
                "department_id": None
            },
            {
                "email": "safety@coalguard.local",
                "password": "safety123",
                "full_name": "Sunita Mishra (Safety Officer)",
                "role": UserRole.SAFETY_OFFICER,
                "region_id": r_central.id,
                "area_id": a_korba.id,
                "mine_id": m_alpha.id,
                "department_id": d_safety.id
            },
            {
                "email": "manager@coalguard.local",
                "password": "manager123",
                "full_name": "Vikramaditya Rao (Mine Manager)",
                "role": UserRole.MINE_MANAGER,
                "region_id": r_central.id,
                "area_id": a_korba.id,
                "mine_id": m_alpha.id,
                "department_id": None
            },
            {
                "email": "supervisor@coalguard.local",
                "password": "supervisor123",
                "full_name": "B. S. Chawla (Shift Supervisor)",
                "role": UserRole.SUPERVISOR,
                "region_id": r_central.id,
                "area_id": a_korba.id,
                "mine_id": m_alpha.id,
                "department_id": d_action.id
            },
            {
                "email": "field@coalguard.local",
                "password": "field123",
                "full_name": "Rohan Deshmukh (Field Inspection Officer)",
                "role": UserRole.FIELD_OFFICER,
                "region_id": r_central.id,
                "area_id": a_korba.id,
                "mine_id": m_alpha.id,
                "department_id": d_insp.id
            }
        ]

        created_users = {}
        for u_spec in demo_users_spec:
            user = User(
                email=u_spec["email"],
                full_name=u_spec["full_name"],
                password_hash=get_password_hash(u_spec["password"]),
                role=u_spec["role"],
                region_id=u_spec["region_id"],
                area_id=u_spec["area_id"],
                mine_id=u_spec["mine_id"],
                department_id=u_spec["department_id"],
                is_active=True
            )
            db.add(user)
            db.flush()
            created_users[u_spec["email"]] = user

        db.commit()

        # Backward compatibility aliases for .local emails
        compat_aliases = [
            ("admin@coalguard.local", "Admin@123", UserRole.HEAD_ADMIN, None),
            ("safety@coalguard.local", "Safety@123", UserRole.SAFETY_OFFICER, m_alpha.id),
            ("manager.gevra@coalguard.local", "Manager@123", UserRole.MINE_MANAGER, m_alpha.id),
            ("auditor@coalguard.local", "Auditor@123", UserRole.AUDITOR_REGULATOR, None),
            ("field.gevra@coalguard.local", "Field@123", UserRole.FIELD_OFFICER, m_alpha.id),
        ]
        for email, pwd, role, mine_id in compat_aliases:
            if not db.query(User).filter(User.email == email).first():
                db.add(User(
                    email=email,
                    full_name=f"Alias: {email}",
                    password_hash=get_password_hash(pwd),
                    role=role,
                    mine_id=mine_id,
                    is_active=True
                ))
        db.commit()

        u_safety = created_users["safety@coalguard.ai"]
        u_field = created_users["field@coalguard.ai"]
        u_manager = created_users["manager@coalguard.ai"]
        u_supervisor = created_users["supervisor@coalguard.ai"]
        u_env = created_users["environment@coalguard.ai"]
        u_contractor = created_users["contractor@coalguard.ai"]

        # 7. Coherent Story Seeding for MINE ALPHA (CRITICAL RISK SCENARIO)
        # Safety Reports: Conveyor Fire (Critical), Repeated Methane Spike (High), Haul Dumper Brake Glitch
        sr1 = SafetyReport(
            mine_id=m_alpha.id,
            reported_by=u_safety.id,
            incident_type="Equipment Failure",
            severity=IncidentSeverity.CRITICAL,
            description="Main conveyor belt motor in Section 4 overheated and triggered a localized belt fire. Belt emergency stop engaged.",
            location="Section 4 - Conveyor Transfer Point B",
            incident_date=now - timedelta(days=2),
            status=IncidentStatus.OPEN
        )
        sr2 = SafetyReport(
            mine_id=m_alpha.id,
            reported_by=u_safety.id,
            incident_type="Gas Leak",
            severity=IncidentSeverity.CRITICAL,
            description="Repeated Methane CH4 concentration spiked to 2.4% (Threshold: 1.0%) near working face bench 3.",
            location="Pit Zone 4 - Bench 3",
            incident_date=now - timedelta(days=1),
            status=IncidentStatus.UNDER_REVIEW
        )
        sr3 = SafetyReport(
            mine_id=m_alpha.id,
            reported_by=u_safety.id,
            incident_type="Equipment Failure",
            severity=IncidentSeverity.HIGH,
            description="Haul dumper HD-104 experienced secondary braking pressure loss on steep decline.",
            location="North-South Haul Road KM 2.4",
            incident_date=now - timedelta(days=5),
            status=IncidentStatus.OPEN
        )
        db.add_all([sr1, sr2, sr3])

        # Environment Readings for Mine Alpha: Hazardous PM10 and PM2.5 Spike
        er1 = EnvironmentReading(
            mine_id=m_alpha.id,
            pm25=98.5,
            pm10=188.0,
            temperature=38.5,
            humidity=41.0,
            wind_speed=18.5,
            wind_direction=210.0,
            source=EnvironmentSource.SENSOR,
            recorded_at=now - timedelta(hours=1)
        )
        er2 = EnvironmentReading(
            mine_id=m_alpha.id,
            pm25=92.0,
            pm10=175.2,
            temperature=37.0,
            humidity=44.0,
            wind_speed=16.0,
            wind_direction=205.0,
            source=EnvironmentSource.SENSOR,
            recorded_at=now - timedelta(hours=3)
        )
        db.add_all([er1, er2])

        # Contractors: HeavyLift Co. has expired clearance and 3 repeated violations
        c_hl = Contractor(
            mine_id=m_alpha.id,
            name="HeavyLift Infrastructure Ltd.",
            contractor_code="HL-KRB-01",
            compliance_status="POOR",
            training_status="INCOMPLETE",
            certification_status="EXPIRED",
            certification_expiry=(now - timedelta(days=15)).isoformat(),
            violation_count=3,
            performance_score=42.0
        )
        c_apex = Contractor(
            mine_id=m_alpha.id,
            name="Apex Drill & Blast Solutions",
            contractor_code="APX-02",
            compliance_status="GOOD",
            training_status="COMPLETE",
            certification_status="VALID",
            certification_expiry=(now + timedelta(days=120)).isoformat(),
            violation_count=0,
            performance_score=88.5
        )
        db.add_all([c_hl, c_apex])

        # Inspections: Overdue Audit Findings
        insp1 = Inspection(
            mine_id=m_alpha.id,
            officer_id=u_safety.id,
            inspection_type="Statutory DGMS Safety Audit",
            scheduled_date=now - timedelta(days=8),
            completed_date=now - timedelta(days=7),
            findings="Critical: Ventilation ducting in Pit Zone 4 torn. Inadequate dust suppression on main haul route.",
            severity=IncidentSeverity.CRITICAL,
            status=InspectionStatus.COMPLETED
        )
        db.add(insp1)

        # Compliance Documents: Operating Environmental Clearance Expired
        doc1 = ComplianceDocument(
            mine_id=m_alpha.id,
            document_type="Environmental Clearance (MoEFCC)",
            document_number="EC-MOEF-2021-9982",
            issue_date=now - timedelta(days=730),
            expiry_date=now - timedelta(days=10),
            status=DocumentStatus.EXPIRED,
            description="Environmental operating clearance for expanded open pit section"
        )
        doc2 = ComplianceDocument(
            mine_id=m_alpha.id,
            document_type="Directorate General of Mines Safety (DGMS) Deep Hole Blasting Permission",
            document_number="DGMS-BLAST-2023-A",
            issue_date=now - timedelta(days=365),
            expiry_date=now + timedelta(days=45),
            status=DocumentStatus.VALID,
            description="Annual authorization for controlled deep hole blasting within 500m of perimeter"
        )
        db.add_all([doc1, doc2])

        # Corrective Actions with SLAs
        ca1 = CorrectiveAction(
            mine_id=m_alpha.id,
            issue_type="SAFETY",
            title="Replace Damaged Conveyor Motor & Thermal Sensors",
            description="Install flameproof motor casing and recalibrate optical heat sensors at Section 4 transfer point.",
            assigned_to=u_field.id,
            priority=ActionPriority.CRITICAL,
            deadline=now - timedelta(hours=6), # Overdue SLA
            status=ActionStatus.ASSIGNED,
            escalation_level=1
        )
        ca2 = CorrectiveAction(
            mine_id=m_alpha.id,
            issue_type="ENVIRONMENT",
            title="Deploy Continuous Water Mist Cannons on North Haul Road",
            description="Suppress active particulate dust spike along KM 2.4 haul route to bring PM10 below 100 μg/m³.",
            assigned_to=u_field.id,
            priority=ActionPriority.HIGH,
            deadline=now + timedelta(hours=8),
            status=ActionStatus.IN_PROGRESS,
            escalation_level=0
        )
        ca3 = CorrectiveAction(
            mine_id=m_alpha.id,
            issue_type="CONTRACTOR",
            title="Suspend HeavyLift Dumper Operations pending Operator Re-training",
            description="HeavyLift drivers must complete mandatory DGMS simulator refresher before haul route re-entry.",
            assigned_to=u_field.id,
            priority=ActionPriority.HIGH,
            deadline=now + timedelta(hours=24),
            status=ActionStatus.OPEN,
            escalation_level=0
        )
        db.add_all([ca1, ca2, ca3])
        db.commit()
        db.refresh(ca1)
        db.refresh(ca2)
        db.refresh(ca3)

        # 8. Seed Field Evidence (Mock sample photo + GPS for ca2 demonstration)
        fe1 = FieldEvidence(
            corrective_action_id=ca2.id,
            mine_id=m_alpha.id,
            submitted_by_user_id=u_field.id,
            photo_path="/uploads/sample_field_evidence.jpg",
            latitude=22.349,
            longitude=82.679,
            accuracy=4.2,
            remarks="Mist cannons deployed and operational at KM 2.4. Water spray suppression active across haul corridor."
        )
        db.add(fe1)
        db.commit()
        db.refresh(fe1)

        # AI Evidence Analysis
        ea1 = EvidenceAnalysis(
            evidence_id=fe1.id,
            ocr_text="DUST SUPPRESSION SYSTEM #04 - ACTIVE WATER SPRAY VERIFIED",
            relevance_score=94.5,
            quality_score=91.0,
            confidence_score=96.0,
            analysis_status=AnalysisStatus.ANALYZED.value,
            analysis_summary="AI Computer Vision confirms mist cannon deployment matches corrective action requirements. High suppression density visible.",
            detected_indicators=["Water Mist Cannons Active", "Dust Suppression Verified", "GPS Location Match", "Operator PPE Compliant"],
            engine=AnalysisEngine.DEMO_ANALYZER.value
        )
        db.add(ea1)

        # 9. IoT Sensors and Telemetry for Mine Alpha
        s_pm10 = IoTSensor(mine_id=m_alpha.id, sensor_name="Perimeter PM10 Air Station", sensor_type=SensorType.PM10, zone="ENV-STN-1", latitude=22.355, longitude=82.685, elevation=15.0, unit="μg/m³", status=SensorStatus.ONLINE, threshold_warning=100.0, threshold_critical=150.0)
        s_pm25 = IoTSensor(mine_id=m_alpha.id, sensor_name="Perimeter PM2.5 Fine Dust Station", sensor_type=SensorType.PM25, zone="ENV-STN-1", latitude=22.355, longitude=82.685, elevation=15.0, unit="μg/m³", status=SensorStatus.ONLINE, threshold_warning=60.0, threshold_critical=90.0)
        s_ch4 = IoTSensor(mine_id=m_alpha.id, sensor_name="Pit 4 Face Methane Detector", sensor_type=SensorType.METHANE, zone="PIT-04", latitude=22.352, longitude=82.682, elevation=-40.0, unit="%", status=SensorStatus.ONLINE, threshold_warning=0.8, threshold_critical=1.5)
        s_vib = IoTSensor(mine_id=m_alpha.id, sensor_name="CHPP Primary Crusher Vibration Mast", sensor_type=SensorType.VIBRATION, zone="CHPP-A", latitude=22.345, longitude=82.675, elevation=12.0, unit="mm/s", status=SensorStatus.ONLINE, threshold_warning=15.0, threshold_critical=25.0)
        s_temp = IoTSensor(mine_id=m_alpha.id, sensor_name="Stockyard Thermal Radiometer", sensor_type=SensorType.TEMPERATURE, zone="STK-01", latitude=22.342, longitude=82.672, elevation=8.0, unit="°C", status=SensorStatus.ONLINE, threshold_warning=45.0, threshold_critical=55.0)
        db.add_all([s_pm10, s_pm25, s_ch4, s_vib, s_temp])
        db.commit()
        db.refresh(s_pm10)
        db.refresh(s_pm25)
        db.refresh(s_ch4)
        db.refresh(s_vib)
        db.refresh(s_temp)

        # Seed 10 recent telemetry records per sensor
        for i in range(10):
            t_time = now - timedelta(minutes=(10 - i) * 15)
            db.add(Telemetry(sensor_id=s_pm10.id, value=145.0 + (i * 3.5), quality="GOOD", timestamp=t_time, generated_at=t_time))
            db.add(Telemetry(sensor_id=s_pm25.id, value=75.0 + (i * 2.2), quality="GOOD", timestamp=t_time, generated_at=t_time))
            db.add(Telemetry(sensor_id=s_ch4.id, value=0.6 + (i * 0.12), quality="GOOD", timestamp=t_time, generated_at=t_time))
            db.add(Telemetry(sensor_id=s_vib.id, value=12.0 + (i * 0.8), quality="GOOD", timestamp=t_time, generated_at=t_time))
            db.add(Telemetry(sensor_id=s_temp.id, value=38.0 + (i * 0.5), quality="GOOD", timestamp=t_time, generated_at=t_time))

        # 10. Public Incident Reports
        p_rep1 = IncidentReport(
            mine_id=m_alpha.id,
            category=IncidentCategory.SAFETY,
            severity=IncidentSeverity.HIGH,
            status=IncidentStatus.UNDER_REVIEW,
            description="Dense fugitive coal dust clouds escaping perimeter fence near residential road junction.",
            reporter_name="Anil Kumar (Local Resident)",
            reporter_contact="+91-98765-43210",
            is_anonymous=False,
            latitude=22.358,
            longitude=82.688,
            linked_action_id=ca2.id
        )
        db.add(p_rep1)

        # 11. Daily Tasks
        dt1 = DailyTask(mine_id=m_alpha.id, role=UserRole.SAFETY_OFFICER, title="Submit Morning Highwall & Pit Inspection", description="Inspect Pit Section 4 bench stability and methane sensors.", status=TaskStatus.PENDING, generation_date=now.date())
        dt2 = DailyTask(mine_id=m_alpha.id, role=UserRole.ENVIRONMENTAL_OFFICER, title="Record PM2.5 & PM10 Ambient Readings", description="Log 24-hour continuous particulate matter levels and water sprinkling coverage.", status=TaskStatus.PENDING, generation_date=now.date())
        dt3 = DailyTask(mine_id=m_alpha.id, role=UserRole.CONTRACTOR_OFFICER, title="Verify Contractor HeavyLift Compliance Status", description="Check insurance and DGMS fitness certificates for transport dumpers.", status=TaskStatus.PENDING, generation_date=now.date())
        dt4 = DailyTask(mine_id=m_alpha.id, role=UserRole.MINE_MANAGER, title="Executive Daily Governance Briefing", description="Review 3 open corrective actions and sign off pending DGMS compliance items.", status=TaskStatus.PENDING, generation_date=now.date())
        db.add_all([dt1, dt2, dt3, dt4])

        # 12. Timeline Events & Audit Logs
        db.add(TimelineEvent(
            mine_id=m_alpha.id,
            department="SAFETY",
            event_type="CRITICAL_INCIDENT",
            title="Conveyor Belt Fire Detected",
            description="Emergency thermal alert triggered at Section 4. Fire localized and contained.",
            severity="CRITICAL",
            user_id=u_safety.id,
            entity_type="SafetyReport",
            entity_id=sr1.id
        ))
        db.add(TimelineEvent(
            mine_id=m_alpha.id,
            department="ENVIRONMENT",
            event_type="ENVIRONMENTAL_SPIKE",
            title="PM10 Particulate Level Exceeded 180 μg/m³",
            description="Ambient dust sensors at North Mast recorded sustained air pollution spike.",
            severity="HIGH",
            user_id=u_env.id,
            entity_type="EnvironmentReading",
            entity_id=er1.id
        ))
        db.add(TimelineEvent(
            mine_id=m_alpha.id,
            department="CORRECTIVE_ACTION",
            event_type="ACTION_ASSIGNED",
            title="Corrective Action Assigned to Field Officer",
            description="Field officer assigned to deploy continuous mist cannons along haul route.",
            severity="MEDIUM",
            user_id=u_manager.id,
            entity_type="CorrectiveAction",
            entity_id=ca2.id
        ))

        # Initial Audit Logs
        db.add(AuditLog(mine_id=m_alpha.id, user_id=u_safety.id, event_type=AuditEventType.INCIDENT_SUBMITTED, new_status="OPEN", details={"incident": "Conveyor Belt Fire"}))
        db.add(AuditLog(mine_id=m_alpha.id, user_id=u_manager.id, event_type=AuditEventType.ACTION_ASSIGNED, new_status="ASSIGNED", action_id=ca1.id, details={"assignee": u_field.full_name}))
        db.add(AuditLog(mine_id=m_alpha.id, user_id=u_field.id, event_type=AuditEventType.FIELD_EVIDENCE_SUBMITTED, new_status="IN_PROGRESS", action_id=ca2.id, details={"evidence_id": fe1.id}))

        # 13. Governance Point Transactions (Seeded initial points)
        db.add(GovernancePointTransaction(user_id=u_safety.id, mine_id=m_alpha.id, points=20, category="VERIFIED_ISSUE_IDENTIFIED", reason="Identified and isolated Section 4 conveyor overheating early"))
        db.add(GovernancePointTransaction(user_id=u_field.id, mine_id=m_alpha.id, points=10, category="DAILY_REPORT", reason="On-time daily field inspection submission"))
        db.add(GovernancePointTransaction(user_id=u_supervisor.id, mine_id=m_alpha.id, points=15, category="SUPERVISOR_VERIFICATION", reason="Quality supervisor review of dust suppression logs"))

        # Notifications
        db.add(Notification(user_id=u_manager.id, title="Critical Risk Alert: Mine Alpha", message="Mine Alpha overall risk score has reached 88.5 (CRITICAL). Immediate intervention required.", is_read=False))
        db.add(Notification(user_id=u_field.id, title="High Priority Corrective Action Assigned", message="You have been assigned Action CA-001: Replace Damaged Conveyor Motor (SLA: 2 hours).", is_read=False))

        # Moderate Seed Data for Mine Beta & Normal data for Gamma, Delta, Omega
        db.add(SafetyReport(mine_id=m_beta.id, reported_by=u_safety.id, incident_type="Minor Slip", severity=IncidentSeverity.LOW, description="Worker slipped on wet metal grating. First aid administered.", location="Workshop 2", incident_date=now - timedelta(days=6), status=IncidentStatus.CLOSED))
        db.add(EnvironmentReading(mine_id=m_beta.id, pm25=42.0, pm10=78.0, temperature=31.0, humidity=55.0, wind_speed=11.0, wind_direction=140.0, source=EnvironmentSource.MANUAL, recorded_at=now))
        db.add(Contractor(mine_id=m_beta.id, name="Diggers Infrastructure Ltd.", contractor_code="DL-01", compliance_status="GOOD", training_status="COMPLETE", certification_status="VALID", certification_expiry=(now + timedelta(days=200)).isoformat(), violation_count=0, performance_score=92.0))

        db.add(EnvironmentReading(mine_id=m_gamma.id, pm25=28.0, pm10=45.0, temperature=28.0, humidity=60.0, wind_speed=8.0, wind_direction=90.0, source=EnvironmentSource.SENSOR, recorded_at=now))
        db.add(EnvironmentReading(mine_id=m_delta.id, pm25=25.0, pm10=40.0, temperature=27.0, humidity=62.0, wind_speed=9.0, wind_direction=80.0, source=EnvironmentSource.SENSOR, recorded_at=now))
        db.add(EnvironmentReading(mine_id=m_omega.id, pm25=55.0, pm10=95.0, temperature=33.0, humidity=50.0, wind_speed=12.0, wind_direction=160.0, source=EnvironmentSource.SENSOR, recorded_at=now))

        db.commit()

        # 14. Train ML Models & Activate
        print("Training and activating baseline XGBoost & Isolation Forest models...")
        from ml.train import train_all_models
        train_all_models()

        # 15. Execute Risk Calculation & ML Predictions across all 5 mines
        print("Calculating initial multi-department fused risk scores...")
        from app.services.ml_service import MLService
        for m in [m_alpha, m_beta, m_gamma, m_delta, m_omega]:
            RiskService.calculate_mine_risk(db, m.id)
            try:
                MLService.predict_critical_risk(db, m.id)
                MLService.detect_anomaly(db, m.id)
            except Exception as e:
                print(f"Initial ML prediction for {m.name}: {e}")

        print("\n" + "=" * 60)
        print("COALGUARD AI SEED DATA SUCCESSFULLY GENERATED!")
        print("=" * 60)
        print("\nDEMO CREDENTIALS READY FOR PRESENTATION:")
        print("1. Head Admin:        admin@coalguard.ai       / Admin@123")
        print("2. Regional Manager:  regional@coalguard.ai    / Regional@123")
        print("3. Area Manager:      area@coalguard.ai        / Area@123")
        print("4. Mine Manager:      manager@coalguard.ai     / Manager@123")
        print("5. Shift Supervisor:  supervisor@coalguard.ai  / Supervisor@123")
        print("6. Safety Officer:    safety@coalguard.ai      / Safety@123")
        print("7. Env. Officer:      environment@coalguard.ai / Environment@123")
        print("8. Contractor Officer:contractor@coalguard.ai  / Contractor@123")
        print("9. Field Officer:     field@coalguard.ai       / Field@123")
        print("10. Auditor/Regulator:auditor@coalguard.ai     / Auditor@123")
        print("=" * 60 + "\n")

    except Exception as e:
        print(f"Error during seeding: {e}")
        db.rollback()
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
