import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Use a relative path to the database file
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./chanakya.db")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
