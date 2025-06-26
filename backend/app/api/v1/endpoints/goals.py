from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.models.goal import Goal
from app.models.user import User
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter()

class GoalCreate(BaseModel):
    title: str
    description: Optional[str] = None
    target_amount: float
    current_amount: float = 0.0
    deadline: Optional[datetime] = None

class GoalUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    target_amount: Optional[float] = None
    current_amount: Optional[float] = None
    deadline: Optional[datetime] = None

class GoalResponse(BaseModel):
    id: int
    user_id: int
    title: str
    description: Optional[str]
    target_amount: float
    current_amount: float
    deadline: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True

@router.get("/", response_model=List[GoalResponse])
async def get_goals(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all goals for the current user"""
    goals = db.query(Goal).filter(Goal.user_id == current_user.id).all()
    return goals

@router.post("/", response_model=GoalResponse, status_code=status.HTTP_201_CREATED)
async def create_goal(
    goal_data: GoalCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new goal for the current user"""
    goal = Goal(
        user_id=current_user.id,
        title=goal_data.title,
        description=goal_data.description,
        target_amount=goal_data.target_amount,
        current_amount=goal_data.current_amount,
        deadline=goal_data.deadline
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal

@router.get("/{goal_id}", response_model=GoalResponse)
async def get_goal(
    goal_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific goal by ID"""
    goal = db.query(Goal).filter(
        Goal.id == goal_id,
        Goal.user_id == current_user.id
    ).first()
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found"
        )
    return goal

@router.put("/{goal_id}", response_model=GoalResponse)
async def update_goal(
    goal_id: int,
    goal_data: GoalUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a specific goal"""
    goal = db.query(Goal).filter(
        Goal.id == goal_id,
        Goal.user_id == current_user.id
    ).first()
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found"
        )
    
    update_data = goal_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(goal, field, value)
    
    db.commit()
    db.refresh(goal)
    return goal

@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_goal(
    goal_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a specific goal"""
    goal = db.query(Goal).filter(
        Goal.id == goal_id,
        Goal.user_id == current_user.id
    ).first()
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found"
        )
    
    db.delete(goal)
    db.commit()
    return None

@router.post("/goals/")
async def create_goal(
    goal: dict,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    try:
        if not all(key in goal for key in ["goalName", "targetAmount", "deadlineMonths"]):
            raise HTTPException(
                status_code=400,
                detail="Missing required fields: goalName, targetAmount, deadlineMonths"
            )
        try:
            deadline_months = int(goal["deadlineMonths"])
            if deadline_months <= 0:
                raise ValueError("deadlineMonths must be a positive integer")
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=400,
                detail="deadlineMonths must be a positive integer"
            )
        current_date = datetime.utcnow()
        target_date = current_date + timedelta(days=30 * deadline_months)
        db_goal = Goal(
            user_id=getattr(current_user, 'user_id', None) or getattr(current_user, 'id', None),
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
    try:
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
    try:
        db_goal = db.query(Goal).filter(
            Goal.id == goal_id,
            Goal.user_id == getattr(current_user, 'user_id', None) or getattr(current_user, 'id', None)
        ).first()
        if not db_goal:
            raise HTTPException(status_code=404, detail="Goal not found")
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
                    update_data["target_date"] = datetime.utcnow() + timedelta(days=30 * deadline_months)
                except (ValueError, TypeError):
                    raise HTTPException(
                        status_code=400,
                        detail="deadlineMonths must be a positive integer"
                    )
            elif key == "savedAmount":
                update_data["current_amount"] = float(value)
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
    try:
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