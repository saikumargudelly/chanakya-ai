from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os

# Explicitly load .env from the project root
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

app = Flask(__name__)
CORS(app)

# Import blueprints
from routes.chat import chat_bp
from routes.budget import budget_bp
from routes.mood import mood_bp
from routes.auth import bp as auth_bp

app.register_blueprint(chat_bp, url_prefix='/chat')
app.register_blueprint(budget_bp, url_prefix='/budget')
app.register_blueprint(mood_bp, url_prefix='/mood')
app.register_blueprint(auth_bp, url_prefix='/auth')

@app.route('/')
def index():
    return {'message': 'Chanakya AI Financial Wellness Coach API'}

from flask import request, jsonify
from chanakya_chain.prompts import PERMA_PROMPT_TEMPLATE
import requests
import os

@app.route('/perma-chat', methods=['POST'])
def perma_chat():
    data = request.get_json()
    summary = data.get('summary', '')
    user_message = data.get('userMessage', '')
    perma_scores = data.get('perma_scores', {})
    history = data.get('history', '')

    # Prepare the system prompt and user content
    system_prompt = PERMA_PROMPT_TEMPLATE.strip()
    # Fill in variables for the prompt (as string, not .format, for LLM context)
    user_content = f"User's PERMA Scores: {perma_scores}\nPERMA Summary: {summary}\nChat History: {history}\nUser: {user_message}\nChanakya:"

    # Compose messages for LLM
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_content}
    ]

    # Call Groq LLM (simulate if no key)
    groq_api_key = os.getenv("GROQ_API_KEY")
    if not groq_api_key:
        ai_response = "(LLM unavailable) Based on your PERMA summary, try focusing on a small positive action today!"
        return jsonify({'response': ai_response})
    groq_url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {groq_api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": messages,
        "temperature": 0.7
    }
    try:
        groq_resp = requests.post(groq_url, headers=headers, json=payload)
        if groq_resp.status_code != 200:
            return jsonify({"error": "Groq API error", "details": groq_resp.text}), 500
        groq_data = groq_resp.json()
        ai_response = groq_data["choices"][0]["message"]["content"]
    except Exception as e:
        return jsonify({"error": "Groq API exception", "details": str(e)}), 500
    return jsonify({'response': ai_response})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)