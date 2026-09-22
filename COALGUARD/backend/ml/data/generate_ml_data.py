import os
import sys
import uuid
import random
from datetime import datetime, timedelta, timezone

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from app.db.session import SessionLocal
from app.models.mine import Mine
from app.models.safety_report import SafetyReport
from app.models.environment_reading import EnvironmentReading
from app.models.corrective_action import CorrectiveAction
from app.models.mine_risk import MineRisk
from app.models.enums import IncidentSeverity, IncidentStatus, EnvironmentSource, ActionPriority, ActionStatus
from app.services.risk_service import RiskService

def generate_synthetic_data(days=60, num_mines=2, train_models=True, db=None):
    if db is None:
        db = SessionLocal()
    
    mines = db.query(Mine).all()
    if not mines:
        print("No mines found. Please run scripts/seed.py first.")
        return
        
    mines = mines[:num_mines]
    
    start_date = datetime.now(timezone.utc) - timedelta(days=days)
    
    print(f"Generating {days} days of synthetic data for {len(mines)} mines...")
    
    for mine in mines:
        print(f"Processing mine: {mine.name}")
        
        # Hidden operational state to create correlations
        hidden_risk_factor = random.uniform(0.1, 0.5) 
        
        for day in range(days):
            current_date = start_date + timedelta(days=day)
            
            # Randomly drift the hidden risk factor
            hidden_risk_factor += random.uniform(-0.05, 0.05)
            hidden_risk_factor = max(0.01, min(0.99, hidden_risk_factor))
            
            # 1. Environment Readings (Daily)
            pm10_base = 40 + (hidden_risk_factor * 100)
            pm10 = max(10, pm10_base + random.uniform(-20, 20))
            pm25 = pm10 * random.uniform(0.4, 0.7)
            
            env = EnvironmentReading(
                mine_id=mine.id,
                pm25=pm25,
                pm10=pm10,
                temperature=25.0 + random.uniform(-5, 5),
                humidity=50.0 + random.uniform(-10, 10),
                wind_speed=10.0 + random.uniform(-2, 5),
                wind_direction=random.uniform(0, 360),
                recorded_at=current_date,
                created_at=current_date
            )
            db.add(env)
            
            # 2. Corrective Actions (Occasional)
            if random.random() < 0.2:
                priority = random.choices(
                    [ActionPriority.LOW, ActionPriority.MEDIUM, ActionPriority.HIGH, ActionPriority.CRITICAL],
                    weights=[0.5, 0.3, 0.15, 0.05]
                )[0]
                
                status = ActionStatus.OPEN
                # If hidden risk is high, actions are left open longer
                if random.random() > hidden_risk_factor:
                    status = ActionStatus.COMPLETED
                    
                action = CorrectiveAction(
                    mine_id=mine.id,
                    issue_type="SYNTHETIC",
                    title="Synthetic Action",
                    description="Auto-generated",
                    assigned_to=mine.region_id, # Mock user id
                    priority=priority,
                    deadline=current_date + timedelta(days=7),
                    status=status,
                    created_at=current_date,
                    completed_at=current_date if status == ActionStatus.COMPLETED else None
                )
                db.add(action)
                
            # 3. Safety Incidents
            # Higher hidden risk = much higher chance of incidents
            incident_prob = 0.02 + (hidden_risk_factor * 0.1)
            if random.random() < incident_prob:
                # Severity depends heavily on hidden risk
                sev_weights = [0.6, 0.3, 0.08, 0.02]
                if hidden_risk_factor > 0.7:
                    sev_weights = [0.2, 0.4, 0.3, 0.1] # Much higher chance of CRITICAL
                    
                severity = random.choices(
                    [IncidentSeverity.LOW, IncidentSeverity.MEDIUM, IncidentSeverity.HIGH, IncidentSeverity.CRITICAL],
                    weights=sev_weights
                )[0]
                
                report = SafetyReport(
                    mine_id=mine.id,
                    reported_by=mine.region_id,
                    incident_type=random.choice(["Fall", "Equipment", "Fire", "Electrical"]),
                    severity=severity,
                    description="Synthetic incident",
                    location="Zone A",
                    incident_date=current_date,
                    status=IncidentStatus.OPEN,
                    created_at=current_date
                )
                db.add(report)
                
            # Compute daily MineRisk based on the data up to this day
            # We will use a faster approximation for history generation or just use the real service
            # To avoid the DB lag of 14,000 queries, we commit daily.
            if day % 30 == 0:
                db.commit()
                
            # Create a daily risk snapshot manually to save time, or call the service
            # For accurate features, we must have MineRisk rows.
            # Let's approximate the baseline risk to speed up generation, OR just let feature engineering compute it?
            # Stage 4 requires `MineRisk` to exist for the triad.
            # Let's generate a mock MineRisk record
            safety_score = 100.0 if hidden_risk_factor > 0.8 else hidden_risk_factor * 50
            overall = (safety_score * 0.3) + (hidden_risk_factor * 70)
            
            risk_level = "LOW"
            if overall > 80: risk_level = "CRITICAL"
            elif overall > 60: risk_level = "HIGH"
            elif overall > 30: risk_level = "MEDIUM"
            
            mr = MineRisk(
                mine_id=mine.id,
                overall_risk_score=overall,
                safety_score=safety_score,
                recurrence_score=0,
                corrective_action_score=hidden_risk_factor*100,
                inspection_score=0,
                environment_score=hidden_risk_factor*100,
                documentation_score=0,
                historical_performance_score=0,
                risk_level=risk_level,
                calculated_at=current_date,
                created_at=current_date
            )
            db.add(mr)
            
    db.commit()
    print("Synthetic data generation complete!")

if __name__ == "__main__":
    generate_synthetic_data()
