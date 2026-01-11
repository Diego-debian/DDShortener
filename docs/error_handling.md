# Error Handling Guide

This document describes how the frontend handles different HTTP status codes and error scenarios.

## Error Handling Architecture

### ApiError Class

All API errors are normalized into the `ApiError` class:

```typescript
class ApiError extends Error {
  status: number;      // HTTP status code (or 0 for network errors)
  message: string;     // User-friendly error message
  isHtml?: boolean;    // True if response was HTML instead of JSON
}
```

### Error Detection Flow

```
API Request → Response
  ├─ OK (200-299) → Return data
  └─ Error (400-599 or network failure)
      ├─ Content-Type: application/json
      │   └─ Parse JSON → Extract 'detail' or 'message' → Throw ApiError
      └─ Content-Type: text/html (or other)
          └─ Generic message → Throw ApiError with isHtml: true
```

---

## HTTP Status Code Mapping

### Authentication Errors

#### 401 Unauthorized

**Scenario**: Invalid credentials or expired/invalid token

**Backend Response**:
```json
{ "detail": "Incorrect email or password" }
// or
{ "detail": "Could not validate credentials" }
```

**Frontend Behavior**:
- **On login page**: Display "Invalid email or password"
- **On protected pages**: Clear token, redirect to `/app/login`

**UI Message**:
```
Login: "Invalid email or password"
Protected routes: "Session expired. Please log in again."
```

---

### Validation Errors

#### 422 Unprocessable Entity

**Scenario**: Request data failed validation

**Backend Response**:
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

**Frontend Behavior**:
- Extract first error message from detail array
- Display validation error to user

**UI Message**:
```
"Please check your email and password format"
// or extract specific message
"Invalid email address"
```

---

### URL Management Errors

#### 403 Forbidden

**Scenario**: Free plan limit reached

**Backend Response**:
```json
{ "detail": "Free plan limit: You can only create up to 3 URLs" }
```

**Frontend Behavior**:
- Display exact detail from backend
- Suggest upgrading plan (future feature)

**UI Message**:
```
"Free plan limit: You can only create up to 3 URLs"
// Exact detail from backend
```

---

#### 404 Not Found

**Scenario**: Short URL not found or inactive

**Backend Response**:
```json
{ "detail": "Short URL not found" }
```

**Frontend Behavior**:
- Display clear "not found" state
- Offer navigation back to dashboard

**UI Message**:
```
"URL not found or inactive"
```

---

#### 410 Gone

**Scenario**: URL expired or click limit reached

**Backend Response**:
```json
{ "detail": "Short URL has expired or reached its click limit" }
```

**Frontend Behavior**:
- Display "expired" state
- Clearly indicate URL is no longer accessible

**UI Message**:
```
"URL expired or limit reached"
```

---

### Conflict Errors

#### 409 Conflict

**Scenario**: Resource already exists (e.g., duplicate email)

**Backend Response**:
```json
{ "detail": "Email already registered" }
```

**Frontend Behavior**:
- Display conflict message
- Suggest alternative action (e.g., "Please log in instead")

**UI Message**:
```
"This email is already registered. Please log in instead."
```

---

### Server Errors

#### 503 Service Unavailable

**Scenario**: nginx or backend is down/restarting

**Backend Response** (HTML):
```html
<html>
<head><title>503 Service Temporarily Unavailable</title></head>
<body>
  <h1>503 Service Temporarily Unavailable</h1>
</body>
</html>
```

**Frontend Behavior**:
- Detect `Content-Type: text/html`
- Do NOT attempt JSON parsing
- Display generic service unavailable message

**UI Message**:
```
"Service temporarily unavailable. Please try again later."
```

---

#### 500 Internal Server Error

**Scenario**: Unexpected server error

**Frontend Behavior**:
- Display generic error message
- Logs error to console (without sensitive data)

**UI Message**:
```
"Server error (500). Please try again."
```

---

### Network Errors

#### 0 (Network Failure)

**Scenario**: Cannot reach server (offline, CORS, etc.)

**Frontend Behavior**:
- Catch `TypeError` from fetch
- Display network error message

**UI Message**:
```
"Network error. Please check your connection."
```

---

## UI Error Display Pattern

- **Color**: Red for errors (`bg-red-50`, `text-red-800`)
- **Position**: Above form, below page description
- **Dismissal**: Auto-clear on new submission
- **Accessibility**: ARIA labels for screen readers

---

## Error Response Formats

### JSON Error (Standard)

Most backend errors follow this format:

```json
{
  "detail": "Error message string"
}
```

Or for validation errors:

```json
{
  "detail": [
    { "loc": [...], "msg": "...", "type": "..." }
  ]
}
```

### HTML Error (nginx/Server Down)

Returns HTML page with `Content-Type: text/html`:

```html
<!DOCTYPE html>
<html>
<head><title>503 Service Temporarily Unavailable</title></head>
<body>...</body>
</html>
```

**Frontend must detect this and avoid JSON parsing.**

---

## Recovery Actions

### User-Initiated

- **401 on protected route**: Redirect to login
- **Network error**: Display retry option
- **Validation error**: Highlight invalid fields

### Automatic

- **Token invalid (401)**: Clear localStorage, redirect to login
- **HTML response**: Show generic message without parsing

---

## Error Logging

**What NOT to log**:
- ❌ JWT tokens
- ❌ Passwords
- ❌ Sensitive user data

**What to log** (console only, not sent to server... yet):
- ✅ HTTP status codes
- ✅ Error messages (sanitized)
- ✅ Request URLs (without query params if sensitive)

**Example**:
```typescript
console.error('API Error:', {
  status: err.status,
  message: err.message,
  url: '/api/auth/login-json'
});
```

---

## Testing Error Scenarios

### Manual Test Cases

1. **401 - Invalid login**
   - Enter wrong password
   - Verify error message displays
   - Verify token not saved

2. **409 - Duplicate registration**
   - Register with existing email
   - Verify conflict message displays

3. **422 - Validation error**
   - Submit invalid email format
   - Verify validation message displays

4. **503 - Service unavailable**
   - Stop backend: `docker compose stop backend`
   - Attempt login
   - Verify HTML response handled gracefully

5. **Network error**
   - Disable network
   - Attempt login
   - Verify network error message

6. **Token expiration**
   - Login successfully
   - Manually invalidate token in localStorage
   - Visit `/app/me`
   - Verify redirect to login

---

## Future Enhancements

- **Toast notifications**: Non-blocking error display
- **Retry logic**: Automatic retry for 5xx errors
- **Error reporting**: Send errors to monitoring service (without sensitive data)
- **Offline mode**: Queue requests when offline
- **Field-level validation**: Highlight specific form fields with errors
