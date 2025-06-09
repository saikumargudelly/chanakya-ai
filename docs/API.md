# API Documentation

## Base URL
`https://api.chanakya-ai.com/v1`

## Authentication
All endpoints require authentication using JWT tokens. Include the token in the `Authorization` header:
```
Authorization: Bearer <your_jwt_token>
```

## Endpoints

### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Authenticate and get JWT token
- `GET /auth/me` - Get current user profile
- `PUT /auth/me` - Update current user profile
- `POST /auth/refresh` - Refresh JWT token
- `POST /auth/reset-password` - Request password reset

### Financial Data
- `GET /financial/transactions` - Get transaction history
- `POST /financial/transactions` - Add new transaction
- `GET /financial/transactions/{id}` - Get transaction by ID
- `PUT /financial/transactions/{id}` - Update transaction
- `DELETE /financial/transactions/{id}` - Delete transaction

### Goals
- `GET /goals` - List all financial goals
- `POST /goals` - Create new goal
- `GET /goals/{id}` - Get goal details
- `PUT /goals/{id}` - Update goal
- `DELETE /goals/{id}` - Delete goal

### Mood & Wellness
- `GET /wellness/mood` - Get mood history
- `POST /wellness/mood` - Log mood
- `GET /wellness/insights` - Get wellness insights

## Error Responses

### 400 Bad Request
```json
{
  "detail": "Invalid input data",
  "errors": {
    "field_name": ["Error message"]
  }
}
```

### 401 Unauthorized
```json
{
  "detail": "Could not validate credentials"
}
```

### 403 Forbidden
```json
{
  "detail": "Not enough permissions"
}
```

### 404 Not Found
```json
{
  "detail": "Resource not found"
}
```

## Rate Limiting
- 100 requests per minute per IP address
- 1000 requests per hour per user (when authenticated)

## Pagination
List endpoints support pagination using query parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

Example response with pagination:
```json
{
  "items": [...],
  "total": 100,
  "page": 1,
  "pages": 5
}
```

## Data Validation
All input data is validated using Pydantic models. See the source code for detailed field requirements.
