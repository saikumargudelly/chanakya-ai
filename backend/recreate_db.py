import os
from db.session import engine, Base
from db.models import User, Goal, Budget, Transaction, ChatHistory, RefreshToken, MoodSession

def recreate_database():
    print("Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    
    print("Creating all tables...")
    Base.metadata.create_all(bind=engine)
    
    print("Database recreated successfully!")

if __name__ == "__main__":
    # Confirm before proceeding
    confirm = input("WARNING: This will delete all data in the database. Continue? (y/n): ")
    if confirm.lower() == 'y':
        recreate_database()
    else:
        print("Operation cancelled.")
