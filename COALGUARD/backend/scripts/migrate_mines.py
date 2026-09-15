import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.mine import Mine
from app.models.compliance_document import ComplianceDocument
from app.models.contractor import Contractor
from app.models.corrective_action import CorrectiveAction
from app.models.daily_task import DailyTask
from app.models.department import Department
from app.models.environment_reading import EnvironmentReading
from app.models.field_evidence import FieldEvidence
from app.models.governance import GovernanceRecommendation, AuditLog
from app.models.incident_report import IncidentReport
from app.models.inspection import Inspection
from app.models.mine_risk import MineRisk
from app.models.ml import Prediction, AnomalyResult
from app.models.safety_report import SafetyReport
from app.models.user import User

def migrate():
    db = SessionLocal()
    try:
        mines = db.query(Mine).all()
        if not mines:
            print("No mines found.")
            return

        print(f"Found {len(mines)} mines total.")

        if len(mines) >= 3:
            base_mines = mines[:3]
            other_mines = mines[3:]
        else:
            base_mines = mines
            other_mines = []
            
        print(f"Selected {len(base_mines)} canonical mines to keep.")
        
        # 1. Update the base mines
        secl_data = [
            {"name": "Gevra Open Cast Mine", "code": "SECL-GEVRA", "lat": 22.338, "lon": 82.593},
            {"name": "Kusmunda Open Cast Mine", "code": "SECL-KUSMUNDA", "lat": 22.332, "lon": 82.684},
            {"name": "Dipka Open Cast Mine", "code": "SECL-DIPKA", "lat": 22.315, "lon": 82.548}
        ]
        
        for i, m in enumerate(base_mines):
            m.name = secl_data[i]["name"]
            m.code = secl_data[i]["code"]
            m.latitude = secl_data[i]["lat"]
            m.longitude = secl_data[i]["lon"]
            
        # 2. Reassign other_mines to base_mines in round-robin fashion
        total_reassigned = 0
        if other_mines:
            models_with_mine_id = [
                ComplianceDocument, Contractor, CorrectiveAction, DailyTask,
                Department, EnvironmentReading, FieldEvidence, GovernanceRecommendation,
                AuditLog, IncidentReport, Inspection, MineRisk, Prediction,
                AnomalyResult, SafetyReport, User
            ]
            
            for i, om in enumerate(other_mines):
                target_mine = base_mines[i % 3]
                
                # Reassign foreign keys
                for model in models_with_mine_id:
                    updated = db.query(model).filter(model.mine_id == om.id).update(
                        {"mine_id": target_mine.id}, synchronize_session=False
                    )
                    total_reassigned += updated
                
                # Delete the orphaned mine
                db.delete(om)
                
        db.commit()
        print(f"Successfully reassigned {total_reassigned} dependent records.")
        print(f"Deleted {len(other_mines)} duplicate mines.")
        
        remaining = db.query(Mine).count()
        print(f"Total mines remaining in database: {remaining}")
        
    except Exception as e:
        db.rollback()
        print(f"Migration failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
