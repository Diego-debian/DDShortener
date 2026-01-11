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

## URL Management

### Create Short URL

Create a new shortened URL.

**Endpoint**: `POST /api/urls`

**Headers**:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request**:
```json
{
  "long_url": "https://example.com/very/long/url/path"
}
```

**Success Response** (201 Created):
```json
{
  "short_code": "abc123",
  "long_url": "https://example.com/very/long/url/path",
  "created_at": "2026-01-11T05:00:00.000Z",
  "expires_at": null,
  "is_active": true
}
```

**Note**: The frontend constructs the full short URL using:
```typescript
const shortUrl = `${window.location.origin}/${short_code}`;
```

**Error Responses**:
- `401 Unauthorized`: Invalid or missing token
  ```json
  { "detail": "Could not validate credentials" }
  ```
- `403 Forbidden`: Free plan limit reached
  ```json
  { "detail": "Free plan limit: You can only create up to 3 URLs" }
  ```
- `422 Unprocessable Entity`: Invalid URL format
  ```json
  {
    "detail": [
      {
        "loc": ["body", "long_url"],
        "msg": "invalid or missing URL scheme",
        "type": "value_error.url.scheme"
      }
    ]
  }
  ```

---

### Get URL Statistics

Retrieve click statistics for a shortened URL.

**Endpoint**: `GET /api/urls/{short_code}/stats`

**Path Parameters**:
- `short_code` - The short code of the URL

**Success Response** (200 OK):
```json
{
  "short_code": "abc123",
  "long_url": "https://example.com/very/long/url/path",
  "total_clicks": 42,
  "by_date": {
    "2026-01-10": 15,
    "2026-01-11": 27
  }
}
```

**Error Responses**:
- `404 Not Found`: URL not found or inactive
  ```json
  { "detail": "Short URL not found" }
  ```
- `410 Gone`: URL expired or click limit reached
  ```json
  { "detail": "Short URL has expired or reached its click limit" }
  ```
- `422 Unprocessable Entity`: Invalid short code format
  ```json
  { "detail": "Invalid short code format" }
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
