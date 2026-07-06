from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from db.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key =True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)

    role = Column(String, default="patient")

    created_at = Column(DateTime, default = datetime.utcnow)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default = False)

    #Relationship link to MoodLogs (one-to-many)
    #cascade="all,delete" ka mtlb agr user delete hua toh uske logs bhi ud jayenge
    logs = relationship("MoodLog", back_populates="owner", cascade="all, delete-orphan")