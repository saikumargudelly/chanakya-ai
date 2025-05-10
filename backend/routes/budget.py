from flask import Blueprint, request, jsonify
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
import datetime
import os

from db.models import Budget

budget_bp = Blueprint('budget', __name__)

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///chanakya.db")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@budget_bp.route('', methods=['POST'])
def budget():
    data = request.json
    user_id = data.get('user_id', 'default')
    income = data.get('income', 0)
    expenses = data.get('expenses', {})
    if not isinstance(expenses, dict):
        expenses = {}
    try:
        income = float(income)
    except Exception:
        income = 0
    total_expenses = sum(expenses.values()) if isinstance(expenses, dict) else 0
    savings = income - total_expenses
    advice = "Good job! Keep tracking your spending." if savings > 0 else "Consider reducing expenses to save more."

    db = SessionLocal()
    try:
        # Upsert logic: find record for user & current month
        now = datetime.datetime.utcnow()
        month_start = datetime.datetime(now.year, now.month, 1)
        next_month = datetime.datetime(now.year + (now.month // 12), ((now.month % 12) + 1), 1)
        query = db.query(Budget).filter(
            Budget.user_id == (user_id if isinstance(user_id, int) else None),
            Budget.timestamp >= month_start,
            Budget.timestamp < next_month
        )
        existing = query.first()
        if existing:
            # Overwrite income and expenses for edit mode
            existing.income = income
            existing.expenses = expenses
            existing.timestamp = now
            db.commit()
        else:
            budget_entry = Budget(
                user_id=user_id if isinstance(user_id, int) else None,
                income=income,
                expenses=expenses,
                timestamp=now
            )
            db.add(budget_entry)
            db.commit()
    finally:
        db.close()

    # Return all budgets for dashboard/analytics
    db = SessionLocal()
    try:
        budgets = db.query(Budget).filter(Budget.user_id == (user_id if isinstance(user_id, int) else None)).order_by(Budget.timestamp.asc()).all()
        budget_history = [
            {
                "income": b.income,
                "expenses": b.expenses,
                "timestamp": b.timestamp.isoformat()
            } for b in budgets
        ]
    finally:
        db.close()

    return jsonify({
        "income": income,
        "total_expenses": total_expenses,
        "savings": savings,
        "advice": advice,
        "history": budget_history
    })

# GET endpoint to fetch all budgets for a user
@budget_bp.route('', methods=['GET'])
def get_budgets():
    user_id = request.args.get('user_id', 'default')
    db = SessionLocal()
    try:
        budgets = db.query(Budget).filter(Budget.user_id == (user_id if isinstance(user_id, int) else None)).order_by(Budget.timestamp.asc()).all()
        budget_history = [
            {
                "income": b.income,
                "expenses": b.expenses,
                "timestamp": b.timestamp.isoformat()
            } for b in budgets
        ]
    finally:
        db.close()
    return jsonify({"budgets": budget_history})

