from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from db.database import Base

class MoodLog(Base):
    __tablename__ = "mood_logs"

    id = Column(Integer, primary_key = True, index = True)

    #Foreign Key (kis user ka msg h)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    user_message = Column(String, nullable = False)
    ai_reply = Column(String, nullable=False)

    emotion_detected = Column(String, default = "neutral")
    alert_triggered = Column(Boolean, default = False)
    timestamp = Column(DateTime, default = datetime.utcnow)

    is_helpful = Column(Boolean, nullable =True, default =None)
    skipped_medicine = Column(Boolean, nullable=True, default=None)

    #Back-reference to User
    owner = relationship("User", back_populates="logs")