from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any
import os
from datetime import datetime

from backend.db.session import get_db
from backend.utils.security import get_current_user
from backend.utils.perma_utils import analyze_mood_trends, get_perma_suggestions
from backend.chanakya_chain.prompts import PERMA_PROMPT_TEMPLATE

router = APIRouter()

@router.post("/perma-chat", response_model=Dict[str, Any])
async def perma_chat(
    request_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Handle PERMA chat interactions with the AI coach
    """
    try:
        message = request_data.get('userMessage', '')
        perma_scores = request_data.get('perma_scores', {})
        summary = request_data.get('summary', '')
        history = request_data.get('history', '')
        user_timezone = request_data.get('timezone', 'UTC')
        trends = request_data.get('trends', {})

        if not message and not summary:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='Either message or summary is required.'
            )

        # Get AI model API key
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Server configuration error: Missing API key"
            )

        # Get suggestions based on weak areas
        suggestions = []
        for pillar, data in trends.items():
            if data.get('trend') == 'declining':
                suggestions.extend(get_perma_suggestions(pillar))

        # Prepare system prompt with context
        system_prompt = PERMA_PROMPT_TEMPLATE.format(
            perma_scores=perma_scores,
            summary=summary,
            history=history,
            suggestions=suggestions,
            timezone=user_timezone
        )

        # TODO: Implement AI model call here
        # For now return mock response
        response = {
            "response": "I understand from your PERMA scores that you're doing well in some areas but might need support in others. Would you like to discuss any specific aspect of your well-being?",
            "timestamp": datetime.utcnow().isoformat()
        }

        return response

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )