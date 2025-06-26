from fastapi import APIRouter, Depends, HTTPException, Request, Body
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

from app.models.mood_session import Mood
from app.db.session import get_db
from app.api.v1.endpoints.auth import get_current_user

class MoodCreate(BaseModel):
    mood: str

router = APIRouter()

@router.post('', response_model=Dict[str, Any])
async def log_mood(
    mood_data: MoodCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Log a mood entry for the current user
    """
    mood = mood_data.mood
    user_id = getattr(current_user, 'user_id', None) or getattr(current_user, 'id', None)
    if not user_id:
        raise HTTPException(status_code=400, detail="Invalid user information")
    timestamp = datetime.utcnow()
    try:
        mood_entry = Mood(
            user_id=user_id,
            mood=mood,
            timestamp=timestamp
        )
        db.add(mood_entry)
        db.commit()
        db.refresh(mood_entry)
        moods = db.query(Mood)\
            .filter(Mood.user_id == user_id)\
            .order_by(Mood.timestamp.desc())\
            .limit(7)\
            .all()
        mood_history = [
            {"mood": m.mood, "timestamp": m.timestamp.isoformat()} 
            for m in reversed(moods)
        ]
        return {
            "status": "success", 
            "mood": mood, 
            "timestamp": timestamp.isoformat(), 
            "history": mood_history
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get('/history', response_model=List[Dict[str, Any]])
async def get_mood_history(
    days: int = 7,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get mood history for the current user
    """
    user_id = getattr(current_user, 'user_id', None) or getattr(current_user, 'id', None)
    if not user_id:
        raise HTTPException(status_code=400, detail="Invalid user information")
    if days <= 0 or days > 365:
        raise HTTPException(status_code=400, detail="Days must be between 1 and 365")
    try:
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        moods = db.query(Mood)\
            .filter(
                Mood.user_id == user_id,
                Mood.timestamp >= start_date,
                Mood.timestamp <= end_date
            )\
            .order_by(Mood.timestamp.asc())\
            .all()
        return [
            {
                "id": m.id,
                "mood": m.mood,
                "timestamp": m.timestamp.isoformat()
            }
            for m in moods
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 