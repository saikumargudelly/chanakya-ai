#!/usr/bin/env python3
"""
Startup script for Chanakya AI Financial Coach Backend
"""

import os
import sys
import uvicorn
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.core.config import settings

def main():
    """Start the FastAPI server"""
    print("🚀 Starting Chanakya AI Financial Coach Backend...")
    print(f"🔧 Environment: {settings.ENVIRONMENT}")
    print(f"🐛 Debug mode: {settings.DEBUG}")
    print(f"📊 Database: {settings.DATABASE_URL}")
    print(f"🌐 Host: {settings.HOST}")
    print(f"🔌 Port: {settings.PORT}")
    
    # Start the server
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower(),
        access_log=True,
        workers=settings.WORKERS if not settings.DEBUG else 1
    )

if __name__ == "__main__":
    main()
