from sqlalchemy.orm import Session
from db.session import engine, get_db
from db.models import User
from passlib.context import CryptContext
import sys

# Initialize password hasher
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_test_user(email: str, password: str, first_name: str = "Test", last_name: str = "User"):
    """Create a test user with the given credentials"""
    db = next(get_db())
    
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        print(f"User with email {email} already exists!")
        return False
    
    try:
        # Create new user
        user = User(
            email=email,
            password_hash=pwd_context.hash(password),
            first_name=first_name,
            last_name=last_name,
            is_active=True
        )
        
        db.add(user)
        db.commit()
        db.refresh(user)
        
        print(f"Successfully created test user {email}")
        return True
        
    except Exception as e:
        db.rollback()
        print(f"Error creating test user: {e}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python create_test_user.py <email> <password> [first_name] [last_name]")
        sys.exit(1)
        
    email = sys.argv[1]
    password = sys.argv[2]
    first_name = sys.argv[3] if len(sys.argv) > 3 else "Test"
    last_name = sys.argv[4] if len(sys.argv) > 4 else "User"
    
    create_test_user(email, password, first_name, last_name)
