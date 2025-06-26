from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any
import os
from datetime import datetime
import logging

from app.db.session import get_db
from app.api.v1.endpoints.auth import get_current_user
from app.utils.perma_utils import analyze_mood_trends, get_perma_suggestions
from app.chanakya_chain.prompts import PERMA_PROMPT_TEMPLATE

router = APIRouter()

@router.post("", response_model=Dict[str, Any])
async def perma_chat(
    request_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Handle PERMA chat interactions with the AI coach
    """
    logger = logging.getLogger("perma_chat")
    try:
        logger.info(f"Incoming PERMA chat request_data: {request_data}")
        message = request_data.get('userMessage', '')
        perma_scores = request_data.get('perma_scores', {})
        summary = request_data.get('summary', '')
        history = request_data.get('history', '')
        user_timezone = request_data.get('timezone', 'UTC')
        trends = request_data.get('trends', {})
        logger.info(f"Extracted: message={message}, perma_scores={perma_scores}, summary={summary}, history={history}, timezone={user_timezone}, trends={trends}")

        if not message and not summary:
            logger.error("Missing message and summary in request_data")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='Either message or summary is required.'
            )

        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            logger.error("GROQ_API_KEY is missing in environment")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Server configuration error: Missing API key"
            )

        suggestions = []
        for pillar, data in trends.items():
            if data.get('trend') == 'declining':
                suggestions.extend(get_perma_suggestions(pillar))

        try:
            system_prompt = PERMA_PROMPT_TEMPLATE.format(
                perma_scores=perma_scores,
                summary=summary,
                history=history,
                userMessage=message,
                timezone=user_timezone,
                trends=trends,
            )
        except Exception as format_exc:
            logger.error(f"Error formatting PERMA_PROMPT_TEMPLATE: {format_exc}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Template formatting error: {format_exc}"
            )

        # TODO: Implement AI model call here
        # For now return mock response
        response = {
            "response": "I understand from your PERMA scores that you're doing well in some areas but might need support in others. Would you like to discuss any specific aspect of your well-being?",
            "timestamp": datetime.utcnow().isoformat()
        }

        logger.info(f"Returning PERMA chat response: {response}")
        return response

    except Exception as e:
        logger.error(f"Unhandled exception in perma_chat: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        ) 