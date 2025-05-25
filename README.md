# Chanakya – AI Financial Wellness Coach

A full-stack, modular web application that provides intelligent financial guidance and wellness tracking through a modern chat interface. Chanakya combines ancient wisdom with modern AI to offer personalized financial advice and emotional wellness support.

## 🌟 Key Features

### Financial Wellness
- Personalized budgeting advice and financial planning
- Income and expense tracking with smart categorization
- Savings goals and investment recommendations
- Financial health score and progress tracking

### Emotional Wellness
- PERMA-based wellness assessment (Positive Emotions, Engagement, Relationships, Meaning, Accomplishment)
- Mood tracking and emotional state analysis
- Personalized wellness recommendations
- Progress visualization and trend analysis

### AI-Powered Chat Interface
- Gender-aware AI assistant (Rukmini/Krishna/Chanakya)
- Context-aware conversations with memory
- Mood-adaptive responses and theming
- Natural language understanding for financial queries

### User Experience
- Modern, responsive UI with dark/light mode
- Real-time chat with typing indicators
- Gamification elements (Wisdom Level, XP)
- Quick replies and voice input support
- Smooth animations and transitions

### Security & Authentication
- Secure user registration and login
- JWT-based authentication
- Password reset via email
- Profile management with validation
- Rate limiting and security measures

## 🛠 Tech Stack

### Frontend
- React 18 with TypeScript
- Tailwind CSS for styling
- Framer Motion for animations
- Recharts for data visualization
- Axios for API communication

### Backend
- FastAPI (Python) REST API
- SQLAlchemy ORM
- Alembic for database migrations
- LangChain for AI integration
- OpenAI GPT-4 or Groq API

### Infrastructure
- Docker containerization
- PostgreSQL database
- Environment-based configuration
- CI/CD ready

## 📁 Project Structure
```
├── backend/
│   ├── main.py                 # Main FastAPI application
│   ├── routes/               # API endpoints
│   │   ├── auth.py          # Authentication routes
│   │   ├── chat.py          # Chat interface routes
│   │   ├── budget.py        # Budget management routes
│   │   └── mood.py          # Mood tracking routes
│   ├── chanakya_chain/      # AI integration
│   │   ├── memory.py        # Chat memory management
│   │   └── prompts.py       # AI prompt templates
│   ├── db/                  # Database models
│   │   └── models.py        # SQLAlchemy models
│   ├── utils/               # Helper functions
│   │   └── helpers.py       # Utility functions
│   └── alembic/             # Database migrations
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── RukminiChat/ # Chat interface
│   │   │   ├── BudgetForm/  # Budget management
│   │   │   ├── MoodTracker/ # Mood tracking
│   │   │   └── Dashboard/   # Main dashboard
│   │   ├── contexts/        # React contexts
│   │   ├── services/        # API services
│   │   └── types/          # TypeScript types
│   └── public/             # Static assets
├── .env                    # Environment variables
├── docker-compose.yml      # Docker configuration
└── README.md              # Project documentation
```

## 🚀 Getting Started

### Prerequisites
- Python 3.9+
- Node.js 16+
- PostgreSQL 13+
- Docker (optional)

### 1. Backend Setup
```bash
# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
cd backend
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Initialize database
alembic upgrade head

# Run the server
uvicorn main:app --reload
```

### 2. Frontend Setup
```bash
# Install dependencies
cd frontend
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm start
```

### 3. Docker Setup (Optional)
```bash
# Build and run containers
docker-compose up --build
```

## 🔧 Environment Variables

### Backend (.env)
```
FASTAPI_APP=main.py
FASTAPI_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/chanakya
JWT_SECRET_KEY=your-secret-key
OPENAI_API_KEY=your-openai-key
GROQ_API_KEY=your-groq-key
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email
MAIL_PASSWORD=your-password
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5001
REACT_APP_WS_URL=ws://localhost:5001
```

## 📝 API Documentation

### Authentication Endpoints
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `GET /auth/profile` - Get user profile
- `PUT /auth/profile` - Update user profile
- `POST /auth/reset-password` - Reset password

### Chat Endpoints
- `POST /chat` - Send message to AI
- `GET /chat/history` - Get chat history
- `DELETE /chat/history` - Clear chat history

### Budget Endpoints
- `POST /budget` - Create budget
- `GET /budget` - Get budget details
- `PUT /budget` - Update budget
- `GET /budget/analytics` - Get budget analytics

### Mood Endpoints
- `POST /mood` - Log mood
- `GET /mood/history` - Get mood history
- `GET /mood/analytics` - Get mood analytics

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for GPT-4 API
- Groq for alternative AI API
- The open-source community for various tools and libraries
