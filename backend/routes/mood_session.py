from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from datetime import datetime, date, time, timedelta
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

from backend.db.models import MoodSession
from backend.db.session import get_db
from backend.utils.security import get_current_user, TokenData

router = APIRouter()

class MoodSessionCreate(BaseModel):
    perma_scores: Dict[str, float]
    answers: List[Any]
    summary: Optional[str] = ""

class MoodSessionResponse(BaseModel):
    id: int
    user_id: Optional[int]
    perma_scores: Dict[str, float]
    answers: List[Any]
    summary: str
    timestamp: datetime

    class Config:
        from_attributes = True

@router.post("", response_model=MoodSessionResponse)
async def save_mood_session(
    mood_session: MoodSessionCreate,
    current_user: TokenData = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Check daily limit
        today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start.replace(hour=23, minute=59, second=59, microsecond=999999)
        
        # Extract user_id from token data
        user_id = current_user.user_id
        
        # Check if user has reached daily limit
        session_count = db.query(MoodSession).filter(
            MoodSession.user_id == user_id,
            MoodSession.timestamp >= today_start,
            MoodSession.timestamp <= today_end
        ).count()
        
        if session_count >= 3:
            raise HTTPException(
                status_code=400,
                detail="Daily limit of 3 mood sessions reached"
            )
        
        # Create new mood session
        new_session = MoodSession(
            user_id=user_id,
            perma_scores=mood_session.perma_scores,
            answers=mood_session.answers,
            summary=mood_session.summary
        )
        
        db.add(new_session)
        db.commit()
        db.refresh(new_session)
        
        return new_session
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@router.get("", response_model=List[MoodSessionResponse])
async def get_mood_sessions(
    date: Optional[date] = None,
    current_user: Any = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get mood sessions for the current user, optionally filtered by date
    """
    try:
        user_id = current_user.user_id if hasattr(current_user, 'user_id') else current_user
        print(f"Fetching mood sessions for user_id: {user_id} and date: {date}")
        query = db.query(MoodSession).filter(MoodSession.user_id == user_id)
        if date:
            start = datetime.combine(date, time.min)
            end = datetime.combine(date, time.max)
            query = query.filter(and_(
                MoodSession.timestamp >= start,
                MoodSession.timestamp <= end
            ))
        sessions = query.order_by(MoodSession.timestamp.desc()).all()
        return sessions
    except Exception as e:
        print(f"Error in get_mood_sessions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/daily-count", response_model=Dict[str, Any])
async def get_daily_session_count(
    current_user: Any = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get the count of mood sessions for the current user today
    """
    try:
        user_id = current_user.user_id if hasattr(current_user, 'user_id') else current_user
        today = datetime.utcnow().date()
        start = datetime.combine(today, time.min)
        end = datetime.combine(today, time.max)
        
        count = db.query(func.count(MoodSession.id))\
            .filter(
                MoodSession.user_id == user_id,
                MoodSession.timestamp >= start,
                MoodSession.timestamp <= end
            ).scalar()
            
        return {
            "count": count,
            "can_check_in": count < 2,
            "next_check_in": None if count < 2 else (datetime.combine(today + timedelta(days=1), time.min)).isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
