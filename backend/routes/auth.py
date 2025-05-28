from fastapi import APIRouter, Depends, HTTPException, status, Request, Response, Form
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm, OAuth2PasswordRequestFormStrict
from jose import JWTError, jwt
from jose.exceptions import JWTError, JWTClaimsError, ExpiredSignatureError
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr, validator
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Union
from passlib.context import CryptContext
import jwt
import logging
import sys
import os
import requests
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import httpx

# Add the parent directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.session import get_db
from db.models import User, RefreshToken
from backend.utils.security import (
    verify_password, 
    get_password_hash, 
    create_access_token, 
    create_refresh_token,
    verify_refresh_token,
    SECRET_KEY, 
    ALGORITHM, 
    oauth2_scheme, 
    ACCESS_TOKEN_EXPIRE_MINUTES,
    REFRESH_TOKEN_EXPIRE_DAYS
)
from schemas.user import UserCreate, UserResponse, UserProfileResponse

# Configure logging
logger = logging.getLogger(__name__)

# Google OAuth settings
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")

# Token models for JWT authentication
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = ACCESS_TOKEN_EXPIRE_MINUTES * 60  # in seconds

class RefreshTokenRequest(BaseModel):
    refresh_token: str
    grant_type: str = "refresh_token"

    @validator('grant_type')
    def validate_grant_type(cls, v):
        if v != "refresh_token":
            raise ValueError("grant_type must be 'refresh_token'")
        return v

class TokenData(BaseModel):
    username: Optional[str] = None
    user_id: Optional[int] = None
    exp: Optional[datetime] = None

router = APIRouter()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

router = APIRouter(prefix="/auth", tags=["auth"])

# Models

class UserCreate(BaseModel):
    email: str
    password: Optional[str] = None
    gender: str = 'neutral'
    first_name: str = ''
    last_name: str = ''
    mobile_number: Optional[str] = None
    google_id: Optional[str] = None

class UserInDB(BaseModel):
    """Pydantic model for user data in database"""
    id: int
    email: str
    password_hash: str
    gender: str = 'neutral'
    first_name: str = ''
    last_name: str = ''
    is_active: bool = True

class UserResponse(BaseModel):
    id: int
    email: str
    gender: str
    first_name: str
    last_name: str

