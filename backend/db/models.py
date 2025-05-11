from sqlalchemy import Column, Integer, String, Float, DateTime, JSON
from sqlalchemy.ext.declarative import declarative_base
import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    first_name = Column(String)
    last_name = Column(String)
    email = Column(String, unique=True, nullable=False)
    mobile_number = Column(String)
    address = Column(String)
    password_hash = Column(String, nullable=False)  # bcrypt hash

class Budget(Base):
    __tablename__ = 'budgets'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer)
    income = Column(Float)
    expenses = Column(JSON)  # expects dict
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

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
