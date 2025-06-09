import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator
from dotenv import load_dotenv

# Import all models here to ensure they are registered with SQLAlchemy
from .models import Base, User, Goal, Budget, Transaction, ChatHistory, RefreshToken

# Load environment variables
load_dotenv()

# SQLite database URL - fallback to SQLite if no DATABASE_URL is provided
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///chanakya.db")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db() -> Generator[Session, None, None]:
    """
    Dependency function that yields database sessions
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
