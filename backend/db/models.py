from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
from typing import Optional

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    # Only Google auth users can have null password_hash
    password_hash = Column(String)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    mobile_number = Column(String, nullable=True)
    gender = Column(String, default='neutral')
    date_of_birth = Column(DateTime, nullable=True)
    address = Column(String, nullable=True)
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    country = Column(String, nullable=True)
    postal_code = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    profile_picture = Column(String, nullable=True)  # URL to profile picture
    is_active = Column(Boolean, default=True)
    google_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Define relationships
    goals = relationship("Goal", back_populates="user", cascade="all, delete-orphan")
    budgets = relationship("Budget", back_populates="user", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")
    mood_sessions = relationship("MoodSession", back_populates="user", cascade="all, delete-orphan")
    chat_history = relationship("ChatHistory", back_populates="user", cascade="all, delete-orphan")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")

class Goal(Base):
    __tablename__ = 'goals'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'))
    name = Column(String)
    target_amount = Column(Float)
    current_amount = Column(Float, default=0.0)
    deadline_months = Column(Integer)  # Number of months to achieve the goal
    target_date = Column(DateTime, nullable=True)  # Will be calculated from deadline_months
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Define relationship
    user = relationship("User", back_populates="goals")

class Budget(Base):
    __tablename__ = 'budgets'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'))
    income = Column(Float)
    expenses = Column(JSON)  # expects dict
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Relationship
    user = relationship("User", back_populates="budgets")

class Mood(Base):
    __tablename__ = 'moods'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer)
    mood = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)

class ChatHistory(Base):
    __tablename__ = 'chat_history'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'))
    role = Column(String)  # 'user' or 'assistant'
    content = Column(String)  # message content
    timestamp = Column(DateTime, default=datetime.utcnow)

    # Relationship
    user = relationship("User", back_populates="chat_history")

    # Deprecated fields for backward compatibility
    message = Column(String)  # old user message
    response = Column(String)  # old assistant response

class MoodSession(Base):
    __tablename__ = 'mood_sessions'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'))
    perma_scores = Column(JSON)      # e.g., {"P": 3, "E": 2, ...}
    answers = Column(JSON)           # raw answers to questions
    summary = Column(String)         # summary string for analytics
    timestamp = Column(DateTime, default=datetime.utcnow)

    # Relationship
    user = relationship("User", back_populates="mood_sessions")

class Transaction(Base):
    __tablename__ = 'transactions'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'))
    amount = Column(Float)
    category = Column(String)
    description = Column(String)
    date = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    user = relationship("User", back_populates="transactions")

class RefreshToken(Base):
    """
    Model for storing refresh tokens with their metadata.
    """
    __tablename__ = 'refresh_tokens'
    
    id = Column(Integer, primary_key=True)
    token = Column(String(512), unique=True, nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    revoked_at = Column(DateTime, nullable=True)
    revoked_by_ip = Column(String(45), nullable=True)  # IPv6 can be up to 45 chars
    user_agent = Column(String(512), nullable=True)
    
    # Relationship
    user = relationship('User', back_populates='refresh_tokens')
    
    def is_expired(self) -> bool:
        """Check if the token is expired."""
        return datetime.utcnow() >= self.expires_at
    
    def revoke(self, ip_address: Optional[str] = None) -> None:
        """Revoke the token."""
        self.is_active = False
        self.revoked_at = datetime.utcnow()
        self.revoked_by_ip = ip_address
