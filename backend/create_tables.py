from db.models import Base
from db.session import engine

def create_tables():
    print("Creating all database tables...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")

if __name__ == "__main__":
    create_tables()
