# Chanakya – AI Financial Wellness Coach

A full-stack, modular web application that provides intelligent financial guidance to users aged 20–30 through a chat interface.

## Features
- Track income and expenses
- Log mood (emotional wellness)
- GPT-4 powered personalized budgeting advice
- Chat memory and natural conversation

## Tech Stack
- **Frontend:** React, Tailwind CSS, Recharts/Chart.js, Axios
- **Backend:** Flask, LangChain, SQLite (upgradeable), CORS
- **AI:** GPT-4 via OpenAI API
- **Other:** Docker-ready, .env for secrets, responsive UI

## Folder Structure
```
├── backend/
│   ├── app.py
│   ├── routes/
│   │   ├── chat.py
│   │   ├── budget.py
│   │   └── mood.py
│   ├── langchain/
│   │   ├── memory.py
│   │   └── prompts.py
│   ├── db/
│   │   └── models.py
│   ├── utils/
│   │   └── helpers.py
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

## Quick Start
1. `cd backend && pip install -r requirements.txt`
2. `cd frontend && npm install && npm start`
3. Set your OpenAI API key in `.env`
4. See full docs for details.
