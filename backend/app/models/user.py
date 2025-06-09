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

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=True)
    
    # Profile information
    phone_number = Column(String(20), nullable=True)
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
    transactions = relationship("Transaction", back_populates="owner")
    goals = relationship("FinancialGoal", back_populates="user")
    mood_entries = relationship("MoodEntry", back_populates="user")
    
    # Timestamps
    last_login = Column(DateTime, nullable=True)
    email_verified_at = Column(DateTime, nullable=True)
    
    def __repr__(self):
        return f"<User {self.email}>"
    
    @property
    def is_admin(self) -> bool:
        return self.role == UserRole.ADMIN
    
    @property
    def is_financial_advisor(self) -> bool:
        return self.role == UserRole.FINANCIAL_ADVISOR
