# Utility helpers for Chanakya AI

def format_expenses(expenses):
    if isinstance(expenses, dict):
        return ", ".join(f"{k}: {v}" for k, v in expenses.items())
    return str(expenses)
