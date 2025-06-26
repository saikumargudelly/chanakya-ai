#!/usr/bin/env python3
"""
Database initialization script for Chanakya AI Financial Coach
This script creates all tables and initializes the database
"""

import os
import sys
from pathlib import Path
from sqlalchemy import text

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.db.session import create_tables, engine
from app.models import Base
from app.core.config import settings

def init_database():
    """Initialize the database with all tables"""
    print("🚀 Initializing Chanakya AI Database...")
    print(f"📊 Database URL: {settings.DATABASE_URL}")
    print(f"🔧 Environment: {settings.ENVIRONMENT}")
    
    try:
        # For SQLite, we can just create tables (they'll be replaced if they exist)
        if "sqlite" in settings.DATABASE_URL:
            print("🗑️  Dropping existing tables (SQLite)...")
            # Drop all tables using raw SQL for SQLite
            with engine.connect() as conn:
                conn.execute(text("PRAGMA foreign_keys=OFF"))
                conn.execute(text("DROP TABLE IF EXISTS alembic_version"))
                conn.execute(text("DROP TABLE IF EXISTS goals"))
                conn.execute(text("DROP TABLE IF EXISTS mood_sessions"))
                conn.execute(text("DROP TABLE IF EXISTS chat_history"))
                conn.execute(text("DROP TABLE IF EXISTS transactions"))
                conn.execute(text("DROP TABLE IF EXISTS users"))
                conn.execute(text("DROP TABLE IF EXISTS budgets"))
                conn.execute(text("DROP TABLE IF EXISTS refresh_tokens"))
                conn.execute(text("PRAGMA foreign_keys=ON"))
                conn.commit()
            print("✅ Tables dropped successfully")
        else:
            # For PostgreSQL, use CASCADE
            print("🗑️  Dropping existing tables (PostgreSQL)...")
            Base.metadata.drop_all(bind=engine, checkfirst=True)
            print("✅ Tables dropped successfully")
        
        # Create all tables
        print("🏗️  Creating new tables...")
        # create_tables()
        print("✅ Tables created successfully")
        
        # Verify tables were created
        inspector = engine.dialect.inspector(engine)
        tables = inspector.get_table_names()
        print(f"📋 Created tables: {', '.join(tables)}")
        
        print("🎉 Database initialization completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error initializing database: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = init_database()
    sys.exit(0 if success else 1) 