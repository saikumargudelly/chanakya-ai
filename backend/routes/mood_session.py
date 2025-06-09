from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from datetime import datetime, date, time, timedelta
from dateutil import parser
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

from backend.db.models import MoodSession
from backend.db.session import get_db
from backend.utils.security import get_current_user, TokenData
from backend.utils.perma_utils import calculate_perma_scores, analyze_mood_trends, get_perma_suggestions

router = APIRouter()

class MoodSessionCreate(BaseModel):
    perma_scores: Dict[str, float]
    answers: List[Dict[str, Any]]
    summary: str = ""
    suggestion: Optional[str] = None
    timestamp: Optional[str] = None

class MoodSessionResponse(BaseModel):
    id: int
    user_id: int
    perma_scores: Dict[str, float]
    answers: List[Dict[str, Any]]
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
    """
    Save a new mood session for the current user
    """
    try:
        import logging
        logger = logging.getLogger(__name__)
        
        logger.info(f"Starting to save mood session for user {current_user.user_id}")
        logger.debug(f"Request data: {mood_session.dict()}")
        
        # Check daily limit
        today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start.replace(hour=23, minute=59, second=59, microsecond=999999)
        
        user_id = current_user.user_id
        
        # Check if user has reached daily limit
        session_count = db.query(MoodSession).filter(
            MoodSession.user_id == user_id,
            MoodSession.timestamp >= today_start,
            MoodSession.timestamp <= today_end
        ).count()
        
        if session_count >= 2:
            error_msg = f"Daily limit of 2 mood sessions reached for user {user_id}"
            logger.warning(error_msg)
            raise HTTPException(
                status_code=400,
                detail=error_msg
            )
        
        # Calculate PERMA scores if not provided
        if not mood_session.perma_scores:
            logger.info("Calculating PERMA scores from answers")
            mood_session.perma_scores = calculate_perma_scores(mood_session.answers)
        
        # Parse timestamp if provided
        timestamp = None
        if mood_session.timestamp:
            try:
                timestamp = parser.parse(mood_session.timestamp)
                logger.debug(f"Parsed timestamp: {timestamp}")
            except Exception as e:
                logger.error(f"Error parsing timestamp {mood_session.timestamp}: {str(e)}")
                timestamp = datetime.utcnow()
        else:
            timestamp = datetime.utcnow()
        
        logger.debug(f"Creating new mood session with timestamp: {timestamp}")
        
        # Create new mood session
        new_session = MoodSession(
            user_id=user_id,
            perma_scores=mood_session.perma_scores,
            answers=mood_session.answers,
            summary=mood_session.summary,
            timestamp=timestamp
        )
        
        logger.debug(f"Adding session to database: {new_session}")
        db.add(new_session)
        logger.debug("Committing transaction")
        db.commit()
        logger.debug("Refreshing session")
        db.refresh(new_session)
        
        logger.info(f"Successfully saved mood session {new_session.id} for user {user_id}")
        return new_session
        
    except HTTPException as http_exc:
        logger.error(f"HTTPException in save_mood_session: {str(http_exc.detail)}", exc_info=True)
        db.rollback()
        raise http_exc
    except Exception as e:
        import traceback
        error_msg = f"Error saving mood session: {str(e)}\n{traceback.format_exc()}"
        logger.error(error_msg)
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=error_msg
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
        
        # Ensure answers are properly formatted as dictionaries
        for session in sessions:
            if session.answers and isinstance(session.answers, list):
                # Convert any integer answers to proper dictionary format
                session.answers = [
                    answer if isinstance(answer, dict) else {
                        "question": f"Question {i+1}",
                        "answer": str(answer),
                        "score": answer,
                        "pillar": "Unknown"
                    }
                    for i, answer in enumerate(session.answers)
                ]
        
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

@router.get("/trends", response_model=Dict[str, Any])
async def get_mood_trends(
    days: int = 7,
    current_user: Any = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get trend analysis of mood sessions for the specified number of days
    """
    try:
        user_id = current_user.user_id if hasattr(current_user, 'user_id') else current_user
        sessions = db.query(MoodSession)\
            .filter(MoodSession.user_id == user_id)\
            .order_by(MoodSession.timestamp.desc())\
            .all()
            
        trends = analyze_mood_trends(sessions, days)
        
        # Get suggestions for declining areas
        suggestions = []
        for pillar, data in trends.items():
            if data.get('trend') == 'declining':
                suggestions.extend(get_perma_suggestions(pillar))
                
        return {
            "trends": trends,
            "suggestions": suggestions
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
