from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Generate a password hash."""
    return pwd_context.hash(password)

# JWT settings
ALGORITHM = "HS256"

def create_access_token(
    data: dict, 
    expires_delta: Optional[timedelta] = None,
    secret_key: Optional[str] = None,
    algorithm: str = ALGORITHM
) -> str:
    """
    Create a new JWT access token.
    
    Args:
        data: Dictionary containing token claims (e.g., sub, user_id, is_superuser)
        expires_delta: Optional timedelta for token expiration
        secret_key: Optional secret key for signing the token (uses settings.SECRET_KEY if not provided)
        algorithm: Hashing algorithm to use (default: HS256)
        
    Returns:
        str: Encoded JWT token
    """
    if not secret_key:
        secret_key = settings.SECRET_KEY
        
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    
    # Standard claims
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "iss": settings.PROJECT_NAME.lower(),
        "aud": settings.PROJECT_NAME.lower()
    })
    
    try:
        return jwt.encode(to_encode, secret_key, algorithm=algorithm)
    except Exception as e:
        raise ValueError(f"Failed to create access token: {str(e)}")

def decode_token(
    token: str, 
    secret_key: Optional[str] = None,
    algorithms: Optional[list[str]] = None,
    audience: Optional[str] = None
) -> Optional[dict]:
    """
    Decode and verify a JWT token.
    
    Args:
        token: JWT token to decode
        secret_key: Optional secret key for verification (uses settings.SECRET_KEY if not provided)
        algorithms: List of allowed algorithms (default: [ALGORITHM])
        audience: Expected audience claim
        
    Returns:
        Optional[dict]: Decoded token payload if valid, None otherwise
    """
    if not secret_key:
        secret_key = settings.SECRET_KEY
    if not algorithms:
        algorithms = [ALGORITHM]
        
    try:
        payload = jwt.decode(
            token,
            secret_key,
            algorithms=algorithms,
            audience=audience or settings.PROJECT_NAME.lower(),
            options={"verify_aud": audience is not None}
        )
        return payload
    except JWTError as e:
        # Log the specific error for debugging
        print(f"JWT Decode Error: {str(e)}")
        return None
    except Exception as e:
        print(f"Unexpected error decoding token: {str(e)}")
        return None
