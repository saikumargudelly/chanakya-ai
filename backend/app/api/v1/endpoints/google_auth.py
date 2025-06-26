import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import time

from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from sqlalchemy.orm import Session
from google.auth.transport import requests
from google.oauth2 import id_token
from google.auth.exceptions import GoogleAuthError

from app.core.config import settings
from app.core.security import create_access_token
from app.db.session import get_db
from app.services.user import get_or_create_google_user, create_refresh_token
from app.schemas.token import Token
from app.schemas.user import UserCreateGoogle

# Set up logging
logger = logging.getLogger(__name__)
router = APIRouter(tags=["authentication"])

# Rate limiting configuration
RATE_LIMIT = {
    "max_requests": 10,  # Maximum requests per window
    "window_seconds": 60  # Time window in seconds
}

# Store request counts (in production, use Redis or similar)
request_counts = {}

def check_rate_limit(ip: str) -> bool:
    """Check if the IP address has exceeded the rate limit."""
    current_time = time.time()
    
    # Clean up old entries
    if ip in request_counts:
        last_time = request_counts[ip][1]
        if current_time - last_time > RATE_LIMIT["window_seconds"]:
            del request_counts[ip]
    
    # Check current count
    count, _ = request_counts.get(ip, (0, current_time))
    if count >= RATE_LIMIT["max_requests"]:
        return False
    
    request_counts[ip] = (count + 1, current_time)
    return True

@router.post("/google", status_code=status.HTTP_200_OK)
async def google_auth(
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    """
    Authenticate or register a user using Google OAuth.
    
    This endpoint verifies the Google ID token, creates a new user if they don't exist,
    or updates an existing user with Google OAuth information.
    """
    client_ip = request.client.host if request.client else "unknown"
    logger.info(f"Google auth request from IP: {client_ip}")
    
    # Check rate limiting
    if not check_rate_limit(client_ip):
        logger.warning(f"Rate limit exceeded for IP: {client_ip}")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Please try again later."
        )
    
    try:
        # Get the credential from the request
        payload = await request.json()
        token = payload.get("credential")
        
        if not token:
            logger.warning("No Google credential provided in request")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No Google credential provided"
            )

        # Verify the Google ID token
        try:
            idinfo = id_token.verify_oauth2_token(
                token,
                requests.Request(),
                settings.GOOGLE_CLIENT_ID,
                clock_skew_in_seconds=10  # Allow 10 seconds of clock skew
            )
            logger.debug(f"Successfully verified Google token for: {idinfo.get('email')}")
        except (ValueError, GoogleAuthError) as e:
            logger.error(f"Failed to verify Google token: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Google token"
            ) from e

        # Validate required fields in the token
        if not all(key in idinfo for key in ["sub", "email"]):
            logger.error(f"Missing required fields in Google token: {idinfo.keys()}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid token: missing required fields"
            )

        # Log the authentication attempt
        logger.info(f"Processing Google auth for email: {idinfo.get('email')}")
        
        try:
            # Extract user data from the verified ID token
            user_data = {
                'sub': idinfo.get('sub'),
                'email': idinfo.get('email'),
                'name': idinfo.get('name', ''),
                'picture': idinfo.get('picture'),
                'email_verified': idinfo.get('email_verified', False),
                'first_name': idinfo.get('given_name'),
                'last_name': idinfo.get('family_name'),
                'gender': None,  # Not available in ID token
                'date_of_birth': None,  # Not available in ID token
                'mobile_number': None  # Not available in ID token
            }
            
            # Get or create user with Google OAuth data
            user, is_new_user = get_or_create_google_user(db, user_data)
            logger.info(f"User {'created' if is_new_user else 'authenticated'}: {user.email}")
            
            # Create access token
            access_token = create_access_token(
                data={"sub": str(user.id), "email": user.email}
            )
            
            # Create refresh token
            user_agent = request.headers.get('user-agent')
            ip = request.client.host if request.client else None
            refresh_token_obj = create_refresh_token(
                db=db,
                user_id=user.id,
                user_agent=user_agent,
                ip=ip,
                expires_days=30
            )
            
            # Set refresh token in HTTP-only cookie
            response.set_cookie(
                key="refresh_token",
                value=refresh_token_obj.raw_token,
                httponly=True,
                secure=settings.ENVIRONMENT == "production",
                samesite="lax",
                max_age=30 * 24 * 60 * 60  # 30 days
            )
            
            # Return user data and tokens
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user": {
                    "id": str(user.id),
                    "email": user.email,
                    "full_name": user.full_name,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "gender": user.gender,
                    "date_of_birth": user.date_of_birth.isoformat() if user.date_of_birth else None,
                    "mobile_number": user.mobile_number,
                    "phone_number": user.phone_number,
                    "profile_picture": user.profile_picture,
                    "is_verified": user.is_verified,
                    "is_new_user": is_new_user
                }
            }
            
        except Exception as e:
            logger.error(f"Database error during authentication: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="An error occurred while processing your request"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in Google auth: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )

@router.get("/google/health")
async def google_auth_health():
    return {"status": "ok"}