# Helper functions
def get_user(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a new access token
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(user_id: int, db: Session, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a new refresh token and store it in the database
    """
    if not expires_delta:
        expires_delta = timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    
    # Create the token
    expire = datetime.utcnow() + expires_delta
    to_encode = {"sub": str(user_id), "exp": expire, "type": "refresh"}
    token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    # Store in database
    db_refresh = RefreshToken(
        token=token,
        user_id=user_id,
        expires_at=expire,
        is_active=True
    )
    db.add(db_refresh)
    db.commit()
    db.refresh(db_refresh)
    
    return token

def verify_refresh_token(token: str, db: Session) -> Optional[User]:
    """
    Verify a refresh token and return the associated user if valid
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid refresh token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Verify the JWT
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            raise credentials_exception
            
        user_id = int(payload.get("sub"))
        if user_id is None:
            raise credentials_exception
            
        # Check if token exists in database and is active
        db_token = db.query(RefreshToken).filter(
            RefreshToken.token == token,
            RefreshToken.user_id == user_id,
            RefreshToken.is_active == True,
            RefreshToken.expires_at > datetime.utcnow()
        ).first()
        
        if not db_token:
            raise credentials_exception
            
        # Get the user
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.is_active:
            raise credentials_exception
            
        return user
        
    except jwt.PyJWTError:
        raise credentials_exception

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials. Please log in again.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not token:
        print("No token provided")
        raise credentials_exception
        
    try:
        # Debug: Print the token being used
        logger.info(f"Attempting to validate token: {token[:10]}...")
        
        # Decode the token
        try:
            payload = jwt.decode(
                token,
                SECRET_KEY,
                algorithms=[ALGORITHM],
                options={"verify_aud": False}
            )
            print(f"Decoded payload: {payload}")
        except jwt.ExpiredSignatureError:
            print("Token has expired")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired. Please log in again."
            )
        except jwt.JWTClaimsError as e:
            print(f"Token claims error: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token claims. Please log in again."
            )
        except Exception as e:
            print(f"Error decoding token: {str(e)}")
            raise credentials_exception
        
        # Get email and user_id from token
        email: str = payload.get("email") or payload.get("sub")
        user_id: int = payload.get("user_id")
        
        print(f"Email from token: {email}")
        print(f"User ID from token: {user_id}")
        
        if email is None or user_id is None:
            print("Missing email or user_id in token")
            raise credentials_exception
        
        # Get user from database
        user = db.query(User).filter(User.id == user_id, User.email == email).first()
        print(f"User from DB: {user.id if user else 'Not found'}")
        
        if user is None:
            print("User not found in database")
            raise credentials_exception
            
        if not user.is_active:
            print("User account is not active")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account is not active"
            )
            
        print("Token validation successful")
        return user
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error in get_current_user: {str(e)}")
        raise credentials_exception

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    request: Request,
    user_data: UserCreate, 
    db: Session = Depends(get_db)
):
    """
    Register a new user
    """
    logger.info(f"Registration attempt for email: {user_data.email}")
    
    # Check if user already exists
    db_user = get_user(db, user_data.email)
    if db_user:
        logger.warning(f"Registration failed - email already exists: {user_data.email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    try:
        # Create new user
        hashed_password = get_password_hash(user_data.password) if user_data.password else None
        db_user = User(
            email=user_data.email,
            password_hash=hashed_password,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            gender=user_data.gender,
            is_active=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            google_id=user_data.google_id
        )
        
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        logger.info(f"User registered successfully: {user_data.email}")
        
        return db_user
        
    except Exception as e:
        db.rollback()
        logger.error(f"Registration error for {user_data.email}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating user"
        )

@router.post("/token", response_model=Token, summary="OAuth2 compatible token login")
async def login_for_access_token(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    logger.info(f"Login attempt for user: {form_data.username}")
    
    # Authenticate the user with username and password
    user = get_user(db, form_data.username)
    if not user or not verify_password(form_data.password, user.password_hash):
        logger.warning(f"Failed login attempt for user: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        logger.warning(f"Login attempt for inactive user: {user.email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user",
        )
    
    # Delete any existing active refresh tokens for this user
    db.query(RefreshToken).filter(
        RefreshToken.user_id == user.id,
        RefreshToken.is_active == True
    ).delete()
    db.commit() # Commit the deletion of old tokens

    # Create new access and refresh tokens
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "email": user.email,
            "user_id": user.id, # Include user_id in access token payload
        },
        expires_delta=access_token_expires,
    )
    
    # Create a new refresh token and save it to the database
    refresh_token_expires = timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    refresh_token = create_refresh_token(user.id, db, expires_delta=refresh_token_expires)

    logger.info(f"Successful login for user: {user.email}")

    return Token(access_token=access_token, refresh_token=refresh_token, token_type="bearer")

@router.post("/refresh-token", response_model=Token)
async def refresh_token(
    request: Request,
    refresh_request: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """
    Refresh access token using a refresh token
    """
    logger.info("Refresh token request received")
    
    # Verify the refresh token
    user = verify_refresh_token(refresh_request.refresh_token, db)
    if not user:
        logger.warning("Invalid refresh token provided")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create new access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email},
        expires_delta=access_token_expires
    )
    
    # Optionally create a new refresh token (rotate refresh token)
    # refresh_token = create_refresh_token(user.id, db)
    
    logger.info(f"New access token generated for user: {user.email}")
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_request.refresh_token,  # Or new refresh_token if rotating
        "token_type": "bearer",
        "expires_in": int(access_token_expires.total_seconds())
    }

