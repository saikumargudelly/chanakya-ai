from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from starlette import status
import logging

from app.models.budget import Budget
from app.db.session import get_db
from app.api.v1.endpoints.auth import get_current_user

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
    try:
        user_id = current_user.id if hasattr(current_user, 'id') else None
        if not user_id:
            raise HTTPException(status_code=400, detail='Invalid user information')
        
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
    
    except SQLAlchemyError as e:
        logging.error(f"Database error in get_latest_budget: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error occurred while fetching budget data"
        )
    except Exception as e:
        logging.error(f"Unexpected error in get_latest_budget: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while fetching budget data"
        )

@router.post('', response_model=BudgetResponse)
async def create_or_update_budget(
    budget_data: BudgetBase,
    current_user: Any = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        user_id = getattr(current_user, 'id', None)
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='Invalid user information'
            )
        
        now = datetime.utcnow()
        month_start = datetime(now.year, now.month, 1)
        next_month = (month_start.replace(day=28) + timedelta(days=4)).replace(day=1)
        
        # Clean up orphaned budget entries
        db.query(Budget).filter(
            (Budget.user_id == None),
            Budget.timestamp >= month_start,
            Budget.timestamp < next_month
        ).delete(synchronize_session=False)
        
        income = budget_data.income
        expenses = budget_data.expenses or {}
        if not isinstance(expenses, dict):
            expenses = {}
        
        total_expenses = sum(expenses.values()) if expenses else 0
        savings = income - total_expenses
        advice = "Good job! Keep tracking your spending." if savings > 0 else "Consider reducing expenses to save more."
        
        query = db.query(Budget).filter(
            Budget.user_id == user_id,
            Budget.timestamp >= month_start,
            Budget.timestamp < next_month
        )
        existing = query.first()
        
        if existing:
            existing.income = income
            existing.expenses = expenses
            existing.timestamp = now
        else:
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
        
    except SQLAlchemyError as e:
        logging.error(f"Database error in create_or_update_budget for user {user_id}: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error occurred while saving budget data"
        )
    except Exception as e:
        logging.error(f"Unexpected error in create_or_update_budget for user {user_id}: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while saving budget data"
        )

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
    user_id = current_user.id if hasattr(current_user, 'id') else None
    if not user_id:
        raise HTTPException(
            status_code=400,
            detail='Invalid user information'
        )
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