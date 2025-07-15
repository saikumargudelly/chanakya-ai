from fastapi import APIRouter, HTTPException, status, Depends
from typing import Dict, Any, List, Optional
import os
import json
import requests
from langchain.memory import ConversationBufferMemory
from langchain.prompts import PromptTemplate
from langchain_groq import ChatGroq
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.chat_history import ChatHistory
from app.models.goal import Goal
from app.chanakya_chain.prompts import RUKMINI_PROMPT_TEMPLATE, KRISHNA_PROMPT_TEMPLATE, GENERAL_PROMPT_TEMPLATE, GOAL_MASTER_TEMPLATE
from app.utils.helpers import format_expenses
import datetime

# Create two routers - one for /api prefix and one for root
api_router = APIRouter(prefix="/api")
root_router = APIRouter()

# In-memory session memory for demo; replace with DB/session for prod
user_memories = {}

def get_user_memory(user_id: str) -> ConversationBufferMemory:
    if user_id not in user_memories:
        memory = ConversationBufferMemory(
            memory_key="history",
            return_messages=True
        )
        memory.chat_memory.messages = []
        user_memories[user_id] = memory
    return user_memories[user_id]

def get_template_for_model(model: str, user_gender: str) -> str:
    print(f"Selecting template for model: {model}, user_gender: {user_gender}")
    if model == 'goal_master':
        return GOAL_MASTER_TEMPLATE
    elif model == 'rukhmini':
        return RUKMINI_PROMPT_TEMPLATE
    elif model == 'krishna':
        return KRISHNA_PROMPT_TEMPLATE
    elif model == 'chanakya':
        return GENERAL_PROMPT_TEMPLATE
    else:
        return GENERAL_PROMPT_TEMPLATE

async def handle_chat(request_data: Dict[str, Any], db: Session = Depends(get_db)):
    print(f"\n=== INCOMING REQUEST DATA ===\n{request_data}\n{'='*30}\n")
    try:
        user_id = str(request_data.get('user_id', '1'))
        message = (request_data.get('message') or '').strip()
        income = request_data.get('income', 0)
        expenses = request_data.get('expenses', {})
        mood = request_data.get('mood', 'neutral')
        user_gender = request_data.get('gender', 'neutral').lower()
        model = request_data.get('model', 'chanakya').lower()
        user_timezone = request_data.get('timezone', 'UTC')
        print(f"Extracted gender: {user_gender}, model: {model}, timezone: {user_timezone}")
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
        memory = get_user_memory(user_id)
        template = get_template_for_model(model, user_gender)
        print(f"\n=== USING {model.upper()} TEMPLATE ===\n")
        prompt = PromptTemplate(
            input_variables=["income", "expenses", "mood", "history", "input", "goal_history", "user_background"],
            template=template
        )
        formatted_expenses = format_expenses(expenses)
        groq_api_key = os.getenv("GROQ_API_KEY")
        if not groq_api_key:
            print("[ERROR] GROQ_API_KEY is missing or empty!", flush=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Server configuration error: Missing API key"
            )
        else:
            print("[DEBUG] GROQ_API_KEY loaded:", groq_api_key[:8] + "...", flush=True)
        history_messages = []
        if hasattr(memory, 'chat_memory') and memory.chat_memory.messages:
            for msg in memory.chat_memory.messages:
                if msg.type == 'human':
                    history_messages.append({"role": "user", "content": msg.content})
                elif msg.type == 'ai':
                    history_messages.append({"role": "assistant", "content": msg.content})
        history_messages.append({"role": "user", "content": message})
        history_text = ""
        if history_messages[:-1]:
            history_text = "\n".join([
                f"{msg['role']}: {msg['content']}" 
                for msg in history_messages[:-1]
            ])
        goal_history = ""
        try:
            goals = db.query(Goal).filter(Goal.user_id == int(user_id)).all()
            if goals:
                goal_history = "\n".join([
                    f"- {goal.name}: {goal.saved_amount}/{goal.target_amount} (Deadline: {goal.deadline_months} months)"
                    for goal in goals
                ])
        except Exception as e:
            print(f"[WARNING] Failed to fetch goal history: {str(e)}")
        system_prompt = template.format(
            income=income,
            expenses=formatted_expenses,
            mood=mood,
            history=history_text,
            input=message,
            goal_history=goal_history,
            user_background=f"User is {user_gender} with income {income}. User's timezone is {user_timezone}."
        ).strip()
        messages = [{"role": "system", "content": system_prompt}] + history_messages
        try:
            response = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {groq_api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "llama3-70b-8192",
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
            memory.chat_memory.add_user_message(message)
            memory.chat_memory.add_ai_message(response_text)
            try:
                user_chat = ChatHistory(
                    user_id=int(user_id) if user_id.isdigit() else 1,
                    role="user",
                    content=message,
                    message=message,
                    response=""
                )
                db.add(user_chat)
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

@api_router.post('/chat')
async def api_chat(request_data: Dict[str, Any], db: Session = Depends(get_db)):
    return await handle_chat(request_data, db)

@root_router.post('/chat')
async def root_chat(request_data: Dict[str, Any], db: Session = Depends(get_db)):
    return await handle_chat(request_data, db)

@api_router.post('/perma-chat')
async def perma_chat(
    request_data: Dict[str, Any], 
    db: Session = Depends(get_db)
):
    print(f"\n=== INCOMING PERMA CHAT REQUEST DATA ===\n{request_data}\n{'='*30}\n")
    try:
        perma_scores = request_data.get('perma_scores', {})
        summary = request_data.get('summary', '')
        message = (request_data.get('userMessage') or '').strip()
        history = request_data.get('history', '')
        user_timezone = request_data.get('timezone', 'UTC')
        print(f"Extracted timezone for PERMA chat: {user_timezone}")
        if not message:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail='Message is required.'
            )
        if not isinstance(perma_scores, dict):
            perma_scores = {}
        groq_api_key = os.getenv("GROQ_API_KEY")
        if not groq_api_key:
            print("[ERROR] GROQ_API_KEY is missing or empty!", flush=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Server configuration error: Missing API key"
            )
        system_prompt = f"""You are a wellness coach helping the user improve their PERMA scores.\nUser's timezone is {user_timezone}.\nCurrent PERMA scores: {json.dumps(perma_scores)}\nSummary: {summary}\nPrevious history: {history}\n\nPlease provide personalized advice and support based on their PERMA scores and current situation.\nFocus on helping them improve their weakest areas while maintaining their strengths.\nBe empathetic, supportive, and practical in your responses.""".strip()
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": message}
        ]
        try:
            response = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {groq_api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "llama3-70b-8192",
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
        print(f"[ERROR] Error in PERMA chat endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing your request"
        )

router = APIRouter()
router.include_router(api_router)
router.include_router(root_router) 