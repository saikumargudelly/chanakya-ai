from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
import datetime
from typing import Optional

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    first_name = Column(String)
    last_name = Column(String)
    email = Column(String, unique=True, nullable=False)
    mobile_number = Column(String)
    address = Column(String)
    gender = Column(String(10), default='neutral')  # 'male', 'female', or 'neutral'
    password_hash = Column(String, nullable=False)  # bcrypt hash
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

class Budget(Base):
    __tablename__ = 'budgets'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    income = Column(Float)
    expenses = Column(JSON)  # expects dict
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationship
    user = relationship("User", back_populates="budgets")

# Add back_populates to User model
User.budgets = relationship("Budget", back_populates="user")

class Mood(Base):
    __tablename__ = 'moods'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer)
    mood = Column(String)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

class ChatHistory(Base):
    __tablename__ = 'chat_history'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer)
    role = Column(String)  # 'user' or 'assistant'
    content = Column(String)  # message content
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    # Deprecated fields for backward compatibility
    message = Column(String)  # old user message
    response = Column(String)  # old assistant response

class MoodSession(Base):
    __tablename__ = 'mood_sessions'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer)
    perma_scores = Column(JSON)      # e.g., {"P": 3, "E": 2, ...}
    answers = Column(JSON)           # raw answers to questions
    summary = Column(String)         # summary string for analytics
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)


class Goal(Base):
    __tablename__ = 'goals'
    
    id = Column(String, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    name = Column(String, nullable=False)
    target_amount = Column(Float, nullable=False)
    deadline_months = Column(Integer, nullable=False)
    saved_amount = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    def to_dict(self):
        return {
            "id": self.id,
            "goalName": self.name,
            "targetAmount": float(self.target_amount),
            "deadlineMonths": self.deadline_months,
            "savedAmount": float(self.saved_amount),
            "createdAt": self.created_at.isoformat()
        }

class RefreshToken(Base):
    """
    Model for storing refresh tokens with their metadata.
    """
    __tablename__ = 'refresh_tokens'
    
    id = Column(Integer, primary_key=True)
    token = Column(String(512), unique=True, nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    revoked_at = Column(DateTime, nullable=True)
    revoked_by_ip = Column(String(45), nullable=True)  # IPv6 can be up to 45 chars
    user_agent = Column(String(512), nullable=True)
    
    # Relationships
    user = relationship('User', back_populates='refresh_tokens')
    
    def is_expired(self) -> bool:
        """Check if the token is expired."""
        return datetime.datetime.utcnow() >= self.expires_at
    
    def revoke(self, ip_address: Optional[str] = None) -> None:
        """Revoke the token."""
        self.is_active = False
        self.revoked_at = datetime.datetime.utcnow()
        self.revoked_by_ip = ip_address

# Add relationship to User model
User.refresh_tokens = relationship('RefreshToken', back_populates='user', cascade='all, delete-orphan')