@router.get("/profile", response_model=UserProfileResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get the current user's profile information.
    """
    return {
        "id": current_user.id,
        "email": current_user.email,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "mobile_number": current_user.mobile_number,
        "gender": current_user.gender,
        "is_active": current_user.is_active,
        "created_at": current_user.created_at,
        "updated_at": current_user.updated_at
    }

@router.get("/users/me/", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/users/me/", response_model=UserResponse)
async def update_user_profile(
    first_name: Optional[str] = None,
    last_name: Optional[str] = None,
    gender: Optional[str] = None,
    mobile_number: Optional[str] = None,
    address: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if gender and gender not in ['male', 'female', 'neutral']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid gender. Must be one of: male, female, neutral"
        )
    
    if first_name is not None:
        current_user.first_name = first_name
    if last_name is not None:
        current_user.last_name = last_name
    if gender is not None:
        current_user.gender = gender
    if mobile_number is not None:
        current_user.mobile_number = mobile_number
    if address is not None:
        current_user.address = address
    
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/reset-password/")
async def reset_password(
    current_password: str,
    new_password: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_password(current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    current_user.password_hash = get_password_hash(new_password)
    db.commit()
    
    return {"message": "Password updated successfully"}

from pydantic import BaseModel

class ResetPasswordRequest(BaseModel):
    email: str
    new_password: str

@router.post("/reset_password")
async def request_password_reset(
    request: Request,
    reset_data: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    """
    Handle password reset request.
    In a production environment, this would send a reset link to the user's email.
    For demo purposes, we'll update the password directly.
    """
    user = get_user(db, reset_data.email)
    if not user:
        # For security, don't reveal if the email exists or not
        return {"message": "If an account with that email exists, a password reset link has been sent."}
    
    # Update the password directly (in production, you'd send a reset link)
    user.password_hash = get_password_hash(reset_data.new_password)
    db.commit()
    
    return {"message": "Password has been reset successfully. You can now log in with your new password."}

class GoogleAuthRequest(BaseModel):
    credential: str

@router.post("/google", response_model=Token)
async def google_auth(
    request: Request,
    google_data: GoogleAuthRequest,
    db: Session = Depends(get_db)
):
    """
    Handle Google OAuth authentication
    """
    try:
        # Verify the Google token
        idinfo = id_token.verify_oauth2_token(
            google_data.credential, 
            google_requests.Request(), 
            GOOGLE_CLIENT_ID
        )

        if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token issuer"
            )

        # Get user info from Google
        email = idinfo['email']
        google_id = idinfo['sub']
        first_name = idinfo.get('given_name', '')
        last_name = idinfo.get('family_name', '')
        picture = idinfo.get('picture', '')  # Get profile picture URL
        gender = idinfo.get('gender', 'neutral') # Get gender
        mobile_number = idinfo.get('phone_number') # Get phone number
        
        # Check if user exists
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            # Create new user
            user = User(
                email=email,
                google_id=google_id,
                first_name=first_name,
                last_name=last_name,
                mobile_number=mobile_number,
                gender=gender,
                profile_picture=picture,
                is_active=True,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            # Update existing user with new information
            user.google_id = google_id
            user.first_name = first_name
            user.last_name = last_name
            if mobile_number:
                user.mobile_number = mobile_number
            if gender:
                user.gender = gender
            if picture:
                user.profile_picture = picture
            user.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(user)

        # Create access and refresh tokens
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={
                "sub": str(user.id),
                "email": user.email,
                "user_id": user.id,
            },
            expires_delta=access_token_expires,
        )
        
        refresh_token_expires = timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        refresh_token = create_refresh_token(user.id, db, expires_delta=refresh_token_expires)

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "gender": user.gender,
                "mobile_number": user.mobile_number,
                "profile_picture": user.profile_picture,
                "is_active": user.is_active
            }
        }

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google token"
        )
    except Exception as e:
        logger.error(f"Google auth error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication failed"
        )
