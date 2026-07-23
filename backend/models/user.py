from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
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

    # Foreign Key: Jo dusre User (Caretaker) li ID store karega
    caretaker_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable = True )

    # Self-Referential Relationships (Doctor aur Patient ko link karne k liye)

    #1. Patient k side s apna Doctor dekhne k liye:
    caretaker = relationship("User", remote_side=[id], back_populates="patients", foreign_keys=[caretaker_id])

    #2. Doctor k side s apne saare patients ki list dekhne k liye:
    patients = relationship("User", back_populates="caretaker", foreign_keys=[caretaker_id])
    #Relationship link to MoodLogs (one-to-many)
    #cascade="all,delete" ka mtlb agr user delete hua toh uske logs bhi ud jayenge
    logs = relationship("MoodLog", back_populates="owner", cascade="all, delete-orphan")