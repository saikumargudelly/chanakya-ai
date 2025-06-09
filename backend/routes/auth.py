from fastapi import APIRouter, Depends, HTTPException, status, Request, Response, Form
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm, OAuth2PasswordRequestFormStrict
from jose import JWTError, jwt
from jose.exceptions import JWTError, JWTClaimsError, ExpiredSignatureError
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr, validator
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone, date
from typing import Optional, Dict, Any, Union, List
from passlib.context import CryptContext
import jwt
import logging
import sys
import os
import requests
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import httpx
from typing import TypeVar, Type, Optional as TypedOptional, Dict as TypedDict, Any as TypedAny, List as TypedList, Union as TypedUnion

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

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Create router with /auth prefix
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

def format_user_response(user: User):
    """
    Helper function to format user data consistently across endpoints.
    Handles all profile fields and ensures consistent data types.
    Safely handles missing attributes.
    """
    def safe_get_attr(obj, attr, default=None):
        """Safely get attribute with a default value if it doesn't exist"""
        try:
            value = getattr(obj, attr, default)
            return value if value is not None else default
        except Exception:
            return default

    # Safely get date_of_birth and format it
    date_of_birth = safe_get_attr(user, 'date_of_birth')
    if date_of_birth:
        try:
            if isinstance(date_of_birth, str):
                date_obj = datetime.strptime(date_of_birth, "%Y-%m-%d")
                date_of_birth = date_obj.date().isoformat()
            elif hasattr(date_of_birth, 'isoformat'):
                date_of_birth = date_of_birth.isoformat()
        except (ValueError, TypeError) as e:
            logger.warning(f"Error formatting date_of_birth: {e}")
            date_of_birth = None

    # Format timestamps safely
    created_at = safe_get_attr(user, 'created_at')
    created_at = created_at.isoformat() if hasattr(created_at, 'isoformat') else None
    
    updated_at = safe_get_attr(user, 'updated_at')
    updated_at = updated_at.isoformat() if hasattr(updated_at, 'isoformat') else None

    # Return all user fields in a consistent format with safe attribute access
    return {
        "id": safe_get_attr(user, 'id', 0),
        "email": safe_get_attr(user, 'email', ''),
        "first_name": safe_get_attr(user, 'first_name', ''),
        "last_name": safe_get_attr(user, 'last_name', ''),
        "mobile_number": safe_get_attr(user, 'mobile_number', ''),
        "gender": (safe_get_attr(user, 'gender') or "neutral").lower(),
        "date_of_birth": date_of_birth,
        "address": safe_get_attr(user, 'address', ''),
        "city": safe_get_attr(user, 'city', ''),
        "state": safe_get_attr(user, 'state', ''),
        "country": safe_get_attr(user, 'country', ''),
        "postal_code": safe_get_attr(user, 'postal_code', ''),
        "bio": safe_get_attr(user, 'bio', ''),
        "profile_picture": safe_get_attr(user, 'profile_picture', ''),
        "is_active": bool(safe_get_attr(user, 'is_active', True)),
        "created_at": created_at,
        "updated_at": updated_at,
        "google_id": safe_get_attr(user, 'google_id')
    }

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
        logger.warning("No authentication token provided")
        raise credentials_exception
        
    try:
        # Debug: Print the token being used (only first 10 chars for security)
        logger.info(f"Attempting to validate token: {token[:10]}...")
        
        # Decode the token
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            logger.info(f"Decoded payload: {payload}")
            
            # Get user identifier from token (prefer user_id over email)
            user_id = payload.get("user_id") or payload.get("sub")
            email = payload.get("email")
            
            logger.info(f"User ID from token: {user_id}")
            logger.info(f"Email from token: {email}")
            
            if not user_id and not email:
                logger.error("No user identifier found in token")
                raise credentials_exception
            
            # Try to get user by ID first (more reliable)
            user = None
            if user_id:
                logger.info(f"Attempting to get user by ID: {user_id}")
                try:
                    user = db.query(User).filter(User.id == int(user_id)).first()
                except (ValueError, TypeError):
                    logger.warning(f"Invalid user_id format in token: {user_id}")
            
            # Fallback to email if user not found by ID
            if not user and email:
                logger.info(f"User not found by ID, trying email: {email}")
                user = db.query(User).filter(User.email == email).first()
            
            if not user:
                logger.error("User not found in database")
                raise credentials_exception
                
            # Check if user is active
            if not user.is_active:
                logger.warning(f"User {user.id} is inactive")
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Inactive user"
                )
                
            logger.info(f"Successfully authenticated user: {user.email} (ID: {user.id})")
            return user
            
        except JWTError as e:
            logger.error(f"JWT validation error: {str(e)}")
            raise credentials_exception
            
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        print(f"Unexpected error in get_current_user: {str(e)}")
        raise credentials_exception

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(
    request: Request,
    user_data: UserCreate, 
    db: Session = Depends(get_db)
):
    """
    Register a new user and return access token
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
        # Validate password requirement for non-Google users
        if not user_data.google_id and not user_data.password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password is required for registration"
            )

        # Create new user
        hashed_password = get_password_hash(user_data.password) if user_data.password else None
        if not user_data.google_id and not hashed_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password hashing failed"
            )
            
        db_user = User(
            email=user_data.email,
            password_hash=hashed_password,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            gender=user_data.gender,
            mobile_number=user_data.mobile_number,
            is_active=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            google_id=user_data.google_id
        )
        
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        logger.info(f"User registered successfully: {user_data.email}")
        
        # Create access and refresh tokens
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={
                "sub": str(db_user.id),
                "email": db_user.email,
                "user_id": db_user.id,
            },
            expires_delta=access_token_expires,
        )
        
        refresh_token_expires = timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        refresh_token = create_refresh_token(db_user.id, db, expires_delta=refresh_token_expires)
        
        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Registration error for {user_data.email}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
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
    if not user:
        logger.warning(f"User not found: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Verify password - log more details if verification fails
    if not user.password_hash:
        logger.error(f"User {form_data.username} has no password hash")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not verify_password(form_data.password, user.password_hash):
        logger.warning(f"Password verification failed for user: {form_data.username}")
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
            "user_id": user.id,
        },
        expires_delta=access_token_expires,
    )
    
    # Create a new refresh token and save it to the database
    refresh_token_expires = timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    refresh_token = create_refresh_token(user.id, db, expires_delta=refresh_token_expires)

    logger.info(f"Successful login for user: {user.email}")

    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=int(access_token_expires.total_seconds())
    )

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
    
    try:
        # Verify the refresh token
        user = verify_refresh_token(refresh_request.refresh_token, db)
        if not user:
            logger.warning("Invalid refresh token provided")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token. Please log in again.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Create new access token with user details
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={
                "sub": str(user.id),
                "email": user.email,
                "user_id": user.id,  # Explicitly include user_id
                "type": "access"    # Explicitly set token type
            },
            expires_delta=access_token_expires
        )
        
        logger.info(f"Successfully refreshed token for user {user.email}")
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_request.refresh_token,  # Keep the same refresh token
            "token_type": "bearer",
            "expires_in": int(access_token_expires.total_seconds())
        }
        
    except JWTError as e:
        logger.error(f"JWT error during token refresh: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        logger.error(f"Unexpected error during token refresh: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while refreshing the token"
        )

@router.get("/profile", response_model=UserProfileResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get the current user's profile information.
    Uses the format_user_response helper to ensure consistent response format.
    """
    try:
        # Use the helper function to format the response
        profile_data = format_user_response(current_user)
        
        # Log the profile data for debugging
        logger.info(f"Returning profile data for user {current_user.id}")
        
        return profile_data
        
    except Exception as e:
        logger.error(f"Error getting user profile: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while retrieving your profile."
        )

