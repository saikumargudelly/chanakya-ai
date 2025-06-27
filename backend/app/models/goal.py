from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Text, Boolean, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import Base

class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    target_amount = Column(Float, nullable=True)
    current_amount = Column(Float, default=0.0, nullable=False)
    deadline = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    milestone_frequency = Column(String(20), nullable=True)
    milestones = Column(JSON, nullable=True)  # Use JSON for SQLite/Postgres
    reminders = Column(JSON, nullable=True)
    vision = Column(Text, nullable=True)
    mood_aware = Column(Boolean, default=False)

    user = relationship("User", back_populates="goals") 