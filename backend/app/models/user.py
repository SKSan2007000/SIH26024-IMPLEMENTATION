from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime, timezone
from app.db.base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False)
    region_id = Column(String, ForeignKey("regions.id"), nullable=True)
    area_id = Column(String, ForeignKey("areas.id"), nullable=True)
    mine_id = Column(String, ForeignKey("mines.id"), nullable=True)
    department_id = Column(String, ForeignKey("departments.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    region = relationship("Region", back_populates="users")
    area = relationship("Area", back_populates="users")
    mine = relationship("Mine", back_populates="users")
    department = relationship("Department", back_populates="users")
