from datetime import datetime
from typing import Optional, List
from sqlalchemy import Column, String, Boolean, DateTime, Integer, ForeignKey, Text, Enum, Float
from sqlalchemy.orm import relationship

from app.models.base import Base
import enum

class UserRole(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"
    FINANCIAL_ADVISOR = "financial_advisor"

class AuthProvider(str, enum.Enum):
    EMAIL = "email"
    GOOGLE = "google"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=True)  # Nullable for OAuth users
    auth_provider = Column(Enum(AuthProvider), default=AuthProvider.EMAIL, nullable=False)
    google_id = Column(String(255), unique=True, nullable=True, index=True)  # For Google OAuth
    full_name = Column(String(100), nullable=True)
    
    # Profile information
    phone_number = Column(String(20), nullable=True)
    mobile_number = Column(String(20), nullable=True)  # Added for Google OAuth
    date_of_birth = Column(DateTime, nullable=True)
    gender = Column(String(20), nullable=True)
    profile_picture = Column(String(255), nullable=True)
    bio = Column(Text, nullable=True)
    
    # Financial information
    monthly_income = Column(Float, nullable=True)
    monthly_expenses = Column(Float, nullable=True)
    savings_goal = Column(Float, nullable=True)
    
    # Account status
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.USER, nullable=False)
    
    # Relationships
    transactions = relationship("Transaction", back_populates="user")
    chat_history = relationship("ChatHistory", back_populates="user")
    mood_sessions = relationship("MoodSession", back_populates="user")
    goals = relationship("Goal", back_populates="user")
    budgets = relationship("Budget", back_populates="user")
    
    # Timestamps
    last_login = Column(DateTime, nullable=True)
    email_verified_at = Column(DateTime, nullable=True)
    
    # New fields
    first_name = Column(String(50), nullable=True)
    last_name = Column(String(50), nullable=True)
    street_address = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    state_province = Column(String(100), nullable=True)
    country = Column(String(100), nullable=True)
    postal_code = Column(String(20), nullable=True)
    
    def __repr__(self):
        return f"<User {self.email}>"
    
    @property
    def is_admin(self) -> bool:
        return self.role == UserRole.ADMIN
    
    @property
    def is_financial_advisor(self) -> bool:
        return self.role == UserRole.FINANCIAL_ADVISOR
