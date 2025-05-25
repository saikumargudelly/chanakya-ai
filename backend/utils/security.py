from typing import Optional, Dict, Any, Union, Tuple
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer, HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from pydantic import BaseModel, ValidationError
from passlib.context import CryptContext
from sqlalchemy.orm import Session
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Security configuration
import os
from dotenv import load_dotenv

load_dotenv()

# Token expiration times
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))  # 30 minutes
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))  # 7 days

# Security keys and algorithms
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    logger.warning("SECRET_KEY not set in environment variables. Using a default key for development only!")
    SECRET_KEY = "your-secret-key-here-please-change-in-production"

ALGORITHM = "HS256"

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against a hash.
    
    Args:
        plain_password: The plain text password to verify
        hashed_password: The hashed password to compare against
        
    Returns:
        bool: True if the password matches the hash, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """
    Hash a password for storing.
    
    Args:
        password: The plain text password to hash
        
    Returns:
        str: The hashed password
    """
    return pwd_context.hash(password)

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

# Token models
class TokenPayload(BaseModel):
    sub: Optional[str] = None  # Subject (user ID)
    email: Optional[str] = None
    exp: Optional[datetime] = None
    type: Optional[str] = None  # 'access' or 'refresh'
    
    class Config:
        extra = 'ignore'  # Ignore extra fields in the token

class TokenData(TokenPayload):
    user_id: Optional[int] = None
    
    class Config:
        extra = 'ignore'  # Ensure we don't accept extra fields

# JWT token functions
def create_access_token(
    data: Dict[str, Any], 
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a new access token.
    
    Args:
        data: Dictionary containing the token claims
        expires_delta: Optional timedelta for token expiration
        
    Returns:
        str: Encoded JWT token
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({
        "exp": expire,
        "type": "access"
    })
    
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(
    data: Dict[str, Any], 
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a new refresh token.
    
    Args:
        data: Dictionary containing the token claims
        expires_delta: Optional timedelta for token expiration
        
    Returns:
        str: Encoded JWT refresh token
    """
    to_encode = data.copy()
    if not expires_delta:
        expires_delta = timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        
    expire = datetime.utcnow() + expires_delta
    to_encode.update({
        "exp": expire,
        "type": "refresh"
    })
    
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# Token validation
def validate_token(token: str) -> TokenPayload:
    """
    Validate a JWT token and return its payload.
    
    Args:
        token: The JWT token to validate
        
    Returns:
        TokenPayload: The decoded token payload
        
    Raises:
        HTTPException: If the token is invalid or expired
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Decode the token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # Validate required fields
        token_data = TokenPayload(**payload)
        if not token_data.sub or not token_data.exp or not token_data.type:
            logger.warning("Missing required token fields")
            raise credentials_exception
            
        # Check if token is expired
        if hasattr(token_data, 'exp') and token_data.exp is not None:
            current_time = datetime.utcnow()
            
            if isinstance(token_data.exp, (int, float)):
                # exp is a timestamp
                exp_time = datetime.utcfromtimestamp(token_data.exp)
                if current_time > exp_time:
                    logger.warning("Token has expired (timestamp)")
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Token has expired",
                        headers={"WWW-Authenticate": "Bearer"},
                    )
            elif hasattr(token_data.exp, 'replace'):
                # exp is a datetime object
                exp_time = token_data.exp
                # Make both datetimes timezone-naive or timezone-aware for comparison
                if hasattr(exp_time, 'tzinfo') and exp_time.tzinfo is not None:
                    # If exp_time is timezone-aware, make current_time timezone-aware too
                    from datetime import timezone
                    current_time = current_time.replace(tzinfo=timezone.utc)
                else:
                    # If exp_time is timezone-naive, make current_time timezone-naive
                    current_time = current_time.replace(tzinfo=None)
                
                if current_time > exp_time:
                    logger.warning("Token has expired (datetime)")
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Token has expired",
                        headers={"WWW-Authenticate": "Bearer"},
                    )
            else:
                logger.error(f"Unexpected exp type: {type(token_data.exp)}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token format",
                    headers={"WWW-Authenticate": "Bearer"},
                )
        else:
            logger.error("Token missing exp claim")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token format",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        return token_data
        
    except (JWTError, ValidationError) as e:
        logger.error(f"Token validation error: {str(e)}")
        raise credentials_exception

