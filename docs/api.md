# API Reference - URL Shortener MVP

Complete request/response examples for all endpoints. All examples use base URL `http://localhost:8010`.

---

## Authentication

### Register User

**Endpoint**: `POST /api/auth/register`

**PowerShell**:
```powershell
$body = @{
    email = "demo@test.local"
    password = "SecurePass123!"
} | ConvertTo-Json

$user = Invoke-RestMethod `
    -Uri "http://localhost:8010/api/auth/register" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

**curl**:
```bash
curl -X POST "http://localhost:8010/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@test.local",
    "password": "SecurePass123!"
  }'
```

**Request Body**:
```json
{
  "email": "demo@test.local",
  "password": "SecurePass123!"
}
```

**Response** (201 Created):
```json
{
  "id": 1,
  "email": "demo@test.local",
  "is_active": true,
  "plan": "free",
  "created_at": "2026-01-09T19:00:00"
}
```

**Error** (400 Bad Request - duplicate email):
```json
{
  "detail": "Email already registered"
}
```

---

### Login (JSON)

**Endpoint**: `POST /api/auth/login-json`

**PowerShell**:
```powershell
$body = @{
    email = "demo@test.local"
    password = "SecurePass123!"
} | ConvertTo-Json

$auth = Invoke-RestMethod `
    -Uri "http://localhost:8010/api/auth/login-json" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

# Store token for authenticated requests
$token = $auth.access_token
```

**curl**:
```bash
TOKEN=$(curl -X POST "http://localhost:8010/api/auth/login-json" \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@test.local","password":"SecurePass123!"}' \
  | jq -r '.access_token')
```

**Request Body**:
```json
{
  "email": "demo@test.local",
  "password": "SecurePass123!"
}
```

**Response** (200 OK):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZW1vQHRlc3QubG9jYWwiLCJ1aWQiOjEsInBsYW4iOiJmcmVlIiwiZXhwIjoxNzM2NDY5NjAwfQ.xyz",
  "token_type": "bearer"
}
```

**Error** (401 Unauthorized - wrong password):
```json
{
  "detail": "Incorrect email or password"
}
```

---

### Login (Form Data)

**Endpoint**: `POST /api/auth/login`

**PowerShell**:
```powershell
$body = @{
    username = "demo@test.local"  # OAuth2 spec uses "username"
    password = "SecurePass123!"
}

$auth = Invoke-RestMethod `
    -Uri "http://localhost:8010/api/auth/login" `
    -Method POST `
    -Body $body

$token = $auth.access_token
```

**curl**:
```bash
TOKEN=$(curl -X POST "http://localhost:8010/api/auth/login" \
  -d "username=demo@test.local&password=SecurePass123!" \
  | jq -r '.access_token')
```

**Response**: Same as `/api/auth/login-json`

---

### Get Current User

**Endpoint**: `GET /api/me`

**Requires**: `Authorization: Bearer <token>`

**PowerShell**:
```powershell
$headers = @{ Authorization = "Bearer $token" }
$me = Invoke-RestMethod `
    -Uri "http://localhost:8010/api/me" `
    -Headers $headers
```

**curl**:
```bash
curl -H "Authorization: Bearer $TOKEN" "http://localhost:8010/api/me"
```

**Response** (200 OK):
```json
{
  "id": 1,
  "email": "demo@test.local",
  "is_active": true,
  "plan": "free",
  "created_at": "2026-01-09T19:00:00"
}
```

---

## URL Management

### Create Short URL

**Endpoint**: `POST /api/urls`

**Requires**: `Authorization: Bearer <token>`

**Note**: The required field is `long_url`. Do not use `original_url` or `url`.

**PowerShell**:
```powershell
$headers = @{ Authorization = "Bearer $token" }
# IMPORTANT: Use Correct field name 'long_url'
$body = @{
    long_url = "https://example.com"
} | ConvertTo-Json

try {
    $url = Invoke-RestMethod `
        -Uri "http://localhost:8010/api/urls" `
        -Method POST `
        -Headers $headers `
        -ContentType "application/json" `
        -Body $body `
        -ErrorAction Stop

    $shortCode = $url.short_code
} catch {
    Write-Error "Failed to create URL: $_"
    # Note: If the call fails, $url will be $null and $url.short_code will be empty.
    # Always use try/catch or -ErrorAction Stop to handle errors.
}
```

**curl**:
```bash
curl -X POST "http://localhost:8010/api/urls" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"long_url": "https://example.com"}'
```

**Request Body**:
```json
{
  "long_url": "https://example.com",
  "expires_at": "2026-12-31T23:59:59"  // optional
}
```

**Response** (201 Created):
```json
{
  "id": 1,
  "short_code": "a",
  "long_url": "https://example.com",
  "created_at": "2026-01-09T19:00:00",
  "expires_at": null,
  "is_active": true
}
```

**Error** (403 Forbidden - free tier limit):
```json
{
  "detail": "Free plan limit reached (max 3 active URLs)"
}
```

**Error** (401 Unauthorized - missing token):
```json
{
  "detail": "Not authenticated"
}
```

**Error** (422 Unprocessable Entity - invalid URL):
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

## Redirection

### Redirect to Long URL

**Endpoint**: `GET /{short_code}`

**Status**: Returns **302 Found** (not 301).

**PowerShell** (Checking Location without following):
```powershell
# Load HttpClient to control redirect behavior (Invoke-WebRequest -MaximumRedirection 0 is unreliable for 302s)
Add-Type -AssemblyName System.Net.Http

