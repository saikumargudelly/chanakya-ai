from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
import secrets
from hashlib import sha256

from app.core.security import get_password_hash, verify_password
from app.models.user import User, AuthProvider
from app.schemas.user import UserCreate, UserUpdate, UserCreateGoogle
from app.models.refresh_token import RefreshToken

REFRESH_TOKEN_BYTES = 64

def get_user(db: Session, user_id: int):
    """Get a user by ID."""
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_email(db: Session, email: str):
    """Get a user by email (case-insensitive, trimmed)."""
    normalized_email = email.strip().lower()
    return db.query(User).filter(User.email == normalized_email).first()


def get_users(db: Session, skip: int = 0, limit: int = 100):
    """Get a list of users with pagination."""
    return db.query(User).offset(skip).limit(limit).all()


def create_user(db: Session, user: UserCreate):
    """Create a new user with email/password authentication (normalize email)."""
    normalized_email = user.email.strip().lower()
    db_user = User(
        email=normalized_email,
        hashed_password=get_password_hash(user.password),
        full_name=user.full_name,
        auth_provider=AuthProvider.EMAIL,
        is_active=user.is_active if hasattr(user, 'is_active') else True,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def create_google_user(db: Session, user_data: Dict[str, Any]):
    """Create a new user with Google OAuth (normalize email)."""
    normalized_email = user_data['email'].strip().lower()
    db_user = User(
        email=normalized_email,
        full_name=user_data.get('name', ''),
        first_name=user_data.get('first_name'),
        last_name=user_data.get('last_name'),
        gender=user_data.get('gender'),
        date_of_birth=user_data.get('date_of_birth'),
        mobile_number=user_data.get('mobile_number'),
        google_id=user_data.get('sub'),
        auth_provider=AuthProvider.GOOGLE,
        is_active=True,
        is_verified=user_data.get('email_verified', False),
        profile_picture=user_data.get('picture')
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def get_or_create_google_user(db: Session, user_data: Dict[str, Any]):
    """Get an existing user by Google ID or create a new one (normalize email)."""
    # Try to find user by Google ID first
    user = db.query(User).filter(User.google_id == user_data['sub']).first()
    if user:
        # Update user with any new information from Google
        update_google_user_fields(user, user_data)
        db.commit()
        db.refresh(user)
        return user, False  # User exists, not created
    
    # If not found by Google ID, try by normalized email
    normalized_email = user_data['email'].strip().lower()
    user = db.query(User).filter(User.email == normalized_email).first()
    if user:
        # Update existing user with Google ID and new fields
        user.google_id = user_data['sub']
        user.auth_provider = AuthProvider.GOOGLE
        update_google_user_fields(user, user_data)
        db.commit()
        db.refresh(user)
        return user, False  # User updated, not created
    
    # Create new user
    user = create_google_user(db, user_data)
    return user, True  # New user created


def update_google_user_fields(user: User, user_data: Dict[str, Any]):
    """Update user fields with Google OAuth data."""
    # Update basic fields if not already set or if new data is available
    if user_data.get('first_name') and not user.first_name:
        user.first_name = user_data['first_name']
    if user_data.get('last_name') and not user.last_name:
        user.last_name = user_data['last_name']
    if user_data.get('gender') and not user.gender:
        user.gender = user_data['gender']
    if user_data.get('date_of_birth') and not user.date_of_birth:
        user.date_of_birth = user_data['date_of_birth']
    if user_data.get('mobile_number') and not user.mobile_number:
        user.mobile_number = user_data['mobile_number']
    if user_data.get('picture') and not user.profile_picture:
        user.profile_picture = user_data['picture']
    # Update full_name if we have first and last name but no full_name
    if (user_data.get('first_name') or user_data.get('last_name')) and not user.full_name:
        first = user_data.get('first_name', '')
        last = user_data.get('last_name', '')
        user.full_name = f"{first} {last}".strip()


def update_user(db: Session, user_id: int, user: UserUpdate):
    """Update a user."""
    db_user = get_user(db, user_id)
    if not db_user:
        return None
    
    update_data = user.dict(exclude_unset=True)
    if 'password' in update_data:
        update_data['hashed_password'] = get_password_hash(update_data.pop('password'))
    
    for field, value in update_data.items():
        setattr(db_user, field, value)
    
    db_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_user)
    return db_user


def delete_user(db: Session, user_id: int):
    """Delete a user."""
    db_user = get_user(db, user_id)
    if not db_user:
        return None
    db.delete(db_user)
    db.commit()
    return db_user


def authenticate_user(db: Session, email: str, password: str):
    """Authenticate a user with email/password (normalize email, add debug logging)."""
    normalized_email = email.strip().lower()
    print(f"[AUTH] Authenticating user: '{normalized_email}'")
    user = get_user_by_email(db, email=normalized_email)
    print(f"[AUTH] User found: {user is not None}")
    if not user:
        return None
    if not user.hashed_password or not verify_password(password, user.hashed_password):
        print("[AUTH] Password mismatch or no password set.")
        return None
    return user


def authenticate_google_user(db: Session, user_data: Dict[str, Any]) -> tuple[User, bool]:
    """
    Authenticate a user with Google OAuth.
    
    Args:
        db: Database session
        user_data: Dictionary containing Google OAuth user data
        
    Returns:
        tuple: (User object, is_new_user: bool)
    """
    try:
        if not all(key in user_data for key in ["sub", "email", "name"]):
            raise ValueError("Invalid user data: missing required fields")
            
        user, is_new_user = get_or_create_google_user(db, user_data)
        return user, is_new_user
        
    except Exception as e:
        raise ValueError(f"Google authentication failed: {str(e)}")


def create_access_token(
    *, 
    data: dict, 
    expires_delta: Optional[timedelta] = None,
    secret_key: Optional[str] = None,
    algorithm: str = "HS256"
) -> str:
    """
    Create a new JWT access token.
    
    Args:
        data: Dictionary containing token claims
        expires_delta: Optional timedelta for token expiration
        secret_key: Optional secret key for signing
        algorithm: Hashing algorithm to use
        
    Returns:
        str: Encoded JWT token
    """
    from app.core.security import create_access_token as security_create_access_token
    try:
        return security_create_access_token(
            data=data,
            expires_delta=expires_delta,
            secret_key=secret_key,
            algorithm=algorithm
        )
    except Exception as e:
        raise ValueError(f"Failed to create access token: {str(e)}")


# --- Refresh Token Logic ---
def create_refresh_token(db: Session, user_id: int, user_agent: str = None, ip: str = None, expires_days: int = 30) -> RefreshToken:
    raw_token = secrets.token_urlsafe(REFRESH_TOKEN_BYTES)
    hashed_token = sha256(raw_token.encode()).hexdigest()
    expires_at = datetime.utcnow() + timedelta(days=expires_days)
    refresh_token = RefreshToken(
        token=hashed_token,
        user_id=user_id,
        is_active=True,
        created_at=datetime.utcnow(),
        expires_at=expires_at,
        user_agent=user_agent,
        revoked_at=None,
        revoked_by_ip=None
    )
    db.add(refresh_token)
    db.commit()
    db.refresh(refresh_token)
    # Return both the DB object and the raw token (for sending to the client)
    refresh_token.raw_token = raw_token
    return refresh_token

def get_refresh_token(db: Session, raw_token: str) -> RefreshToken:
    hashed_token = sha256(raw_token.encode()).hexdigest()
    return db.query(RefreshToken).filter(RefreshToken.token == hashed_token, RefreshToken.is_active == True).first()

def revoke_refresh_token(db: Session, raw_token: str, ip: str = None):
    token_obj = get_refresh_token(db, raw_token)
    if token_obj:
        token_obj.is_active = False
        token_obj.revoked_at = datetime.utcnow()
        token_obj.revoked_by_ip = ip
        db.commit()
        db.refresh(token_obj)
    return token_obj

def clean_expired_refresh_tokens(db: Session):
    now = datetime.utcnow()
    expired_tokens = db.query(RefreshToken).filter(RefreshToken.expires_at < now, RefreshToken.is_active == True).all()
    for token in expired_tokens:
        token.is_active = False
        token.revoked_at = now
    db.commit()
