import uuid
from datetime import datetime, timezone, date
from sqlalchemy import Column, String, ForeignKey, Enum, DateTime, Date
from sqlalchemy.orm import relationship
from app.db.base import Base
from app.models.enums import UserRole, TaskStatus

class DailyTask(Base):
    __tablename__ = "daily_tasks"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    mine_id = Column(String, ForeignKey("mines.id"), nullable=False, index=True)
    role = Column(Enum(UserRole), nullable=False, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    status = Column(Enum(TaskStatus), nullable=False, default=TaskStatus.PENDING)
    generation_date = Column(Date, nullable=False, default=lambda: datetime.now(timezone.utc).date(), index=True)

    # Relationships
    mine = relationship("Mine")
