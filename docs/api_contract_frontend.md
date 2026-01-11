# Frontend API Contract

This document describes the backend API endpoints actually used by the frontend application.

## Base URL

All API requests use relative paths with same-origin policy:
- **Development**: `http://localhost/api/...`
- **Production**: `/api/...` (served from same domain)

## Authentication

### Login

Authenticate user and receive JWT token.

**Endpoint**: `POST /api/auth/login-json`

**Request**:
```json
{
  "username": "user@example.com",  // Field name is 'username' but send email
  "password": "password123"
}
```

**Success Response** (200 OK):
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer"
}
```

**Error Responses**:
- `401 Unauthorized`: Invalid credentials
  ```json
  { "detail": "Incorrect email or password" }
  ```
- `422 Unprocessable Entity`: Validation error
  ```json
  {
    "detail": [
      {
        "loc": ["body", "username"],
        "msg": "field required",
        "type": "value_error.missing"
      }
    ]
  }
  ```

---

### Register

Create a new user account.

**Endpoint**: `POST /api/auth/register`

**Request**:
```json
{
  "email": "newuser@example.com",
  "password": "securepassword123"
}
```

**Success Response** (201 Created):
```json
{
  "id": 42,
  "email": "newuser@example.com",
  "is_active": true,
  "plan": "free",
  "created_at": "2026-01-11T00:00:00.000Z"
}
```

**Error Responses**:
- `409 Conflict`: Email already registered
  ```json
  { "detail": "Email already registered" }
  ```
- `422 Unprocessable Entity`: Validation error
  ```json
  {
    "detail": [
      {
        "loc": ["body", "email"],
        "msg": "value is not a valid email address",
        "type": "value_error.email"
      }
    ]
  }
  ```

---

## User Management

### Get Current User

Retrieve authenticated user's profile information.

**Endpoint**: `GET /api/me`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Success Response** (200 OK):
```json
{
  "id": 42,
  "email": "user@example.com",
  "is_active": true,
  "plan": "free",
  "created_at": "2026-01-11T00:00:00.000Z"
}
```

**Error Responses**:
- `401 Unauthorized`: Invalid or missing token
  ```json
  { "detail": "Could not validate credentials" }
  ```

---

## Common Error Responses

### 503 Service Unavailable (HTML)

When nginx or the backend is down, you may receive an HTML response instead of JSON:

```html
<html>
<head><title>503 Service Temporarily Unavailable</title></head>
<body>...</body>
</html>
```

The frontend handles this gracefully by detecting `Content-Type: text/html` and showing a generic error message.

### Network Errors

When the server is unreachable, a network error occurs. The frontend catches this and displays:
```
Network error. Please check your connection.
```

---

## Request Headers

### Required for All Requests

```
Content-Type: application/json
```

### Required for Protected Endpoints

```
Authorization: Bearer <access_token>
```

The `apiFetch` utility automatically adds these headers:
- Always adds `Content-Type: application/json`
- Adds `Authorization` header if token exists in localStorage (unless `skipAuth: true`)

---

## Token Management

### Storage
- JWT token is stored in `localStorage` with key `auth_token`
- Token is automatically included in protected API requests

### Lifecycle
1. **Login**: Receive token, save to localStorage
2. **Authenticated requests**: Token automatically added to headers
3. **401 response**: Token is invalid/expired, clear localStorage and redirect to login
4. **Logout**: Clear token from localStorage, redirect to login

---

## Error Handling Strategy

See [error_handling.md](./error_handling.md) for detailed error handling patterns and UI messages.
