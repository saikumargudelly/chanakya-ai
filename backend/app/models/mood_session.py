from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import Base

class MoodSession(Base):
    __tablename__ = "mood_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    mood = Column(String(50), nullable=False)
    note = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    perma_scores = Column(JSON, nullable=True)
    answers = Column(JSON, nullable=True)
    summary = Column(String, nullable=True)

    user = relationship("User", back_populates="mood_sessions") 