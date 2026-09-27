from sqlalchemy.orm import Session
from datetime import datetime, timezone
import logging

from app.models.mine import Mine
from app.models.daily_task import DailyTask
from app.models.enums import UserRole, TaskStatus, DocumentStatus, ActionStatus, RecommendationStatus
from app.models.compliance_document import ComplianceDocument
from app.models.corrective_action import CorrectiveAction
from app.models.governance import GovernanceRecommendation, AuditLog
from app.models.mine_risk import MineRisk
from app.models.enums import AuditEventType

logger = logging.getLogger(__name__)

class TaskSchedulerService:
    @staticmethod
    def generate_daily_tasks(db: Session):
        """
        Generates daily tasks for all mines. Runs gracefully.
        """
        try:
            mines = db.query(Mine).all()
            today = datetime.now(timezone.utc).date()
            tasks_created = 0

            for mine in mines:
                # 1. Compliance Documents (Expired)
                expired_docs = db.query(ComplianceDocument).filter(
                    ComplianceDocument.mine_id == mine.id,
                    ComplianceDocument.status == DocumentStatus.EXPIRED
                ).all()

                if expired_docs:
                    if not TaskSchedulerService._task_exists(db, mine.id, UserRole.ENVIRONMENTAL_OFFICER, today, "Review Expired Compliance Documents"):
                        TaskSchedulerService._create_task(db, mine.id, UserRole.ENVIRONMENTAL_OFFICER, "Review Expired Compliance Documents", f"{len(expired_docs)} document(s) have expired and require immediate attention.", today)
                        tasks_created += 1

                # 2. Corrective Actions (Open/Overdue)
                open_actions = db.query(CorrectiveAction).filter(
                    CorrectiveAction.mine_id == mine.id,
                    CorrectiveAction.status.in_([ActionStatus.OPEN, ActionStatus.ASSIGNED, ActionStatus.OVERDUE])
                ).all()

                if open_actions:
                    if not TaskSchedulerService._task_exists(db, mine.id, UserRole.MINE_MANAGER, today, "Manage Open Corrective Actions"):
                        TaskSchedulerService._create_task(db, mine.id, UserRole.MINE_MANAGER, "Manage Open Corrective Actions", f"There are {len(open_actions)} open corrective actions pending resolution.", today)
                        tasks_created += 1

                # 3. Governance Recommendations (Pending)
                pending_recs = db.query(GovernanceRecommendation).filter(
                    GovernanceRecommendation.mine_id == mine.id,
                    GovernanceRecommendation.status == RecommendationStatus.RECOMMENDED
                ).all()

                if pending_recs:
                    if not TaskSchedulerService._task_exists(db, mine.id, UserRole.MINE_MANAGER, today, "Review AI Governance Recommendations"):
                        TaskSchedulerService._create_task(db, mine.id, UserRole.MINE_MANAGER, "Review AI Governance Recommendations", f"{len(pending_recs)} AI recommendations require your review.", today)
                        tasks_created += 1

                # 4. Mine Risk Anomalies
                from app.models.ml import AnomalyResult
                critical_risk = db.query(AnomalyResult).filter(
                    AnomalyResult.mine_id == mine.id,
                    AnomalyResult.is_anomaly == True
                ).first()

                if critical_risk:
                    if not TaskSchedulerService._task_exists(db, mine.id, UserRole.SAFETY_OFFICER, today, "Investigate Critical Risk Anomaly"):
                        TaskSchedulerService._create_task(db, mine.id, UserRole.SAFETY_OFFICER, "Investigate Critical Risk Anomaly", "An anomaly was detected in the recent risk evaluation. Immediate investigation required.", today)
                        tasks_created += 1

            if tasks_created > 0:
                from app.models.user import User
                system_user = db.query(User).filter(User.role == UserRole.HEAD_ADMIN).first()
                # Add Audit Log
                audit = AuditLog(
                    mine_id=mines[0].id if mines else None,
                    user_id=system_user.id if system_user else "SYSTEM",
                    event_type=AuditEventType.DAILY_TASKS_GENERATED,
                    new_status="COMPLETED",
                    details={"description": f"System generated {tasks_created} daily tasks across all mines."}
                )
                db.add(audit)
                db.commit()

            return tasks_created
        except Exception as e:
            logger.error(f"Error generating daily tasks: {e}")
            db.rollback()
            return 0

    @staticmethod
    def _task_exists(db: Session, mine_id: str, role: UserRole, generation_date, title: str) -> bool:
        return db.query(DailyTask).filter(
            DailyTask.mine_id == mine_id,
            DailyTask.role == role,
            DailyTask.generation_date == generation_date,
            DailyTask.title == title
        ).first() is not None

    @staticmethod
    def _create_task(db: Session, mine_id: str, role: UserRole, title: str, description: str, generation_date):
        task = DailyTask(
            mine_id=mine_id,
            role=role,
            title=title,
            description=description,
            status=TaskStatus.PENDING,
            generation_date=generation_date
        )
        db.add(task)
