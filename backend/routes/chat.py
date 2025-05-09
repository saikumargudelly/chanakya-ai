from flask import Blueprint, request, jsonify
from langchain.memory import ConversationBufferMemory
import requests
from langchain.chains import ConversationChain
from langchain.prompts import PromptTemplate
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
import os
import datetime

from db.models import ChatHistory
from utils.helpers import format_expenses
from chanakya_chain.prompts import PROMPT_TEMPLATE

chat_bp = Blueprint('chat', __name__)

# In-memory session memory for demo; replace with DB/session for prod
user_memories = {}

# Setup DB session
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///chanakya.db")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_user_memory(user_id):
    if user_id not in user_memories:
        user_memories[user_id] = ConversationBufferMemory()
    return user_memories[user_id]

@chat_bp.route('', methods=['POST'])
def chat():
    data = request.json
    user_id = data.get('user_id', 'default')
    message = data.get('message', '').strip()
    income = data.get('income', 0)
    expenses = data.get('expenses', {})
    mood = data.get('mood', 'neutral')

    # Input validation
    if not message:
        return jsonify({'error': 'Message is required.'}), 400
    if not isinstance(expenses, dict):
        expenses = {}
    try:
        income = float(income)
    except Exception:
        income = 0

    memory = get_user_memory(user_id)
    prompt = PromptTemplate(
        input_variables=["income", "expenses", "mood", "history", "input"],
        template=PROMPT_TEMPLATE
    )
    # Format expenses for prompt
    formatted_expenses = format_expenses(expenses)
    prompt_text = PROMPT_TEMPLATE.format(
        income=income,
        expenses=formatted_expenses,
        mood=mood,
        history=memory.buffer,
        input=message
    )
    groq_api_key = os.getenv("GROQ_API_KEY")
    if not groq_api_key:
        print("[ERROR] GROQ_API_KEY is missing or empty!", flush=True)
    else:
        print("[DEBUG] GROQ_API_KEY loaded:", groq_api_key[:8] + "...", flush=True)
        print("[DEBUG] GROQ_API_KEY repr:", repr(groq_api_key), "length:", len(groq_api_key), flush=True)
    groq_url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {groq_api_key}",
        "Content-Type": "application/json"
    }
    # Use the improved prompt template as systemPrompt
    systemPrompt = PROMPT_TEMPLATE.strip()
    # Reconstruct conversation history for this user
    history_messages = []
    if memory.buffer:
        # memory.buffer is a string like: 'User: ...\nAI: ...\nUser: ...\nAI: ...'
        lines = [line.strip() for line in memory.buffer.split('\n') if line.strip()]
        for line in lines:
            if line.lower().startswith('user:'):
                history_messages.append({"role": "user", "content": line[5:].strip()})
            elif line.lower().startswith('ai:') or line.lower().startswith('assistant:'):
                # Accept either 'AI:' or 'Assistant:' as the assistant's role
                content = line.split(':', 1)[1].strip()
                history_messages.append({"role": "assistant", "content": content})
    # Add the latest user message
    history_messages.append({"role": "user", "content": message})
    # Final messages list
    messages = [{"role": "system", "content": systemPrompt}] + history_messages
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": messages,
        "temperature": 0.7
    }
    try:
        groq_resp = requests.post(groq_url, headers=headers, json=payload)
        print("[DEBUG] Groq API status:", groq_resp.status_code, flush=True)
        print("[DEBUG] Groq API response:", groq_resp.text, flush=True)
        if groq_resp.status_code != 200:
            return jsonify({"error": "Groq API error", "details": groq_resp.text}), 500
        groq_data = groq_resp.json()
        # --- Detect user intent for analytics and response logic ---
        from .intent_utils import detect_intent, trim_response_by_intent
        intent = detect_intent(message)
        response = groq_data["choices"][0]["message"]["content"]
    except Exception as e:
        print("[ERROR] Exception during Groq API call:", str(e), flush=True)
        return jsonify({"error": "Groq API exception", "details": str(e)}), 500

    # Persist chat to DB
    db = SessionLocal()
    try:
        chat_entry = ChatHistory(
            user_id=user_id if isinstance(user_id, int) else None,
            message=message,
            response=response,
            timestamp=datetime.datetime.utcnow()
        )
        db.add(chat_entry)
        db.commit()
    finally:
        db.close()

    # Return last 10 chat messages for frontend display
    db = SessionLocal()
    try:
        history = db.query(ChatHistory).filter(ChatHistory.user_id == (user_id if isinstance(user_id, int) else None)).order_by(ChatHistory.timestamp.desc()).limit(10).all()
        chat_history = [
            {"message": h.message, "response": h.response, "timestamp": h.timestamp.isoformat()} for h in reversed(history)
        ]
    finally:
        db.close()

    return jsonify({"response": response, "history": chat_history})

