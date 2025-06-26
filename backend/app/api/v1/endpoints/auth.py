from datetime import timedelta, datetime, date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Header, Request, Body
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core import security
from app.core.config import settings
from app.db.session import get_db
from app.schemas.token import Token, TokenData, RefreshTokenSchema
from app.models.user import User, AuthProvider
from app.services.user import authenticate_user, create_access_token, get_user_by_email, create_refresh_token, get_refresh_token, revoke_refresh_token
from app.models.refresh_token import RefreshToken

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

router = APIRouter()

class UserRegister(BaseModel):
    email: str
    password: str
    first_name: str
    last_name: Optional[str] = None
    mobile_number: Optional[str] = None

class UserProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[date] = None
    bio: Optional[str] = None
    street_address: Optional[str] = None
    city: Optional[str] = None
    state_province: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    profile_picture: Optional[str] = None

@router.post("/register", response_model=Token)
async def register_user(
    user_data: UserRegister,
    db: Session = Depends(get_db),
    request: Request = None
):
    """
    Register a new user with email and password
    """
    # Check if user already exists
    existing_user = get_user_by_email(db, email=user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    # Create full name from first and last name
    full_name = f"{user_data.first_name} {user_data.last_name}".strip() if user_data.last_name else user_data.first_name
    
    # Create new user
    hashed_password = security.get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        full_name=full_name,
        phone_number=user_data.mobile_number,
        auth_provider=AuthProvider.EMAIL,
        is_active=True,
        is_verified=False
    )
    
    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user"
        )
    
    # Generate access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": new_user.email}, expires_delta=access_token_expires
    )
    # Generate refresh token
    user_agent = request.headers.get('user-agent') if request else None
    ip = request.client.host if request else None
    refresh_token_obj = create_refresh_token(db, new_user.id, user_agent=user_agent, ip=ip, expires_days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    refresh_token = refresh_token_obj.raw_token
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": new_user.id,
        "email": new_user.email,
        "refresh_token": refresh_token,
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "full_name": new_user.full_name,
            "is_active": new_user.is_active,
            "is_verified": new_user.is_verified,
            "auth_provider": new_user.auth_provider.value if new_user.auth_provider else None
        }
    }

@router.post("/login", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
    request: Request = None
):
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    # Generate refresh token
    user_agent = request.headers.get('user-agent') if request else None
    ip = request.client.host if request else None
    refresh_token_obj = create_refresh_token(db, user.id, user_agent=user_agent, ip=ip, expires_days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    refresh_token = refresh_token_obj.raw_token
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "email": user.email,
        "refresh_token": refresh_token
    }


def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    print(f"[DEBUG] Incoming token: {token}")
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[security.ALGORITHM],
            options={"verify_aud": False}
        )
        print(f"[DEBUG] Decoded payload: {payload}")
        user_id = payload.get("sub")
        if user_id is None:
            print("[DEBUG] No user_id in token payload")
            raise credentials_exception
        token_data = TokenData(sub=user_id)
    except JWTError as e:
        print(f"[DEBUG] JWT decode error: {e}")
        raise credentials_exception
    try:
        user_id_int = int(token_data.sub)
    except Exception:
        print("[DEBUG] Could not convert sub to int, got:", token_data.sub)
        raise credentials_exception
    user = db.query(User).filter(User.id == user_id_int).first()
    if user is None:
        print("[DEBUG] No user found for id:", user_id_int)
        raise credentials_exception
    return user


@router.get("/me")
async def read_users_me(current_user: User = Depends(get_current_user)):
    """
    Get current user details
    """
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "phone_number": current_user.phone_number,
        "gender": current_user.gender,
        "date_of_birth": current_user.date_of_birth,
        "bio": current_user.bio,
        "is_active": current_user.is_active,
        "role": current_user.role.value if current_user.role else None,
        "auth_provider": current_user.auth_provider.value if current_user.auth_provider else None,
        "profile_picture": current_user.profile_picture,
        "is_verified": current_user.is_verified,
        "street_address": current_user.street_address,
        "city": current_user.city,
        "state_province": current_user.state_province,
        "country": current_user.country,
        "postal_code": current_user.postal_code,
    }


@router.post("/token", response_model=Token)
async def login_for_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    OAuth2 compatible token login, get an access token for future requests
    This is an alias for /login for compatibility
    """
    return await login_for_access_token(form_data, db)

@router.post("/refresh")
async def refresh_access_token(
    db: Session = Depends(get_db),
    refresh_token: str = Body(..., embed=True),
    request: Request = None
):
    """
    Exchange a valid refresh token for a new access token (and new refresh token).
    """
    token_obj = get_refresh_token(db, refresh_token)
    if not token_obj or not token_obj.is_active or token_obj.expires_at < datetime.utcnow():
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
    user = db.query(User).filter(User.id == token_obj.user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found for refresh token")
    # Revoke the old refresh token
    revoke_refresh_token(db, refresh_token, ip=request.client.host if request else None)
    # Issue new access and refresh tokens
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    user_agent = request.headers.get('user-agent') if request else None
    ip = request.client.host if request else None
    new_refresh_token_obj = create_refresh_token(db, user.id, user_agent=user_agent, ip=ip, expires_days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    new_refresh_token = new_refresh_token_obj.raw_token
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "email": user.email,
        "refresh_token": new_refresh_token
    }

@router.put("/me")
async def update_user_profile(
    profile_data: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    updated = False
    for field, value in profile_data.dict(exclude_unset=True).items():
        setattr(current_user, field, value)
        updated = True
    if updated:
        db.add(current_user)
        db.commit()
        db.refresh(current_user)
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "phone_number": current_user.phone_number,
        "gender": current_user.gender,
        "date_of_birth": current_user.date_of_birth,
        "bio": current_user.bio,
        "is_active": current_user.is_active,
        "role": current_user.role.value if current_user.role else None,
        "auth_provider": current_user.auth_provider.value if current_user.auth_provider else None,
        "profile_picture": current_user.profile_picture,
        "is_verified": current_user.is_verified,
        "street_address": current_user.street_address,
        "city": current_user.city,
        "state_province": current_user.state_province,
        "country": current_user.country,
        "postal_code": current_user.postal_code,
    }