# Get current user from token
async def get_current_user(token: str = Depends(oauth2_scheme)) -> TokenData:
    """
    Get the current user from the JWT token.
    
    Args:
        token: The JWT token from the Authorization header
        
    Returns:
        TokenData: The token data including user information
        
    Raises:
        HTTPException: If the token is invalid or user not found
    """
    token_data = validate_token(token)
    
    # For access tokens, we expect a user_id claim
    if token_data.type != "access":
        logger.warning("Invalid token type for authentication")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        # Log the token data for debugging
        logger.info(f"Token data: {token_data}")
        
        # Get user_id from the token data
        user_id = getattr(token_data, 'user_id', None)
        
        # If user_id is not directly available, try to get it from the sub field
        if user_id is None and hasattr(token_data, 'sub'):
            try:
                # If sub is a string that can be converted to int, use it as user_id
                user_id = int(token_data.sub)
            except (ValueError, TypeError):
                # If sub is not a number, it might be an email, so we'll need to look up the user
                logger.info(f"sub is not a number: {token_data.sub}, will try to find user by email")
                pass
        
        # If we still don't have a user_id, try to get it from the email
        if user_id is None and hasattr(token_data, 'email') and token_data.email:
            try:
                # Import here to avoid circular imports
                from backend.db.models import User
                from backend.db.session import get_db
                
                db = next(get_db())
                user = db.query(User).filter(User.email == token_data.email).first()
                if user:
                    user_id = user.id
                    logger.info(f"Found user ID {user_id} for email {token_data.email}")
            except Exception as e:
                logger.error(f"Error looking up user by email: {str(e)}")
        
        if user_id is None:
            logger.warning("No valid user ID found in token or user not found in database")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="No valid user ID found in token or user not found in database",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Ensure user_id is an integer
        user_id = int(user_id)
            
        # Create a new TokenData object with all the necessary fields
        token_data_dict = {
            'sub': str(user_id),  # Use user_id as sub for compatibility
            'email': getattr(token_data, 'email', None),
            'user_id': user_id,
            'exp': getattr(token_data, 'exp', None),
            'type': getattr(token_data, 'type', 'access')
        }
        
        logger.info(f"Created token data: {token_data_dict}")
        return TokenData(**token_data_dict)
        
    except Exception as e:
        logger.error(f"Error in get_current_user: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

# Security scheme for Swagger UI
security = HTTPBearer()

def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> int:
    """
    Extract and validate user ID from the JWT token.
    
    This is a compatibility function for endpoints that only need the user ID.
    """
    try:
        token = credentials.credentials
        token_data = validate_token(token)
        
        # For access tokens, we expect a user_id claim
        if token_data.type != "access":
            logger.warning("Invalid token type for user ID extraction")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        try:
            return int(token_data.sub)
        except (ValueError, TypeError):
            logger.warning(f"Invalid user ID in token: {token_data.sub}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid user ID in token",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in get_current_user_id: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during authentication",
        )

def get_token_from_request(request: Request) -> Optional[str]:
    """
    Extract the JWT token from the request headers.
    
    Args:
        request: The incoming request
        
    Returns:
        Optional[str]: The JWT token if found, None otherwise
    """
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header.split(" ")[1]
    return None

def verify_refresh_token(token: str, db: Session) -> Dict[str, Any]:
    """
    Verify a refresh token and return the token data if valid.
    
    Args:
        token: The refresh token to verify
        db: Database session
        
    Returns:
        Dict[str, Any]: The token data if valid
        
    Raises:
        HTTPException: If the token is invalid, expired, or revoked
    """
    from db.models import RefreshToken
    
    try:
        # Validate the token structure and signature
        payload = validate_token(token)
        
        # Check if this is a refresh token
        if payload.type != "refresh":
            logger.warning(f"Invalid token type: {payload.type}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Check if the token exists in the database and is active
        db_token = db.query(RefreshToken).filter(
            RefreshToken.token == token,
            RefreshToken.is_active == True,
            RefreshToken.revoked_at.is_(None)
        ).first()
        
        if not db_token:
            logger.warning("Refresh token not found or revoked")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or revoked refresh token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Check if token is expired
        if datetime.utcnow() > db_token.expires_at:
            logger.warning("Refresh token expired")
            # Mark token as revoked
            db_token.is_active = False
            db_token.revoked_at = datetime.utcnow()
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token expired",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return {
            "sub": payload.sub,
            "email": payload.email,
            "user_id": int(payload.sub) if payload.sub and payload.sub.isdigit() else None,
            "refresh_token_id": db_token.id
        }
        
    except JWTError as e:
        logger.error(f"JWT validation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
