from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, Text, Boolean
from sqlalchemy.orm import relationship
import enum

from app.models.base import Base

class TransactionType(str, enum.Enum):
    INCOME = "income"
    EXPENSE = "expense"
    TRANSFER = "transfer"
    INVESTMENT = "investment"

class TransactionCategory(str, enum.Enum):
    # Income categories
    SALARY = "salary"
    FREELANCE = "freelance"
    INVESTMENT_INCOME = "investment_income"
    GIFT = "gift"
    OTHER_INCOME = "other_income"
    
    # Expense categories
    HOUSING = "housing"
    UTILITIES = "utilities"
    GROCERIES = "groceries"
    DINING = "dining"
    TRANSPORTATION = "transportation"
    HEALTHCARE = "healthcare"
    ENTERTAINMENT = "entertainment"
    SHOPPING = "shopping"
    EDUCATION = "education"
    TRAVEL = "travel"
    SUBSCRIPTIONS = "subscriptions"
    SAVINGS = "savings"
    INVESTMENT_EXPENSE = "investment"
    OTHER_EXPENSE = "other_expense"

class TransactionStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Transaction details
    amount = Column(Float, nullable=False)
    type = Column(Enum(TransactionType), nullable=False)
    category = Column(Enum(TransactionCategory), nullable=False)
    description = Column(Text, nullable=True)
    
    # Transaction metadata
    status = Column(Enum(TransactionStatus), default=TransactionStatus.COMPLETED, nullable=False)
    transaction_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Recurring transaction fields
    is_recurring = Column(Boolean, default=False, nullable=False)
    recurring_interval = Column(String(50), nullable=True)  # e.g., 'monthly', 'weekly'
    recurring_end_date = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="transactions")
    
    def __repr__(self):
        return f"<Transaction {self.id} - {self.amount} {self.type} - {self.status}>"
    
    @property
    def is_income(self) -> bool:
        return self.type == TransactionType.INCOME
    
    @property
    def is_expense(self) -> bool:
        return self.type == TransactionType.EXPENSE
