from fastapi import APIRouter

from app.api.v1.endpoints import google_auth
from app.api.v1.endpoints import auth
from app.api.v1.endpoints import goals
from app.api.v1.endpoints import budget
from app.api.v1.endpoints import mood_session
from app.api.v1.endpoints import chat
from app.api.v1.endpoints import perma_chat

api_router = APIRouter()

# Include only existing API endpoints
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(google_auth.router, prefix="/auth", tags=["Google Auth"])
api_router.include_router(goals.router, prefix="/goals", tags=["Goals"])
api_router.include_router(budget.router, prefix="/budget", tags=["Budget"])
api_router.include_router(mood_session.router, prefix="/mood-session", tags=["Mood Session"])
api_router.include_router(chat.router)
api_router.include_router(perma_chat.router, prefix="/perma-chat", tags=["PERMA Chat"])

@api_router.get("/health")
async def health_check():
    return {"status": "ok"}
