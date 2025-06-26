import os
import sys
import time
import logging
import logging.handlers
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List, Callable, Tuple
from uuid import uuid4
from pathlib import Path
from dotenv import load_dotenv

from fastapi import FastAPI, HTTPException, Depends, status, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
from fastapi.middleware.gzip import GZipMiddleware
from pydantic import BaseModel, Field
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.types import ASGIApp
from contextlib import asynccontextmanager

from app.api.v1.api import api_router
from app.core.config import settings

# --- Load environment variables ---
env_path = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# --- Logging Setup ---
os.makedirs('logs', exist_ok=True)
logger = logging.getLogger()
logger.setLevel(logging.DEBUG)

# Clear existing handlers
for handler in logger.handlers[:]:
    logger.removeHandler(handler)

# File handler
file_handler = logging.handlers.RotatingFileHandler(
    'logs/app.log', maxBytes=10*1024*1024, backupCount=5, encoding='utf-8'
)
file_handler.setLevel(logging.DEBUG)

# Console handler
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)

# Custom formatter
class CustomFormatter(logging.Formatter):
    def format(self, record):
        if not hasattr(record, 'request_id'):
            record.request_id = 'SYSTEM'
        return super().format(record)

formatter = CustomFormatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s - [%(filename)s:%(lineno)d] - %(request_id)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

file_handler.setFormatter(formatter)
console_handler.setFormatter(formatter)

logger.addHandler(file_handler)
logger.addHandler(console_handler)

# Set log levels for external libraries
logging.getLogger('sqlalchemy.engine').setLevel(logging.WARNING)
logging.getLogger('urllib3').setLevel(logging.WARNING)
logging.getLogger('google').setLevel(logging.DEBUG)
logging.getLogger('google_auth').setLevel(logging.DEBUG)
logging.getLogger('google_auth_oauthlib').setLevel(logging.DEBUG)
logging.getLogger('oauthlib').setLevel(logging.DEBUG)
logging.getLogger('requests_oauthlib').setLevel(logging.DEBUG)

# --- Lifespan event handler ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Application startup")
    logger.info(f"🔧 Environment: {settings.ENVIRONMENT}")
    logger.info(f"🐛 Debug mode: {settings.DEBUG}")
    logger.info(f"📊 Database: {settings.DATABASE_URL}")
    yield
    logger.info("🛑 Application shutdown")

# --- Middleware ---
class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request.state.request_id = str(uuid4())
        response = await call_next(request)
        response.headers["X-Request-ID"] = request.state.request_id
        return response

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if not hasattr(request.state, 'request_id'):
            request.state.request_id = str(uuid4())
        
        logger = logging.LoggerAdapter(
            logging.getLogger(__name__),
            {'request_id': request.state.request_id}
        )
        
        logger.info(
            f"📥 Request started - Method: {request.method} - Path: {request.url.path} - "
            f"Client: {request.client.host if request.client else 'unknown'}"
        )
        
        start_time = time.time()
        try:
            response = await call_next(request)
        except Exception as e:
            logger.error(f"❌ Request error: {str(e)}", exc_info=True)
            raise
        
        process_time = time.time() - start_time
        response.headers["X-Request-ID"] = request.state.request_id
        
        logger.info(
            f"📤 Request completed - Status: {response.status_code} - "
            f"Process Time: {process_time:.4f}s - "
            f"Client: {request.client.host if request.client else 'unknown'}"
        )
        return response

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Content-Security-Policy"] = "default-src 'self'"
        return response

# --- Exception Handlers ---
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": exc.status_code, "message": exc.detail}},
        headers={"X-Error": "HTTP Error"}
    )

async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"💥 Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"},
        headers={"X-Error": "Internal Server Error"}
    )

# --- FastAPI App Initialization ---
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Chanakya AI - Financial Wellness Coach API",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# --- Middleware Registration ---
app.add_middleware(RequestIDMiddleware)
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(SecurityHeadersMiddleware)

# --- CORS Middleware ---
def get_cors_origins():
    origins = []
    if settings.BACKEND_CORS_ORIGINS:
        origins = [str(origin) for origin in settings.BACKEND_CORS_ORIGINS]
    
    # Always add localhost for dev
    if settings.ENVIRONMENT == "development" or not origins:
        origins += ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    # Remove duplicates
    return list(set(origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add COOP/COEP headers for development
@app.middleware("http")
async def add_coop_coep_headers(request, call_next):
    response = await call_next(request)
    if settings.ENVIRONMENT == "development":
        response.headers["Cross-Origin-Opener-Policy"] = "same-origin-allow-popups"
        response.headers["Cross-Origin-Embedder-Policy"] = "require-corp"
    return response

# --- Exception Handlers Registration ---
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(Exception, global_exception_handler)

# --- API Router Inclusion ---
app.include_router(api_router, prefix=settings.API_V1_STR)

# --- Static Files ---
app.mount("/static", StaticFiles(directory="static"), name="static")

# --- Root and Utility Endpoints ---
@app.get("/")
async def root():
    return {
        "message": "Welcome to Chanakya AI Financial Wellness Coach API",
        "version": "1.0.0",
        "status": "running"
    }

# Health check endpoint
class HealthCheckResponse(BaseModel):
    status: str
    version: str
    timestamp: datetime
    uptime: float

@app.get("/health")
async def health_check():
    return HealthCheckResponse(
        status="healthy",
        version="1.0.0",
        timestamp=datetime.utcnow(),
        uptime=time.time()
    )

@app.get("/debug/config")
async def debug_config():
    """Debug endpoint to check configuration"""
    if not settings.DEBUG:
        raise HTTPException(status_code=404, detail="Not found")
    
    return {
        "environment": settings.ENVIRONMENT,
        "debug": settings.DEBUG,
        "database_url": settings.DATABASE_URL.replace(settings.DATABASE_URL.split('@')[-1], '***') if '@' in settings.DATABASE_URL else settings.DATABASE_URL,
        "cors_origins": get_cors_origins(),
        "api_v1_str": settings.API_V1_STR
    }

@app.get("/debug/routes")
async def debug_routes():
    """Debug endpoint to list all routes"""
    if not settings.DEBUG:
        raise HTTPException(status_code=404, detail="Not found")
    
    routes = []
    for route in app.routes:
        if hasattr(route, 'path'):
            routes.append({
                "path": route.path,
                "methods": getattr(route, 'methods', []),
                "name": getattr(route, 'name', '')
            })
    
    return {"routes": routes}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
