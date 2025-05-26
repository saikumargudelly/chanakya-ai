import os
import sys
import time
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List, Callable, Tuple
from uuid import uuid4
from pathlib import Path
from dotenv import load_dotenv

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load environment variables from the root .env file
env_path = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

from fastapi import FastAPI, HTTPException, Depends, status, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
from fastapi.middleware import Middleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
from pydantic import BaseModel, Field
import uvicorn
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.types import ASGIApp
import requests
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('app.log')
    ]
)
logger = logging.getLogger(__name__)

# Rate limiting
limiter = Limiter(key_func=get_remote_address)

# Request ID middleware
class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request.state.request_id = str(uuid4())
        response = await call_next(request)
        response.headers['X-Request-ID'] = request.state.request_id
        return response

# Request logging middleware
class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        response = await call_next(request)
        process_time = time.time() - start_time
        
        log_data = {
            'request_id': request.state.request_id,
            'method': request.method,
            'url': str(request.url),
            'status_code': response.status_code,
            'process_time': f"{process_time:.4f}s"
        }
        logger.info(log_data)
        
        return response

# Security headers middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers.update({
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
            'Content-Security-Policy': "default-src 'self'"
        })
        return response

# Import routers
from backend.routes.chat import router as chat_router
from backend.routes.budget import router as budget_router
from backend.routes.mood import router as mood_router
from backend.routes.auth import router as auth_router
from backend.routes.mood_session import router as mood_session_router
from backend.routes.goals import router as goals_router
from backend.chanakya_chain.prompts import PERMA_PROMPT_TEMPLATE

# Explicitly load .env from the project root
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

# Initialize FastAPI with middleware
app = FastAPI(
    title="Chanakya AI Financial Wellness Coach API",
    description="API for the Chanakya AI Financial Wellness Coach application",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    middleware=[
        Middleware(RequestIDMiddleware),
        Middleware(RequestLoggingMiddleware),
        Middleware(SecurityHeadersMiddleware)
    ]
)

# Add rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Add GZip compression
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Add HTTPS redirect in production
if os.getenv('ENV') == 'production':
    app.add_middleware(HTTPSRedirectMiddleware)

# Configure CORS
# In development, allow all origins for easier development
# In production, you should specify exact origins
is_production = os.getenv('ENV') == 'production'

# Allow all origins in development, specific origins in production
origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if is_production else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition", "Content-Length"],
    max_age=600  # Cache preflight requests for 10 minutes
)

# Add CORS headers to all responses
@app.middleware("http")
async def add_cors_header(request: Request, call_next):
    if request.method == "OPTIONS":
        response = Response(status_code=204)
    else:
        response = await call_next(request)
        
    # Get the origin from the request
    origin = request.headers.get('origin')
    
    # In development, allow all origins
    if not is_production:
        response.headers['Access-Control-Allow-Origin'] = origin or "*"
    # In production, only allow specific origins
    elif origin in origins:
        response.headers['Access-Control-Allow-Origin'] = origin
    
    # Add other CORS headers
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS, PATCH'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, X-Forwarded-For, Accept, Origin, Accept-Encoding, Accept-Language, Cache-Control, Pragma, Referer, User-Agent'
    
    return response
    return response

# Add request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    print(f"Incoming request: {request.method} {request.url}")
    print(f"Headers: {dict(request.headers)}")
    response = await call_next(request)
    return response

# Include routers
app.include_router(chat_router, tags=["chat"])
app.include_router(budget_router, prefix="/budget", tags=["budget"])
app.include_router(mood_router, prefix="/mood", tags=["mood"])
# Auth routes already include the /auth prefix in their definitions
app.include_router(auth_router, tags=["auth"])
app.include_router(mood_session_router, prefix="/mood-session", tags=["mood-session"])
app.include_router(goals_router, prefix="/api", tags=["goals"])

# Request/Response Models
class PermaChatRequest(BaseModel):
    summary: str = ""
    userMessage: str = ""
    perma_scores: Dict[str, float] = {}
    history: str = ""

