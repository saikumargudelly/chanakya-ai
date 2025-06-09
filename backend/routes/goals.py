from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from backend.db.session import get_db
from backend.db.models import Goal
from backend.utils.security import get_current_user

router = APIRouter()

from datetime import datetime, timedelta

@router.post("/goals/")
async def create_goal(
    goal: dict,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new financial goal for the current user"""
    try:
        # Validate required fields
        if not all(key in goal for key in ["goalName", "targetAmount", "deadlineMonths"]):
            raise HTTPException(
                status_code=400,
                detail="Missing required fields: goalName, targetAmount, deadlineMonths"
            )
            
        # Convert and validate deadlineMonths
        try:
            deadline_months = int(goal["deadlineMonths"])
            if deadline_months <= 0:
                raise ValueError("deadlineMonths must be a positive integer")
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=400,
                detail="deadlineMonths must be a positive integer"
            )
            
        # Calculate target date
        current_date = datetime.utcnow()
        target_date = current_date + timedelta(days=30 * deadline_months)
        
        db_goal = Goal(
            user_id=current_user.user_id,
            name=goal.get("goalName"),
            target_amount=float(goal.get("targetAmount")),
            current_amount=float(goal.get("savedAmount", 0)),
            deadline_months=deadline_months,
            target_date=target_date,
            created_at=current_date
        )
        
        db.add(db_goal)
        db.commit()
        db.refresh(db_goal)
        
        return {
            "id": db_goal.id,
            "goalName": db_goal.name,
            "targetAmount": float(db_goal.target_amount),
            "deadlineMonths": db_goal.deadline_months,
            "savedAmount": float(db_goal.current_amount or 0),
            "createdAt": db_goal.created_at.isoformat(),
            "targetDate": db_goal.target_date.isoformat() if db_goal.target_date else None
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
        # Get user ID from different possible attributes
        user_id = getattr(current_user, 'user_id', None) or getattr(current_user, 'id', None)
        if not user_id:
            raise HTTPException(
                status_code=401,
                detail="Could not determine user ID from authentication token"
            )
            
        print(f"Fetching goals for user_id: {user_id}")
        goals = db.query(Goal).filter(Goal.user_id == user_id).all()
        return [{
            "id": goal.id,
            "goalName": goal.name,
            "targetAmount": float(goal.target_amount),
            "deadlineMonths": goal.deadline_months,
            "savedAmount": float(goal.current_amount or 0),
            "createdAt": goal.created_at.isoformat(),
            "targetDate": goal.target_date.isoformat() if goal.target_date else None
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
            
        # Update fields
        update_data = {}
        for key, value in goal.items():
            if key == "goalName":
                update_data["name"] = value
            elif key == "targetAmount":
                update_data["target_amount"] = float(value)
            elif key == "deadlineMonths":
                try:
                    deadline_months = int(value)
                    if deadline_months <= 0:
                        raise ValueError("deadlineMonths must be a positive integer")
                    update_data["deadline_months"] = deadline_months
                    # Update target_date when deadline_months changes
                    update_data["target_date"] = datetime.utcnow() + timedelta(days=30 * deadline_months)
                except (ValueError, TypeError):
                    raise HTTPException(
                        status_code=400,
                        detail="deadlineMonths must be a positive integer"
                    )
            elif key == "savedAmount":
                update_data["current_amount"] = float(value)
        
        # Apply updates
        for key, value in update_data.items():
            setattr(db_goal, key, value)
                
        db_goal.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_goal)
        
        return {
            "id": db_goal.id,
            "goalName": db_goal.name,
            "targetAmount": float(db_goal.target_amount),
            "deadlineMonths": db_goal.deadline_months,
            "savedAmount": float(db_goal.current_amount or 0),
            "createdAt": db_goal.created_at.isoformat(),
            "targetDate": db_goal.target_date.isoformat() if db_goal.target_date else None
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
        # Get user ID from different possible attributes
        user_id = getattr(current_user, 'user_id', None) or getattr(current_user, 'id', None)
        if not user_id:
            raise HTTPException(
                status_code=401,
                detail="Could not determine user ID from authentication token"
            )
            
        print(f"Deleting goal {goal_id} for user_id: {user_id}")
        
        db_goal = db.query(Goal).filter(
            Goal.id == goal_id,
            Goal.user_id == user_id
        ).first()
        
        if not db_goal:
            raise HTTPException(status_code=404, detail="Goal not found")
            
        db.delete(db_goal)
        db.commit()
        return {"message": "Goal deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
