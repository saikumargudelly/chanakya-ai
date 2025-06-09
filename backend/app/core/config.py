from pydantic_settings import BaseSettings
from typing import List, Optional
from pathlib import Path

class Settings(BaseSettings):
    # Project
    PROJECT_NAME: str = "Chanakya AI"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = "your-secret-key-here"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8000"]
    
    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/chanakya"
    TEST_DATABASE_URL: str = "postgresql://user:password@localhost:5432/chanakya_test"
    
    # Email
    SMTP_TLS: bool = True
    SMTP_PORT: int = 587
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAILS_FROM_EMAIL: str = "noreply@chanakya-ai.com"
    EMAILS_FROM_NAME: str = "Chanakya AI"
    
    # Frontend
    FRONTEND_URL: str = "http://localhost:3000"
    
    # AI
    OPENAI_API_KEY: str = ""
    
    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    class Config:
        case_sensitive = True
        env_file = ".env"

# Load settings
settings = Settings()