class PermaChatResponse(BaseModel):
    response: str

# Global exception handler
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "request_id": request.state.request_id
        }
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "Internal server error",
            "request_id": request.state.request_id
        }
    )

# Health check model
class HealthCheckResponse(BaseModel):
    status: str
    version: str
    timestamp: datetime
    uptime: float

# Import get_current_user for dependency injection
default_import_marker = True  # To ensure we don't duplicate imports
try:
    from backend.utils.security import get_current_user
except ImportError:
    from utils.security import get_current_user

# Routes

@app.get("/dashboard", tags=["Dashboard"])
async def get_dashboard(request: Request, current_user: Any = Depends(get_current_user)):
    """
    Aggregate and return dashboard data for the authenticated user.
    TODO: Replace with actual aggregation from budget, mood, goals, etc.
    """
    dashboard_data = {
        "message": "Dashboard data goes here"
        # TODO: Populate with real data from DB/models
    }
    return JSONResponse(content=dashboard_data)

@app.get("/", tags=["Root"])
@limiter.limit("100/minute")
async def root(request: Request):
    """
    Root endpoint that returns a welcome message
    """
    return {
        "message": "Chanakya AI Financial Wellness Coach API",
        "documentation": "/docs",
        "version": app.version
    }

@app.get("/health", response_model=HealthCheckResponse, tags=["System"])
async def health_check():
    """
    Health check endpoint for monitoring
    """
    return {
        "status": "healthy",
        "version": app.version,
        "timestamp": datetime.utcnow(),
        "uptime": time.time() - app.start_time if hasattr(app, 'start_time') else 0
    }

# Add startup event to record start time
@app.on_event("startup")
async def startup_event():
    app.start_time = time.time()
    logger.info("Application startup complete")

@app.post("/perma-chat", response_model=PermaChatResponse, tags=["AI"])
@limiter.limit("10/minute")  # Rate limit for AI endpoints
async def perma_chat(
    request: Request,
    chat_request: PermaChatRequest,
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())
):
    """
    Process a chat message with PERMA analysis.
    
    - **summary**: Summary of the user's PERMA assessment
    - **userMessage**: The user's message
    - **perma_scores**: Dictionary of PERMA dimension scores
    - **history**: Chat history for context
    """
    try:
        # Log the request
        logger.info(f"Processing PERMA chat request: {chat_request.userMessage[:100]}...")
        
        # Prepare the system prompt and user content
        system_prompt = PERMA_PROMPT_TEMPLATE.strip()
        user_content = (
            f"User's PERMA Scores: {chat_request.perma_scores}\n"
            f"PERMA Summary: {chat_request.summary}\n"
            f"Chat History: {chat_request.history}\n"
            f"User: {chat_request.userMessage}\n"
            "Chanakya:"
        )

        # Compose messages for LLM
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content}
        ]

        # Call Groq LLM (simulate if no key)
        groq_api_key = os.getenv("GROQ_API_KEY")
        if not groq_api_key:
            return PermaChatResponse(
                response="(LLM unavailable) Based on your PERMA summary, try focusing on a small positive action today!"
            )
        
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {groq_api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": "llama3-70b-8192",
                "messages": messages,
                "temperature": 0.7,
                "max_tokens": 500
            },
            timeout=30
        )
        response.raise_for_status()
        
        # Extract and return the response
        llm_response = response.json()["choices"][0]["message"]["content"]
        return PermaChatResponse(response=llm_response)
        
    except requests.RequestException as e:
        print(f"Groq API error: {str(e)}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Response content: {e.response.text}")
        return PermaChatResponse(
            response="I'm having trouble connecting to the AI service at the moment. Please try again later."
        )
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return PermaChatResponse(
            response="An unexpected error occurred. Please try again later."
        )

if __name__ == '__main__':
    uvicorn.run(
        "app:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 5001)),
        reload=os.getenv("ENV") == "development",
        workers=int(os.getenv("WORKERS", 1)),
        log_level="info"
    )