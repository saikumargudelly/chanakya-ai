# Chanakya AI Financial Wellness Coach API

A FastAPI-based backend for the Chanakya AI Financial Wellness Coach application, providing financial coaching and mood tracking features.

## Features

- 🚀 **FastAPI** for high-performance API endpoints
- 🔐 **JWT Authentication** with refresh tokens
- 📊 **Financial Tracking** for income, expenses, and savings
- 😊 **Mood Tracking** with PERMA analysis
- 🎯 **Goal Setting** and progress tracking
- 🤖 **AI-Powered Chat** with financial coaching
- 📈 **Analytics** and insights
- 🔄 **RESTful API** design
- 📝 **OpenAPI** documentation

## Prerequisites

- Python 3.9+
- PostgreSQL 13+
- Redis (for rate limiting, optional)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/chanakya-ai-financial-coach.git
   cd chanakya-ai-financial-coach/backend
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. Set up the database:
   ```bash
   # Run migrations
   alembic upgrade head
   ```

## Running the Application

### Development

```bash
uvicorn app:app --reload
```

The API will be available at `http://localhost:5001`

### Production

For production, use a production-grade ASGI server like Uvicorn with Gunicorn:

```bash
gunicorn -k uvicorn.workers.UvicornWorker -w 4 -b 0.0.0.0:5001 app:app
```

## API Documentation

- **Swagger UI**: `http://localhost:5001/docs`
- **ReDoc**: `http://localhost:5001/redoc`
- **OpenAPI Schema**: `http://localhost:5001/openapi.json`

## Environment Variables

See `.env.example` for all available environment variables.

## Testing

```bash
pytest tests/
```

## Project Structure

```
backend/
├── alembic/              # Database migrations
├── app/                   # Application package
│   ├── api/              # API routes
│   ├── core/             # Core functionality
│   ├── db/               # Database models and session
│   ├── models/           # Pydantic models
│   ├── services/         # Business logic
│   └── utils/            # Utility functions
├── tests/                # Test files
├── .env.example          # Example environment variables
├── .gitignore
├── alembic.ini           # Alembic configuration
├── main.py               # Application entry point
└── requirements.txt      # Project dependencies
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- FastAPI for the amazing web framework
- SQLAlchemy for the ORM
- All contributors who have helped improve this project
