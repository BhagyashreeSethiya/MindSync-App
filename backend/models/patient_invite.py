from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.sql import func
from datetime import datetime
from db.database import Base

class PatientInvite(Base):
    __tablename__ = "patient_invites"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, index=True, nullable=False)
    token = Column(String, unique=True, index=True, nullable=False)
    caretaker_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    is_used = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())