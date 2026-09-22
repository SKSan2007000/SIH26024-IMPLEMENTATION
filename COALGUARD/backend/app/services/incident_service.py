import uuid
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.incident_report import IncidentReport
from app.models.mine import Mine
from app.models.corrective_action import CorrectiveAction
from app.models.governance import AuditLog
from app.models.enums import IncidentStatus, IncidentSeverity, IncidentCategory, ActionStatus, ActionPriority, AuditEventType
from app.schemas.incident_report import IncidentReportCreate, IncidentReportPublicCreate

class IncidentService:
    @staticmethod
    def create_public_incident(db: Session, incident_in: IncidentReportPublicCreate) -> IncidentReport:
        mine = db.query(Mine).filter(Mine.code == incident_in.mine_code).first()
        if not mine:
            raise HTTPException(status_code=404, detail="Mine not found")
        
        # If anonymous, clear reporter info
        reporter_name = incident_in.reporter_name
        reporter_contact = incident_in.reporter_contact
        if incident_in.is_anonymous:
            reporter_name = None
            reporter_contact = None
            
        report = IncidentReport(
            id=str(uuid.uuid4()),
            mine_id=mine.id,
            category=incident_in.category,
            severity=incident_in.severity,
            description=incident_in.description,
            reporter_name=reporter_name,
            reporter_contact=reporter_contact,
            is_anonymous=incident_in.is_anonymous,
            latitude=incident_in.latitude,
            longitude=incident_in.longitude
        )
        
        db.add(report)
        db.commit()
        db.refresh(report)
        
        IncidentService._process_incident_escalation(db, report)
        return report

    @staticmethod
    def create_authenticated_incident(db: Session, incident_in: IncidentReportCreate, user_id: str) -> IncidentReport:
        mine = db.query(Mine).filter(Mine.id == incident_in.mine_id).first()
        if not mine:
            raise HTTPException(status_code=404, detail="Mine not found")
            
        report = IncidentReport(
            id=str(uuid.uuid4()),
            mine_id=mine.id,
            category=incident_in.category,
            severity=incident_in.severity,
            description=incident_in.description,
            reporter_name=incident_in.reporter_name,
            reporter_contact=incident_in.reporter_contact,
            is_anonymous=incident_in.is_anonymous,
            latitude=incident_in.latitude,
            longitude=incident_in.longitude
        )
        
        db.add(report)
        db.commit()
        db.refresh(report)
        
        # Add audit log for authenticated submission
        audit = AuditLog(
            mine_id=mine.id,
            user_id=user_id,
            event_type=AuditEventType.INCIDENT_SUBMITTED,
            new_status=report.status,
            details={"incident_id": report.id}
        )
        db.add(audit)
        db.commit()
        
        IncidentService._process_incident_escalation(db, report, user_id)
        return report
        
    @staticmethod
    def _process_incident_escalation(db: Session, report: IncidentReport, user_id: str = None):
        if report.severity in [IncidentSeverity.HIGH, IncidentSeverity.CRITICAL]:
            action_priority = ActionPriority.CRITICAL if report.severity == IncidentSeverity.CRITICAL else ActionPriority.HIGH
            
            from app.models.user import User
            from app.models.enums import UserRole
            from datetime import datetime, timezone, timedelta
            
            # Find a safety officer or manager to assign to
            assignee = db.query(User).filter(
                User.mine_id == report.mine_id,
                User.role.in_([UserRole.SAFETY_OFFICER, UserRole.MINE_MANAGER, UserRole.ENVIRONMENTAL_OFFICER])
            ).first()
            assignee_id = assignee.id if assignee else "UNASSIGNED" # Should ideally have someone
            
            # If no one is found, we can query any admin
            if not assignee:
                admin = db.query(User).filter(User.role == UserRole.HEAD_ADMIN).first()
                if admin:
                    assignee_id = admin.id
            
            action = CorrectiveAction(
                id=str(uuid.uuid4()),
                mine_id=report.mine_id,
                title=f"Incident Escalation: {report.category.value}",
                description=report.description,
                issue_type=report.category.value,
                priority=action_priority,
                status=ActionStatus.OPEN,
                assigned_to=assignee_id,
                deadline=datetime.now(timezone.utc) + timedelta(days=1) # 24h deadline for high/critical incidents
            )
            db.add(action)
            db.commit()
            db.refresh(action)
            
            report.linked_action_id = action.id
            db.commit()
            
            # Audit log for escalation
            if not user_id:
                system_user = db.query(User).filter(User.role == UserRole.HEAD_ADMIN).first()
                user_id = system_user.id if system_user else "SYSTEM" # Best effort
                
            audit = AuditLog(
                mine_id=report.mine_id,
                user_id=user_id,
                action_id=action.id,
                event_type=AuditEventType.INCIDENT_ESCALATED,
                new_status=action.status,
                details={"incident_id": report.id, "severity": report.severity.value}
            )
            db.add(audit)
            db.commit()

    @staticmethod
    def update_incident_status(db: Session, report_id: str, new_status: IncidentStatus, user_id: str) -> IncidentReport:
        report = db.query(IncidentReport).filter(IncidentReport.id == report_id).first()
        if not report:
            raise HTTPException(status_code=404, detail="Incident report not found")
            
        old_status = report.status
        report.status = new_status
        db.commit()
        db.refresh(report)
        
        event_type = AuditEventType.INCIDENT_REVIEWED
        if new_status == IncidentStatus.RESOLVED:
            event_type = AuditEventType.INCIDENT_RESOLVED
            
        audit = AuditLog(
            mine_id=report.mine_id,
            user_id=user_id,
            event_type=event_type,
            previous_status=old_status,
            new_status=new_status,
            details={"incident_id": report.id}
        )
        db.add(audit)
        db.commit()
        
        return report
