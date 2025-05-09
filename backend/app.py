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

app.register_blueprint(chat_bp, url_prefix='/chat')
app.register_blueprint(budget_bp, url_prefix='/budget')
app.register_blueprint(mood_bp, url_prefix='/mood')

@app.route('/')
def index():
    return {'message': 'Chanakya AI Financial Wellness Coach API'}

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
