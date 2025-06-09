from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth,
    users,
    transactions,
    goals,
    wellness,
    chat
)

api_router = APIRouter()

# Include all API endpoints
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(transactions.router, prefix="/transactions", tags=["Transactions"])
api_router.include_router(goals.router, prefix="/goals", tags=["Financial Goals"])
api_router.include_router(wellness.router, prefix="/wellness", tags=["Wellness"])
api_router.include_router(chat.router, prefix="/chat", tags=["Chat"])
