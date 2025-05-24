import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from db.models import Base
from db.session import DATABASE_URL, engine

def init_db():
    print("Initializing database...")
    
    # Create all tables
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    
    # Create a session to verify the database is working
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # Test the connection
        db.execute(text("SELECT 1"))
        print("Database connection successful!")
    except Exception as e:
        print(f"Error connecting to the database: {e}")
        raise
    finally:
        db.close()
    
    print("Database initialization complete!")

if __name__ == "__main__":
    init_db()
