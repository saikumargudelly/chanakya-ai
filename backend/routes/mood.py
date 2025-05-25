from fastapi import APIRouter, Depends, HTTPException, Request, Body
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
import os
from pydantic import BaseModel

from backend.db.models import Mood
from backend.db.session import get_db
from backend.utils.security import get_current_user

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
    
    if not hasattr(current_user, 'user_id') or current_user.user_id is None:
        raise HTTPException(status_code=400, detail="Invalid user information")
    
    user_id = current_user.user_id
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
        
        # Get last 7 moods for dashboard
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
    finally:
        db.close()

@router.get('/history', response_model=List[Dict[str, Any]])
async def get_mood_history(
    days: int = 7,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get mood history for the current user
    """
    if not hasattr(current_user, 'user_id') or current_user.user_id is None:
        raise HTTPException(status_code=400, detail="Invalid user information")
        
    user_id = current_user.user_id
    
    if days <= 0 or days > 365:
        raise HTTPException(status_code=400, detail="Days must be between 1 and 365")
    
    try:
        # Calculate date range
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        # Query mood entries
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
