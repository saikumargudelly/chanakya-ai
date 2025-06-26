from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any
from app.schemas.user import User
from datetime import datetime

class Token(BaseModel):
    """Token response schema including access token and user info."""
    access_token: str
    token_type: str
    user_id: int
    email: EmailStr
    is_new_user: bool = False
    user: Optional[User] = None
    
    class Config:
        schema_extra = {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "user_id": 1,
                "email": "user@example.com",
                "is_new_user": False,
                "user": {
                    "id": 1,
                    "email": "user@example.com",
                    "full_name": "John Doe",
                    "is_active": True,
                    "role": "user",
                    "auth_provider": "google"
                }
            }
        }

class TokenData(BaseModel):
    """Token payload data schema."""
    sub: str  # Subject (typically user's email)
    
    class Config:
        schema_extra = {
            "example": {
                "sub": "user@example.com"
            }
        }

class RefreshTokenSchema(BaseModel):
    token: str
    expires_at: datetime
    is_active: bool
    revoked_at: datetime | None = None
    revoked_by_ip: str | None = None
    user_agent: str | None = None
    user_id: int

    class Config:
        orm_mode = True
