from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from starlette import status

from backend.db.models import Budget
from backend.db.session import get_db
from backend.utils.security import get_current_user

router = APIRouter()

class BudgetBase(BaseModel):
    income: float
    expenses: Dict[str, float]

class BudgetResponse(BudgetBase):
    total_expenses: float
    savings: float
    advice: str
    history: List[Dict[str, Any]]
    
    class Config:
        from_attributes = True

@router.get('', response_model=BudgetResponse)
async def get_latest_budget(
    current_user: Any = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get the budget for the current month for the current user
    """
    user_id = current_user.user_id if hasattr(current_user, 'user_id') else None
    if not user_id:
        raise HTTPException(status_code=400, detail='Invalid user information')
    
    # Get the budget for the current month
    now = datetime.utcnow()
    month_start = datetime(now.year, now.month, 1)
    next_month = (month_start.replace(day=28) + timedelta(days=4)).replace(day=1)

    budget = db.query(Budget).filter(
        Budget.user_id == user_id,
        Budget.timestamp >= month_start,
        Budget.timestamp < next_month
    ).first()

    if not budget:
        return BudgetResponse(
            income=0.0,
            expenses={},
            total_expenses=0.0,
            savings=0.0,
            advice="No budget data yet. Add your first budget!",
            history=[]
        )
    
    total_expenses = sum(budget.expenses.values()) if budget.expenses else 0
    savings = budget.income - total_expenses
    
    # Generate advice based on savings
    if savings > 0:
        advice = "Good job! Keep tracking your spending."
    elif savings < 0:
        advice = "Consider reducing expenses to save more."
    else:
        advice = "Your income and expenses are balanced."
    
    return BudgetResponse(
        income=budget.income,
        expenses=budget.expenses,
        total_expenses=total_expenses,
        savings=savings,
        advice=advice,
        history=[]
    )

@router.post('', response_model=BudgetResponse)
async def create_or_update_budget(
    budget_data: BudgetBase,
    current_user: Any = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    print(f"[DEBUG] POST /budget - current_user: {current_user}")
    user_id = getattr(current_user, 'user_id', None)
    print(f"[DEBUG] POST /budget - user_id: {user_id}")
    print(f"[DEBUG] POST /budget - budget_data: {budget_data}")
    """
    Create or update budget for the current month
    """
    try:
        # Extract user_id from current_user
        user_id = current_user.user_id if hasattr(current_user, 'user_id') else None
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='Invalid user information'
            )
        # Clean up old records for this month with user_id=None or empty expenses
        now = datetime.utcnow()
        month_start = datetime(now.year, now.month, 1)
        next_month = (month_start.replace(day=28) + timedelta(days=4)).replace(day=1)
        
        # First, delete records with user_id=None
        db.query(Budget).filter(
            (Budget.user_id == None),
            Budget.timestamp >= month_start,
            Budget.timestamp < next_month
        ).delete(synchronize_session=False)
        
        # Removed buggy SQL block that checked for empty array expenses, since expenses is always a dict/object.
        db.commit()
        
        # Process budget data
        income = budget_data.income
        expenses = budget_data.expenses or {}
        
        if not isinstance(expenses, dict):
            expenses = {}
            
        total_expenses = sum(expenses.values()) if expenses else 0
        savings = income - total_expenses
        advice = "Good job! Keep tracking your spending." if savings > 0 else "Consider reducing expenses to save more."
        
        # Upsert logic: find record for user & current month
        query = db.query(Budget).filter(
            Budget.user_id == user_id,
            Budget.timestamp >= month_start,
            Budget.timestamp < next_month
        )
        
        existing = query.first()
        if existing:
            # Update existing budget
            existing.income = income
            existing.expenses = expenses
            existing.timestamp = now
        else:
            # Create new budget
            budget_entry = Budget(
                user_id=user_id,
                income=income,
                expenses=expenses,
                timestamp=now
            )
            db.add(budget_entry)
            
        db.commit()
        
        return {
            "income": income,
            "expenses": expenses,
            "total_expenses": total_expenses,
            "savings": savings,
            "advice": advice,
            "history": []
        }
        
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Exception in create_or_update_budget: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class BudgetHistoryItem(BaseModel):
    income: float
    expenses: Dict[str, float]
    timestamp: str
    
    class Config:
        from_attributes = True

class BudgetHistoryResponse(BaseModel):
    budgets: List[BudgetHistoryItem]

@router.get('/history', response_model=BudgetHistoryResponse)
async def get_budgets(
    current_user: Any = Depends(get_current_user),
    db: Session = Depends(get_db),
    request: Request = None
):
    """
    Get all budgets for the current user
    """
    try:
        # Extract user_id from current_user
        user_id = current_user.user_id if hasattr(current_user, 'user_id') else None
        if not user_id:
            raise HTTPException(
                status_code=400,
                detail='Invalid user information'
            )
            
        # Get all budgets for the current user, ordered by most recent first
        budgets = db.query(Budget)\
            .filter(Budget.user_id == user_id)\
            .order_by(Budget.timestamp.desc())\
            .all()
            
        budget_history = [
            {
                "income": b.income,
                "expenses": b.expenses,
                "timestamp": b.timestamp.isoformat() if b.timestamp else None
            } for b in budgets
        ]
        
        return BudgetHistoryResponse(budgets=budget_history)
        
    except Exception as e:
        print(f"[ERROR] Exception in get_budgets: {e}")
        raise HTTPException(status_code=500, detail=str(e))
