from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
import random
import uuid

from app.models.iot import IoTSensor, Telemetry, SensorType, SensorStatus
from app.models.mine import Mine
from app.services.governance_service import GovernanceService

class IoTService:

    @staticmethod
    def get_sensors(db: Session, mine_id: str):
        return db.query(IoTSensor).filter(IoTSensor.mine_id == mine_id).all()

    @staticmethod
    def get_telemetry(db: Session, sensor_id: str, limit: int = 100):
        return db.query(Telemetry).filter(Telemetry.sensor_id == sensor_id).order_by(Telemetry.timestamp.desc()).limit(limit).all()

    @staticmethod
    def ingest_telemetry(db: Session, sensor_id: str, value: float, quality: str = "GOOD"):
        sensor = db.query(IoTSensor).filter(IoTSensor.id == sensor_id).first()
        if not sensor:
            raise ValueError(f"Sensor {sensor_id} not found")
            
        now = datetime.now(timezone.utc)
        tel = Telemetry(
            id=str(uuid.uuid4()),
            sensor_id=sensor.id,
            value=value,
            timestamp=now,
            generated_at=now,
            quality=quality
        )
        db.add(tel)
        
        # Threshold detection
        IoTService._detect_threshold(db, sensor, value)
        
        db.commit()
        db.refresh(tel)
        
        return tel

    @staticmethod
    def generate_demo_telemetry(db: Session, mine_id: str, event_type: str = "NORMAL"):
        """
        Generates synthetic telemetry for all sensors in a mine.
        If event_type is a spike (e.g. PM10_SPIKE), that specific sensor will get a critical reading.
        """
        sensors = db.query(IoTSensor).filter(IoTSensor.mine_id == mine_id).all()
        now = datetime.now(timezone.utc)
        
        telemetry_created = []
        for sensor in sensors:
            value = IoTService._generate_base_value(sensor)
            
            # Apply spike if applicable
            if event_type == f"{sensor.sensor_type.value}_SPIKE":
                value = max(sensor.threshold_critical * 1.8, 180.0) if sensor.threshold_critical else 180.0
                
                # Tie the IoT spike to the existing ML feature pipeline which reads from legacy tables
                if event_type == "PM10_SPIKE":
                    from app.models.environment_reading import EnvironmentReading
                    from app.models.enums import EnvironmentSource
                    db.add(EnvironmentReading(
                        mine_id=mine_id, pm25=value * 0.5, pm10=value, temperature=30.0,
                        humidity=50.0, wind_speed=10.0, wind_direction=180,
                        source=EnvironmentSource.SENSOR, recorded_at=now
                    ))
                elif event_type == "METHANE_SPIKE":
                    from app.models.safety_report import SafetyReport
                    from app.models.enums import IncidentSeverity, IncidentStatus
                    db.add(SafetyReport(
                        mine_id=mine_id, reported_by=None, incident_type="Gas Leak",
                        severity=IncidentSeverity.CRITICAL, description="Methane spike detected by IoT Sensor",
                        location=sensor.zone, incident_date=now, status=IncidentStatus.UNDER_REVIEW
                    ))
                elif event_type == "VIBRATION_SPIKE":
                    from app.models.safety_report import SafetyReport
                    from app.models.enums import IncidentSeverity, IncidentStatus
                    db.add(SafetyReport(
                        mine_id=mine_id, reported_by=None, incident_type="Equipment Failure",
                        severity=IncidentSeverity.CRITICAL, description="Critical vibration detected by IoT Sensor",
                        location=sensor.zone, incident_date=now, status=IncidentStatus.UNDER_REVIEW
                    ))
                
            tel = Telemetry(
                id=str(uuid.uuid4()),
                sensor_id=sensor.id,
                value=value,
                timestamp=now,
                generated_at=now,
                quality="GOOD"
            )
            db.add(tel)
            telemetry_created.append(tel)
            
            # Threshold detection
            IoTService._detect_threshold(db, sensor, value)
            
        db.commit()
        for t in telemetry_created:
            db.refresh(t)
            
        # If there was a spike, dynamically invoke ML pipeline recalculations to close the demo loop
        if event_type != "NORMAL":
            from app.services.ml_service import MLService
            try:
                MLService.detect_anomaly(db, mine_id)
                MLService.predict_critical_risk(db, mine_id)
            except Exception as e:
                print(f"Error recalculating ML after IoT Spike: {e}")
                
        return telemetry_created

    @staticmethod
    def _generate_base_value(sensor: IoTSensor) -> float:
        # Generate a normal value well below warning
        base = sensor.threshold_warning * 0.6
        variance = sensor.threshold_warning * 0.1
        return base + random.uniform(-variance, variance)
        
    @staticmethod
    def _detect_threshold(db: Session, sensor: IoTSensor, value: float):
        if value >= sensor.threshold_critical:
            # Create a Governance Recommendation for this critical threshold
            title = f"Critical Sensor Alert: {sensor.sensor_name}"
            reason = f"{sensor.sensor_type.value} exceeded critical threshold ({value:.2f} {sensor.unit}). Zone: {sensor.zone}"
            
            # Check if an active recommendation for this sensor already exists recently to avoid spam
            # We will use GovernanceService to create it directly
            
            from app.models.governance import GovernanceRecommendation
            from app.models.enums import RecommendationSource, ActionPriority
            
            # Simple deduplication: Check if there's an open recommendation in the last hour
            recent_alert = db.query(GovernanceRecommendation).filter(
                GovernanceRecommendation.mine_id == sensor.mine_id,
                GovernanceRecommendation.title == title,
                GovernanceRecommendation.status == "PENDING",
                GovernanceRecommendation.created_at > datetime.now(timezone.utc) - timedelta(hours=1)
            ).first()
            
            if not recent_alert:
                rec = GovernanceRecommendation(
                    id=str(uuid.uuid4()),
                    mine_id=sensor.mine_id,
                    source_type=RecommendationSource.ENVIRONMENT, # Mapping IoT to ENVIRONMENT
                    recommendation_type="SAFETY_AUDIT",
                    title=title,
                    description="Investigate immediately and perform required remediation.",
                    reason=reason,
                    priority=ActionPriority.CRITICAL,
                    status="PENDING"
                )
                db.add(rec)
                
                # Also log an audit event
                from app.models.governance import AuditLog
                from app.models.enums import AuditEventType
                
                db.add(AuditLog(
                    mine_id=sensor.mine_id,
                    user_id="SYSTEM_IOT",
                    event_type=AuditEventType.RECOMMENDATION_CREATED,
                    new_status="PENDING",
                    details={"sensor_id": sensor.id, "value": value}
                ))
