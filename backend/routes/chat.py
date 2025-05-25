from fastapi import APIRouter, HTTPException, status, Depends
from typing import Dict, Any, List, Optional
import os
import json
import requests
from langchain.memory import ConversationBufferMemory
from langchain.prompts import PromptTemplate
from langchain_groq import ChatGroq
from sqlalchemy.orm import Session
from backend.db.session import get_db
from backend.db.models import ChatHistory
from backend.chanakya_chain.prompts import RUKMINI_PROMPT_TEMPLATE, KRISHNA_PROMPT_TEMPLATE, GENERAL_PROMPT_TEMPLATE
from backend.utils.helpers import format_expenses
import datetime

router = APIRouter()

# In-memory session memory for demo; replace with DB/session for prod
user_memories = {}

def get_user_memory(user_id: str) -> ConversationBufferMemory:
    """Get or create a conversation memory for the user."""
    if user_id not in user_memories:
        memory = ConversationBufferMemory(
            memory_key="history",
            return_messages=True
        )
        # Initialize with empty messages
        memory.chat_memory.messages = []
        user_memories[user_id] = memory
    return user_memories[user_id]

@router.post('')
async def chat(
    request_data: Dict[str, Any], 
    db: Session = Depends(get_db)
):
    """
    Handle chat messages from users and provide financial wellness advice.
    
    Args:
        request_data: Dictionary containing:
            - user_id: Unique identifier for the user
            - message: The user's message
            - income: (Optional) User's income
            - expenses: (Optional) Dictionary of expenses
            - mood: (Optional) User's current mood
            - gender: (Optional) User's gender ('male', 'female', or 'neutral')
            
    Returns:
        Dictionary containing the assistant's response and timestamp
    """
    print(f"\n=== INCOMING REQUEST DATA ===\n{request_data}\n{'='*30}\n")  # Debug log
    
    try:
        # Extract and validate input data
        user_id = str(request_data.get('user_id', '1'))
        message = (request_data.get('message') or '').strip()
        income = request_data.get('income', 0)
        expenses = request_data.get('expenses', {})
        mood = request_data.get('mood', 'neutral')
        user_gender = request_data.get('gender', 'neutral').lower()
        
        print(f"Extracted gender: {user_gender}")  # Debug log
        
        # Input validation
        if not message:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail='Message is required.'
            )
            
        if not isinstance(expenses, dict):
            expenses = {}
            
        try:
            income = float(income)
        except (ValueError, TypeError):
            income = 0.0
            
        # Get or create user memory
        memory = get_user_memory(user_id)
        
        # Select prompt template based on user's gender
        if user_gender == 'male':
            template = RUKMINI_PROMPT_TEMPLATE
            print(f"\n=== USING RUKMINI TEMPLATE (for male user) ===\n")
        elif user_gender == 'female':
            template = KRISHNA_PROMPT_TEMPLATE
            print(f"\n=== USING KRISHNA TEMPLATE (for female user) ===\n")
        else:
            template = GENERAL_PROMPT_TEMPLATE
            print(f"\n=== USING DEFAULT TEMPLATE (neutral/unspecified) ===\n")
            
        # Create prompt template
        prompt = PromptTemplate(
            input_variables=["income", "expenses", "mood", "history", "input"],
            template=template
        )
        
        # Format expenses for prompt
        formatted_expenses = format_expenses(expenses)
        
        # Get Groq API key
        groq_api_key = os.getenv("GROQ_API_KEY")
        if not groq_api_key:
            print("[ERROR] GROQ_API_KEY is missing or empty!", flush=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Server configuration error: Missing API key"
            )
        else:
            print("[DEBUG] GROQ_API_KEY loaded:", groq_api_key[:8] + "...", flush=True)
            
        # Prepare messages for Groq API
        history_messages = []
        if hasattr(memory, 'chat_memory') and memory.chat_memory.messages:
            for msg in memory.chat_memory.messages:
                if msg.type == 'human':
                    history_messages.append({"role": "user", "content": msg.content})
                elif msg.type == 'ai':
                    history_messages.append({"role": "assistant", "content": msg.content})
                    
        # Add current user message
        history_messages.append({"role": "user", "content": message})
        
        # Format history for prompt
        history_text = ""
        if history_messages[:-1]:  # Exclude the current message
            history_text = "\n".join([
                f"{msg['role']}: {msg['content']}" 
                for msg in history_messages[:-1]
            ])
        
        # Prepare system prompt with context
        system_prompt = template.format(
            income=income,
            expenses=formatted_expenses,
            mood=mood,
            history=history_text,
            input=message
        ).strip()
        
        # Final messages list
        messages = [{"role": "system", "content": system_prompt}] + history_messages
        
        # Call Groq API
        try:
            response = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {groq_api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "llama-3.3-70b-versatile",
                    "messages": messages,
                    "temperature": 0.7
                }
            )
            
            print("[DEBUG] Groq API status:", response.status_code, flush=True)
            print("[DEBUG] Groq API response:", response.text, flush=True)
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Groq API error: {response.text}"
                )
                
            response_data = response.json()
            response_text = response_data["choices"][0]["message"]["content"]
            
            # Add messages to memory
            memory.chat_memory.add_user_message(message)
            memory.chat_memory.add_ai_message(response_text)
            
            # Save to database
            try:
                # Save user message
                user_chat = ChatHistory(
                    user_id=int(user_id) if user_id.isdigit() else 1,
                    role="user",
                    content=message,
                    message=message,
                    response=""
                )
                db.add(user_chat)
                
                # Save assistant response
                assistant_chat = ChatHistory(
                    user_id=int(user_id) if user_id.isdigit() else 1,
                    role="assistant",
                    content=response_text,
                    message="",
                    response=response_text
                )
                db.add(assistant_chat)
                
                db.commit()
                
            except Exception as db_error:
                db.rollback()
                print(f"[ERROR] Failed to save chat to database: {str(db_error)}")
                # Continue even if database save fails
            
            return {
                "response": response_text,
                "timestamp": datetime.datetime.utcnow().isoformat()
            }
            
        except requests.RequestException as e:
            print(f"[ERROR] Groq API request failed: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to communicate with AI service: {str(e)}"
            )
            
    except HTTPException:
        raise
        
    except Exception as e:
        print(f"[ERROR] Error in chat endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing your request"
        )

