from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import settings
DATABASE_URL = settings.DATABASE_URL

# Import all models to ensure they are registered with SQLAlchemy
from app.models.base import Base
from app.models.user import User
from app.models.transaction import Transaction
from app.models.chat_history import ChatHistory
from app.models.mood_session import MoodSession
from app.models.goal import Goal

# Create SQLAlchemy engine with appropriate configuration
if "sqlite" in settings.DATABASE_URL:
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        echo=settings.DEBUG
    )
else:
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
        echo=settings.DEBUG
    )

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """
    Dependency function that yields database sessions
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# def create_tables():
#     """
#     Create all tables in the database
#     """
#     Base.metadata.create_all(bind=engine)

# def drop_tables():
#     """
#     Drop all tables in the database
#     """
#     Base.metadata.drop_all(bind=engine)
