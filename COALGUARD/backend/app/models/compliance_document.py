import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, ForeignKey, Enum, DateTime
from sqlalchemy.orm import relationship
from app.db.base import Base
from app.models.enums import DocumentStatus

class ComplianceDocument(Base):
    __tablename__ = "compliance_documents"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    mine_id = Column(String, ForeignKey("mines.id"), nullable=False, index=True)
    document_type = Column(String, nullable=False)
    document_number = Column(String, nullable=False, index=True)
    issue_date = Column(DateTime, nullable=False)
    expiry_date = Column(DateTime, nullable=False)
    status = Column(Enum(DocumentStatus), nullable=False, default=DocumentStatus.VALID)
    description = Column(String, nullable=True)

    # Relationships
    mine = relationship("Mine", back_populates="compliance_documents")
