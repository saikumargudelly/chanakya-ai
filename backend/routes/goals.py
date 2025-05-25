from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import uuid

from backend.db.session import get_db
from backend.db.models import Goal
from backend.utils.security import get_current_user

router = APIRouter()

@router.post("/goals/")
async def create_goal(
    goal: dict,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new financial goal for the current user"""
    try:
        db_goal = Goal(
            id=str(uuid.uuid4()),
            user_id=current_user.user_id,
            name=goal.get("goalName"),
            target_amount=goal.get("targetAmount"),
            deadline_months=goal.get("deadlineMonths"),
            saved_amount=goal.get("savedAmount", 0),
            created_at=datetime.utcnow()
        )
        db.add(db_goal)
        db.commit()
        db.refresh(db_goal)
        return {
            "id": db_goal.id,
            "goalName": db_goal.name,
            "targetAmount": float(db_goal.target_amount),
            "deadlineMonths": db_goal.deadline_months,
            "savedAmount": float(db_goal.saved_amount),
            "createdAt": db_goal.created_at.isoformat()
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/goals/", response_model=List[dict])
async def get_goals(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get all goals for the current user"""
    try:
        goals = db.query(Goal).filter(Goal.user_id == current_user.user_id).all()
        return [{
            "id": goal.id,
            "goalName": goal.name,
            "targetAmount": float(goal.target_amount),
            "deadlineMonths": goal.deadline_months,
            "savedAmount": float(goal.saved_amount),
            "createdAt": goal.created_at.isoformat()
        } for goal in goals]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/goals/{goal_id}")
async def update_goal(
    goal_id: str,
    goal: dict,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update an existing goal"""
    try:
        db_goal = db.query(Goal).filter(
            Goal.id == goal_id,
            Goal.user_id == current_user.user_id
        ).first()
        
        if not db_goal:
            raise HTTPException(status_code=404, detail="Goal not found")
            
        for key, value in goal.items():
            if key == "goalName":
                setattr(db_goal, "name", value)
            elif key == "targetAmount":
                setattr(db_goal, "target_amount", value)
            elif key == "deadlineMonths":
                setattr(db_goal, "deadline_months", value)
            elif key == "savedAmount":
                setattr(db_goal, "saved_amount", value)
                
        db.commit()
        db.refresh(db_goal)
        
        return {
            "id": db_goal.id,
            "goalName": db_goal.name,
            "targetAmount": float(db_goal.target_amount),
            "deadlineMonths": db_goal.deadline_months,
            "savedAmount": float(db_goal.saved_amount),
            "createdAt": db_goal.created_at.isoformat()
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/goals/{goal_id}")
async def delete_goal(
    goal_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Delete a goal"""
    try:
        db_goal = db.query(Goal).filter(
            Goal.id == goal_id,
            Goal.user_id == current_user.user_id
        ).first()
        
        if not db_goal:
            raise HTTPException(status_code=404, detail="Goal not found")
            
        db.delete(db_goal)
        db.commit()
        return {"message": "Goal deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
