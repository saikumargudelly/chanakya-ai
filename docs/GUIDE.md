# Development Guide

## Getting Started

### Prerequisites
- Node.js 18+ (for frontend)
- Python 3.10+ (for backend)
- PostgreSQL 14+
- npm 9+

### Environment Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/chanakya-ai.git
   cd chanakya-ai
   ```

2. Set up backend:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements/dev.txt
   ```

3. Set up frontend:
   ```bash
   cd ../frontend
   npm install
   ```

4. Configure environment variables:
   - Copy `.env.example` to `.env` in both frontend and backend directories
   - Update the values according to your local setup

## Development Workflow

### Branching Strategy
- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Critical production fixes

### Commit Message Convention
```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

## Running the Application

### Backend
```bash
cd backend
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm start
```

### Running Tests

Backend tests:
```bash
cd backend
pytest
```

Frontend tests:
```bash
cd frontend
npm test
```

## Code Style

### Python
- Follow PEP 8
- Use Black for code formatting
- Use isort for import sorting
- Maximum line length: 88 characters

### JavaScript/TypeScript
- Follow Airbnb Style Guide
- Use Prettier for code formatting
- Use ESLint for linting
- Maximum line length: 100 characters

## Pull Requests
1. Create a feature branch from `develop`
2. Make your changes
3. Add tests if applicable
4. Run linters and tests
5. Update documentation if needed
6. Create a pull request to `develop`

## Code Review Process
1. At least one approval required
2. All CI checks must pass
3. Code coverage should not decrease
4. Follow the project's coding standards

## Deployment

### Staging
- Automatically deployed from `develop` branch
- Accessible at `staging.chanakya-ai.com`

### Production
- Deployed from `main` branch
- Requires approval
- Automated via GitHub Actions

## Monitoring
- **Backend**: Sentry for error tracking
- **Frontend**: Sentry for error tracking
- **Performance**: New Relic

## Support
For issues and feature requests, please use the [GitHub Issues](https://github.com/yourusername/chanakya-ai/issues).

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
