from sqlalchemy import Column, Integer, String, Float, DateTime, JSON
from sqlalchemy.ext.declarative import declarative_base
import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True)

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
    message = Column(String)
    response = Column(String)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
