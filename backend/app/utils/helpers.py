def format_expenses(expenses):
    """
    Format expenses dictionary into a string for prompt templates.
    """
    if not expenses:
        return "No expenses provided."
    return ", ".join(f"{k}: {v}" for k, v in expenses.items()) 