$handler = New-Object System.Net.Http.HttpClientHandler
$handler.AllowAutoRedirect = $false
$client = New-Object System.Net.Http.HttpClient($handler)

try {
    $response = $client.GetAsync("http://localhost:8010/$shortCode").Result

    # Check status and location
    $statusCode = [int]$response.StatusCode  # Expected: 302
    $location = $response.Headers.GetValues("Location") | Select-Object -First 1

    Write-Host "Status: $statusCode"
    Write-Host "Location: $location"
} finally {
    # Cleanup
    $client.Dispose()
    $handler.Dispose()
}
```

**curl**:
```bash
curl -I "http://localhost:8010/$shortCode"
# HTTP/1.1 302 Found
# Location: https://example.com
```

**Response** (302 Found):
```
HTTP/1.1 302 Found
Location: https://example.com
Content-Length: 0
```

**Error** (404 Not Found - invalid code):
```json
{
  "detail": "Short URL not found or inactive"
}
```

**Note**: Each successful redirect increments `click_count` and creates a record in the `clicks` table.

---

## Analytics

### Get URL Statistics

**Endpoint**: `GET /api/urls/{short_code}/stats`

**PowerShell**:
```powershell
$stats = Invoke-RestMethod `
    -Uri "http://localhost:8010/api/urls/$shortCode/stats"

Write-Host "Total clicks: $($stats.total_clicks)"
$stats.by_date | ForEach-Object { 
    Write-Host "$($_.date): $($_.clicks) clicks" 
}
```

**curl**:
```bash
curl "http://localhost:8010/api/urls/$shortCode/stats" | jq
```

**Response** (200 OK):
```json
{
  "url": {
    "id": 1,
    "short_code": "a",
    "long_url": "https://example.com",
    "created_at": "2026-01-09T19:00:00",
    "expires_at": null,
    "is_active": true
  },
  "total_clicks": 5,
  "by_date": [
    {
      "date": "2026-01-09",
      "clicks": 3
    },
    {
      "date": "2026-01-10",
      "clicks": 2
    }
  ]
}
```

**Warning**: This endpoint returns the `long_url` in the response body. Be careful not to shorten sensitive URLs as they will be exposed here.

**Note**: This endpoint does NOT require authentication (public analytics).

---

## Health Check

### Check API Status

**Endpoint**: `GET /api/health`

**PowerShell**:
```powershell
Invoke-RestMethod -Uri "http://localhost:8010/api/health"
```

**curl**:
```bash
curl "http://localhost:8010/api/health"
```

**Response** (200 OK):
```json
{
  "status": "ok"
}
```

---

## Complete Workflow Example

### PowerShell

```powershell
# 1. Register
$body = @{ email = "test@example.com"; password = "Pass123!" } | ConvertTo-Json
$user = Invoke-RestMethod -Uri "http://localhost:8010/api/auth/register" `
    -Method POST -ContentType "application/json" -Body $body

# 2. Login
$body = @{ email = "test@example.com"; password = "Pass123!" } | ConvertTo-Json
$auth = Invoke-RestMethod -Uri "http://localhost:8010/api/auth/login-json" `
    -Method POST -ContentType "application/json" -Body $body
$token = $auth.access_token

# 3. Create URL
$headers = @{ Authorization = "Bearer $token" }
# IMPORTANT: use long_url
$body = @{ long_url = "https://google.com" } | ConvertTo-Json
try {
    $url = Invoke-RestMethod -Uri "http://localhost:8010/api/urls" `
        -Method POST -Headers $headers -ContentType "application/json" -Body $body -ErrorAction Stop
    $shortCode = $url.short_code
    Write-Host "Short URL: http://localhost:8010/$shortCode"
} catch {
    Write-Error "Failed to create URL: $_"
}

# 4. Test redirect
Add-Type -AssemblyName System.Net.Http
$handler = New-Object System.Net.Http.HttpClientHandler
$handler.AllowAutoRedirect = $false
$client = New-Object System.Net.Http.HttpClient($handler)
$response = $client.GetAsync("http://localhost:8010/$shortCode").Result
$location = $response.Headers.GetValues("Location") | Select-Object -First 1
Write-Host "Redirects to: $location"
$client.Dispose()

# 5. Check stats
$stats = Invoke-RestMethod -Uri "http://localhost:8010/api/urls/$shortCode/stats"
Write-Host "Total clicks: $($stats.total_clicks)"
```

### Bash

```bash
# 1. Register
curl -X POST "http://localhost:8010/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Pass123!"}'

# 2. Login
TOKEN=$(curl -X POST "http://localhost:8010/api/auth/login-json" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Pass123!"}' \
  | jq -r '.access_token')

# 3. Create URL
SHORT_CODE=$(curl -X POST "http://localhost:8010/api/urls" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"long_url":"https://google.com"}' \
  | jq -r '.short_code')

echo "Short URL: http://localhost:8010/$SHORT_CODE"

# 4. Test redirect
curl -I "http://localhost:8010/$SHORT_CODE"

# 5. Check stats
curl "http://localhost:8010/api/urls/$SHORT_CODE/stats" | jq
```
