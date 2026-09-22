import sys
import os
sys.path.insert(0, os.path.abspath('.'))

from app.db.session import SessionLocal
from app.models.mine import Mine
from app.models.mine_risk import MineRisk
from app.models.iot import IoTSensor, Telemetry
from app.models.corrective_action import CorrectiveAction
from app.models.field_evidence import FieldEvidence
from app.models.evidence_analysis import EvidenceAnalysis
from app.models.risk_recalculation import RiskRecalculation
from app.models.governance import GovernanceRecommendation, AuditLog
from app.models.governance_point_transaction import GovernancePointTransaction
from app.models.compliance_document import ComplianceDocument
from app.models.safety_report import SafetyReport
from app.models.contractor import Contractor
from app.models.inspection import Inspection
from app.models.incident_report import IncidentReport
from app.models.timeline_event import TimelineEvent
from app.models.user import User

db = SessionLocal()
print('=== DATABASE STATE AUDIT ===')
print('Users count:', db.query(User).count())
for u in db.query(User).limit(5).all():
    print(f'  - User: {u.email} ({u.role})')

print('\nMines count:', db.query(Mine).count())
for m in db.query(Mine).all():
    print(f'  - Mine: [{m.id}] {m.name} ({m.code}) | Lat/Lng: ({m.latitude}, {m.longitude}) | Status: {m.status}')

print('\nMineRisks count:', db.query(MineRisk).count())
for r in db.query(MineRisk).limit(5).all():
    print(f'  - Risk for Mine {r.mine_id}: Overall={r.overall_risk_score}, Safety={r.safety_score}, Env={r.environment_score}, Level={r.risk_level}, Velocity={r.velocity}')

print('\nIoTSensors count:', db.query(IoTSensor).count())
for s in db.query(IoTSensor).limit(5).all():
    print(f'  - Sensor: [{s.id}] {s.sensor_name} ({s.sensor_type.value if hasattr(s.sensor_type, "value") else s.sensor_type}) | Zone: {s.zone} | Thresholds: Warn={s.threshold_warning}, Crit={s.threshold_critical}')

print('\nTelemetryReadings count:', db.query(Telemetry).count())
for t in db.query(Telemetry).limit(3).all():
    print(f'  - Telemetry: Sensor {t.sensor_id} = {t.value} @ {t.timestamp}')

print('\nGovernanceRecommendations count:', db.query(GovernanceRecommendation).count())
for gr in db.query(GovernanceRecommendation).limit(5).all():
    print(f'  - Rec: [{gr.id}] {gr.title} | Severity: {gr.severity} | Status: {gr.status}')

print('\nCorrectiveActions count:', db.query(CorrectiveAction).count())
for ca in db.query(CorrectiveAction).limit(5).all():
    print(f'  - Action: [{ca.id}] {ca.title} | Status: {ca.status} | Priority: {ca.priority}')

print('\nFieldEvidence count:', db.query(FieldEvidence).count())
for fe in db.query(FieldEvidence).limit(5).all():
    print(f'  - Evidence: [{fe.id}] Photo: {fe.photo_path} | Lat/Lng: ({fe.latitude}, {fe.longitude}) | Action: {fe.corrective_action_id}')

print('\nEvidenceAnalysis count:', db.query(EvidenceAnalysis).count())
for ea in db.query(EvidenceAnalysis).limit(5).all():
    print(f'  - Analysis: [{ea.id}] Status: {ea.analysis_status} | Relevance: {ea.relevance_score}% | Summary: {ea.analysis_summary[:60]}...')

print('\nRiskRecalculations count:', db.query(RiskRecalculation).count())
for rr in db.query(RiskRecalculation).limit(5).all():
    print(f'  - Recalc: [{rr.id}] Before={rr.risk_before}, After={rr.risk_after}, Delta={rr.risk_delta} | Action: {rr.action_id}')

print('\nGovernancePointTransactions count:', db.query(GovernancePointTransaction).count())
for gp in db.query(GovernancePointTransaction).limit(5).all():
    print(f'  - Points: [{gp.id}] User {gp.user_id}: +{gp.points} ({gp.category}) - {gp.reason}')

print('\nComplianceDocuments count:', db.query(ComplianceDocument).count())
for cd in db.query(ComplianceDocument).limit(3).all():
    print(f'  - Doc: [{cd.id}] {cd.document_number} ({cd.document_type}) Expiry: {cd.expiry_date} Status: {cd.status}')

print('\nSafetyReports count:', db.query(SafetyReport).count())
for sr in db.query(SafetyReport).limit(3).all():
    print(f'  - Safety: [{sr.id}] {sr.incident_type} ({sr.severity}) - {sr.description[:40]}...')

print('\nContractors count:', db.query(Contractor).count())
for c in db.query(Contractor).limit(3).all():
    print(f'  - Contractor: [{c.id}] {c.name} ({c.contractor_code}) | Status: {c.compliance_status} | Score: {c.performance_score}')

print('\nInspections count:', db.query(Inspection).count())
for ins in db.query(Inspection).limit(3).all():
    print(f'  - Inspection: [{ins.id}] {ins.inspection_type} ({ins.status}) - {ins.findings}')

print('\nIncidentReports count:', db.query(IncidentReport).count())
for ir in db.query(IncidentReport).limit(3).all():
    print(f'  - Incident: [{ir.id}] {ir.category} ({ir.severity}) - {ir.description[:40]}...')

print('\nAuditLogs count:', db.query(AuditLog).count())
for al in db.query(AuditLog).limit(3).all():
    print(f'  - Audit: [{al.id}] Event: {al.event_type} | Prev: {al.previous_status} -> New: {al.new_status} | User: {al.user_id}')

print('\nTimelineEvents count:', db.query(TimelineEvent).count())
for te in db.query(TimelineEvent).limit(3).all():
    print(f'  - Event: [{te.id}] {te.title} ({te.department} - {te.event_type}) @ {te.created_at}')

db.close()
