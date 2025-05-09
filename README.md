# Chanakya – AI Financial Wellness Coach

A full-stack, modular web application that provides intelligent financial guidance and wellness tracking through a modern chat interface.

## Features
- Track income and expenses
- Log mood (emotional wellness)
- Personalized budgeting advice (GPT-4 or Groq API)
- Chat memory and natural conversation
- Mood-aware prompts
- Docker-ready and environment-based config

## Tech Stack
- **Frontend:** React, Tailwind CSS, Recharts, Axios
- **Backend:** Flask, LangChain, SQLAlchemy, Alembic, CORS
- **AI:** GPT-4 (OpenAI) or Groq API
- **Other:** Docker, .env for secrets, responsive UI

## Project Structure
```
├── backend/
│   ├── app.py
│   ├── routes/
│   │   ├── chat.py
│   │   ├── budget.py
│   │   └── mood.py
│   ├── chanakya_chain/
│   │   ├── memory.py
│   │   └── prompts.py
│   ├── db/
│   │   └── models.py
│   ├── utils/
│   │   └── helpers.py
│   ├── alembic/ (migrations)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatBox.jsx
│   │   │   ├── BudgetForm.jsx
│   │   │   ├── MoodTracker.jsx
│   │   │   └── Dashboard.jsx
│   │   ├── services/api.js
│   │   ├── App.jsx
│   │   └── index.js
│   └── package.json
├── .env
├── README.md
└── docker-compose.yml
```

---

## Setup & Usage

### 1. Backend (Flask API)
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
# Run DB migrations (if needed)
alembic upgrade head
flask run  # or python app.py
```

### 2. Frontend (React UI)
```bash
cd frontend
npm install
npm start
```

### 3. Environment Variables
Create a `.env` file in the project root:
```
GROQ_API_KEY=your_groq_or_openai_key
FLASK_ENV=development
```

### 4. Docker (optional)
```bash
docker-compose up --build
```

---

## Alembic Migrations
- Use Alembic for DB schema changes:
  - `alembic revision --autogenerate -m "your message"`
  - `alembic upgrade head`

---

## Notes
- Make sure ports 5001 (backend) and 3000 (frontend) are available.
- For production, use a real database (Postgres recommended, see docker-compose).
- Update `.env` with your API keys and secrets.

---

## License
MIT
