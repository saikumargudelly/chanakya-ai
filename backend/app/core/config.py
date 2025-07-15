from pydantic_settings import BaseSettings
from typing import List, Optional
from pathlib import Path
import os

class Settings(BaseSettings):
    # Project
    PROJECT_NAME: str = "Chanakya AI"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = "your-secret-key-here"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    ALGORITHM: str = "HS256"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000", 
        "http://localhost:8000",
        "http://localhost:5001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5001"
    ]
    
    # Database - Use SQLite for development
    DATABASE_URL: str = "sqlite:///./chanakya.db"
    TEST_DATABASE_URL: str = "sqlite:///./test.db"
    
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
    BACKEND_URL: str = "http://localhost:8000"
    
    # AI
    OPENAI_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    
    # Google OAuth
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    
    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    WORKERS: int = 1
    
    # Logging
    LOG_LEVEL: str = "DEBUG"
    LOG_FILE: str = "logs/chanakya-backend.log"
    
    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "ignore"

# Load settings
settings = Settings()

# Override database URL if PostgreSQL is configured in .env
if os.getenv("DATABASE_URL") and "postgresql" in os.getenv("DATABASE_URL", ""):
    settings.DATABASE_URL = os.getenv("DATABASE_URL")
