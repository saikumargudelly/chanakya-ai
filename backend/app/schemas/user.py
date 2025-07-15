from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class AuthProvider(str, Enum):
    EMAIL = "email"
    GOOGLE = "google"

class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"
    FINANCIAL_ADVISOR = "financial_advisor"

# Shared properties
class UserBase(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    mobile_number: Optional[str] = None
    phone_number: Optional[str] = None
    is_active: Optional[bool] = True
    role: Optional[UserRole] = UserRole.USER

# Base user creation schema
class UserCreateBase(UserBase):
    full_name: str
    
    class Config:
        extra = "ignore"  # Ignore extra fields

# Email/Password user creation
class UserCreate(UserCreateBase):
    email: EmailStr
    password: str
    
    @validator('password')
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v

# Google OAuth user creation
class UserCreateGoogle(UserCreateBase):
    email: EmailStr
    google_id: str
    is_verified: bool = False
    profile_picture: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    mobile_number: Optional[str] = None
    
    @classmethod
    def from_google_token(cls, token_data: Dict[str, Any], people_data: Optional[Dict[str, Any]] = None):
        # Extract basic info from token
        user_data = {
            'email': token_data['email'],
            'google_id': token_data['sub'],
            'full_name': token_data.get('name', ''),
            'is_verified': token_data.get('email_verified', False),
            'profile_picture': token_data.get('picture')
        }
        
        # Extract additional info from People API if available
        if people_data:
            # Extract names
            names = people_data.get('names', [])
            if names:
                user_data['first_name'] = names[0].get('givenName')
                user_data['last_name'] = names[0].get('familyName')
                # If full_name is not set, construct it from first and last name
                if not user_data['full_name']:
                    user_data['full_name'] = f"{user_data['first_name'] or ''} {user_data['last_name'] or ''}".strip()
            
            # Extract gender
            genders = people_data.get('genders', [])
            if genders:
                user_data['gender'] = genders[0].get('value', '').lower()
            
            # Extract birthday
            birthdays = people_data.get('birthdays', [])
            if birthdays:
                date_info = birthdays[0].get('date', {})
                if date_info:
                    try:
                        year = date_info.get('year', 1900)
                        month = date_info.get('month', 1)
                        day = date_info.get('day', 1)
                        user_data['date_of_birth'] = datetime(year, month, day)
                    except (ValueError, TypeError):
                        pass  # Skip invalid dates
            
            # Extract phone numbers
            phone_numbers = people_data.get('phoneNumbers', [])
            if phone_numbers:
                # Look for mobile number first
                for phone in phone_numbers:
                    if phone.get('type') == 'mobile':
                        user_data['mobile_number'] = phone.get('value')
                        break
                # If no mobile, use the first available
                if not user_data['mobile_number'] and phone_numbers:
                    user_data['mobile_number'] = phone_numbers[0].get('value')
        
        return cls(**user_data)

# Union type for any user creation
def UserCreateUnion():
    return UserCreate | UserCreateGoogle

# Properties to receive via API on update
class UserUpdate(UserBase):
    password: Optional[str] = None
    phone_number: Optional[str] = None
    mobile_number: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    gender: Optional[str] = None
    monthly_income: Optional[float] = None
    monthly_expenses: Optional[float] = None
    savings_goal: Optional[float] = None
    bio: Optional[str] = None

# Properties shared by models stored in DB
class UserInDBBase(UserBase):
    id: int
    email: EmailStr
    is_active: bool = True
    role: UserRole = UserRole.USER
    auth_provider: AuthProvider = AuthProvider.EMAIL
    google_id: Optional[str] = None
    profile_picture: Optional[str] = None
    is_verified: bool = False
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }

# Additional properties to return via API
class User(UserInDBBase):
    pass

# Additional properties stored in DB
class UserInDB(UserInDBBase):
    hashed_password: str
