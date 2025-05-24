from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker
from db.models import Base
from db.session import DATABASE_URL, engine

def check_schema():
    print("Checking database schema...")
    
    # Create an inspector to inspect the database
    inspector = inspect(engine)
    
    # Get all table names
    tables = inspector.get_table_names()
    print(f"Tables in database: {tables}")
    
    # Check users table columns
    if 'users' in tables:
        print("\nColumns in 'users' table:")
        for column in inspector.get_columns('users'):
            print(f"- {column['name']} ({column['type']})")
    else:
        print("\n'users' table not found in the database.")
    
    print("\nSchema check complete!")

if __name__ == "__main__":
    check_schema()
