from sqlalchemy import Column, String, Float, DateTime, Enum, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from database import Base
import uuid

class Business(Base):
    __tablename__ = "businesses"

    ubid             = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_name     = Column(String(255), nullable=False, index=True)
    pan              = Column(String(10),  unique=True, index=True)
    gstin            = Column(String(15),  unique=True, index=True)
    address          = Column(Text)
    pincode          = Column(String(10))
    state            = Column(String(100))
    status           = Column(Enum('ACTIVE', 'DORMANT', 'CLOSED', name='business_status'), default='ACTIVE')
    confidence_score = Column(Float)
    review_status    = Column(Enum('PENDING', 'APPROVED', 'REJECTED', name='review_status'), default='PENDING')
    created_at       = Column(DateTime(timezone=True), server_default=func.now())
    updated_at       = Column(DateTime(timezone=True), onupdate=func.now())


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id                    = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ubid                  = Column(UUID(as_uuid=True), index=True)
    source                = Column(String(50))
    event_date            = Column(DateTime(timezone=True))
    has_electricity_usage = Column(Boolean, default=False)
    last_inspection_date  = Column(DateTime(timezone=True), nullable=True)
    license_active        = Column(Boolean, default=True)
    created_at            = Column(DateTime(timezone=True), server_default=func.now())


class MatchQueue(Base):
    __tablename__ = "match_queue"

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    record_a      = Column(Text)
    record_b      = Column(Text)
    confidence    = Column(Float)
    status        = Column(Enum('PENDING', 'APPROVED', 'REJECTED', name='queue_status'), default='PENDING')
    reviewer_note = Column(Text, nullable=True)
    created_at    = Column(DateTime(timezone=True), server_default=func.now())