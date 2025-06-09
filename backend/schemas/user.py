from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class UserBase(BaseModel):
    email: EmailStr
    first_name: str = ""
    last_name: str = ""
    mobile_number: Optional[str] = None
    gender: str = "neutral"

class UserCreate(UserBase):
    password: str

class UserInDB(UserBase):
    id: int
    is_active: bool = True
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    first_name: str
    last_name: str
    mobile_number: Optional[str] = None
    gender: str
    is_active: bool

    class Config:
        from_attributes = True

class UserProfileResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