@router.get("/users/me", response_model=UserProfileResponse)
async def read_users_me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get the current user's profile information.
    This endpoint is an alias for /auth/profile for compatibility.
    """
    logger.info(f"Returning profile data for user {current_user.id}")
    return format_user_response(current_user)

# Also add a non-prefixed version for backward compatibility
@router.get("/me", response_model=UserProfileResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get the current user's profile information.
    """
    logger.info(f"Returning profile data for user {current_user.id}")
    return format_user_response(current_user)

@router.put("/users/me/", response_model=UserResponse)
async def update_user_profile(
    first_name: Optional[str] = Form(None),
    last_name: Optional[str] = Form(None),
    gender: Optional[str] = Form(None),
    mobile_number: Optional[str] = Form(None),
    date_of_birth: Optional[str] = Form(None),
    address: Optional[str] = Form(None),
    city: Optional[str] = Form(None),
    state: Optional[str] = Form(None),
    country: Optional[str] = Form(None),
    postal_code: Optional[str] = Form(None),
    bio: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update user profile with the provided fields.
    All fields are optional - only provided fields will be updated.
    """
    logger.info(f"Received update request for user {current_user.id}")
    
    # Validate gender if provided
    if gender is not None:
        gender = gender.lower()
        if gender not in ['male', 'female', 'neutral']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid gender. Must be one of: male, female, neutral"
            )
    
    try:
        # Update basic fields if provided
        if first_name is not None:
            current_user.first_name = first_name.strip() if first_name else None
            logger.info(f"Updated first_name to: {current_user.first_name}")
            
        if last_name is not None:
            current_user.last_name = last_name.strip() if last_name else None
            logger.info(f"Updated last_name to: {current_user.last_name}")
            
        # Update gender if provided
        if gender is not None:
            current_user.gender = gender
            logger.info(f"Updated gender to: {current_user.gender}")
            
        # Update mobile number if provided
        if mobile_number is not None:
            cleaned_mobile = mobile_number.strip() if mobile_number and mobile_number.strip() else None
            current_user.mobile_number = cleaned_mobile
            logger.info(f"Updated mobile_number to: {cleaned_mobile}")
            
        # Handle date_of_birth with proper validation
        if date_of_birth is not None:
            try:
                if date_of_birth and date_of_birth.strip():
                    # Parse the date string into a datetime object at the start of the day
                    date_obj = datetime.strptime(date_of_birth.strip(), "%Y-%m-%d")
                    current_user.date_of_birth = date_obj.date()
                    logger.info(f"Updated date_of_birth to: {current_user.date_of_birth}")
                else:
                    current_user.date_of_birth = None
                    logger.info("Cleared date_of_birth")
            except ValueError as e:
                logger.error(f"Error parsing date_of_birth '{date_of_birth}': {e}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid date format. Please use YYYY-MM-DD"
                )
        
        # Update address and other string fields
        update_fields = {
            'address': address,
            'city': city,
            'state': state,
            'country': country,
            'postal_code': postal_code,
            'bio': bio
        }
        
        for field, value in update_fields.items():
            if value is not None:
                # Convert to string, strip whitespace, and set to None if empty
                cleaned_value = str(value).strip() if value and str(value).strip() else None
                setattr(current_user, field, cleaned_value)
                logger.info(f"Updated {field} to: {cleaned_value}")
            else:
                # Explicitly set to None if the field is not provided
                setattr(current_user, field, None)
                logger.info(f"Set {field} to None")

        # Update the timestamp
        current_user.updated_at = datetime.utcnow()
        
        try:
            # Commit changes to the database
            db.commit()
            db.refresh(current_user)
            
            # Use the helper function to format the response
            response_data = format_user_response(current_user)
            
            return response_data
            
        except Exception as db_error:
            db.rollback()
            logger.error(f"Database error updating profile: {str(db_error)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="An error occurred while updating your profile. Please try again."
            )
            
    except HTTPException:
        raise  # Re-raise HTTP exceptions as-is
        
    except Exception as e:
        logger.error(f"Unexpected error updating profile: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while updating your profile."
        )

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
            # Create new user with all profile fields
            user = User(
                email=email,
                google_id=google_id,
                first_name=first_name or '',
                last_name=last_name or '',
                mobile_number=mobile_number,
                gender=(gender or 'neutral').lower(),
                date_of_birth=None,
                address=None,
                city=None,
                state=None,
                country=None,
                postal_code=None,
                bio=None,
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
            user.first_name = first_name or user.first_name or ''
            user.last_name = last_name or user.last_name or ''
            user.mobile_number = mobile_number or user.mobile_number
            user.gender = (gender or user.gender or 'neutral').lower()
            user.profile_picture = picture or user.profile_picture
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
            "user": format_user_response(user)
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
