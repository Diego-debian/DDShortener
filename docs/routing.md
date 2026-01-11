# Routing Architecture

## Overview

The URL shortener uses a multi-tier routing architecture with nginx as the entry point, distributing requests to either the React SPA frontend or FastAPI backend based on URL patterns.

## Route Hierarchy

### Priority Order

nginx processes locations in this priority order:

1. **Exact match**: `location = /app`
2. **Prefix match with modifier**: `location ^~ /app-config/`
3. **Regex match**: (not used currently)
4. **Prefix match**: `location /api/`, `location /`

### Route Definitions

```
Request Flow:
  ↓
nginx (port 80)
  ├─ /app-config/*  → Static files (promotions.json)
  ├─ /app/*         → Frontend SPA (React)
  ├─ /api/*         → Backend API (FastAPI)
  └─ /{short_code}  → Backend redirect

```

---

## Frontend Routes (`/app/*`)

**Handler**: React Router (client-side routing)

**nginx Configuration**:
```nginx
location ^~ /app/ {
    proxy_pass http://frontend_app/;
}
```

**React Routes**:
- `/app/login` - Login page
- `/app/register` - Registration page
- `/app/dashboard` - User dashboard (protected)
- `/app/me` - User profile (protected)
- `/app/stats/:short_code` - URL statistics (public)
- `/app/go/:short_code` - Promotional page with countdown (public)
- `/app/about` - About page

**Why `/app/*` prefix?**

The `/app/` prefix is REQUIRED to prevent conflicts with the backend's `/{short_code}` redirect route.

**Without `/app/` prefix**:
```
/login       → Backend tries to redirect (404)
/dashboard   → Backend tries to redirect (404)
/xyz123      → Could be frontend route OR short code (ambiguous)
```

**With `/app/` prefix**:
```
/app/login   → Frontend route (unambiguous)
/app/dashboard → Frontend route (unambiguous)
/xyz123      → Backend short code redirect (unambiguous)
```

---

## Backend Routes (`/api/*` and `/{short_code}`)

**Handler**: FastAPI backend

**nginx Configuration**:
```nginx
# API endpoints
location ^~ /api/ {
    proxy_pass http://backend_app/api/;
}

# Short code redirects (catch-all)
location / {
    proxy_pass http://backend_app;
}
```

**API Endpoints** (`/api/*`):
- `POST /api/auth/register`
- `POST /api/auth/login-json`
- `GET /api/me`
- `POST /api/urls`
- `GET /api/urls/{short_code}/stats`

**Redirect Endpoint** (`/{short_code}`):
- `GET /{any}` → Backend checks database, returns 302/404/410

---

## Static Config Routes (`/app-config/*`)

**Handler**: nginx (static files)

**nginx Configuration**:
```nginx
location /app-config/ {
    alias /etc/nginx/app-config/;
    add_header Cache-Control "public, max-age=120";  # 2 min cache
    add_header Content-Type "application/json";
    try_files $uri =404;
}
```

**Files**:
- `/app-config/promotions.json` - YouTube video configuration

**Purpose**: Allow configuration changes without frontend redeploy

**Docker Volume**:
```yaml
volumes:
  - ./app-config:/etc/nginx/app-config:ro
```

---

## Key Design Decisions

### 1. `/app/go/:short_code` vs `/{short_code}`

**Question**: Why doesn't `/app/go/:short_code` conflict with `/{short_code}`?

**Answer**: They have different URL prefixes.

**Routing**:
- `/app/go/test123` → Matches `/app/` prefix → Frontend SPA → React Router handles `/go/:short_code`
- `/test123` → No `/app/` or `/api/` prefix → Backend → FastAPI handles `/{short_code}`

**Request Flow Example**:

```
User clicks: https://example.com/app/go/test123
  ↓
nginx sees: /app/go/test123
  ↓
Matches: ^~ /app/
  ↓
Proxy to: frontend_app/go/test123
  ↓
Frontend serves: index.html
  ↓
React Router sees: /go/test123
  ↓
Renders: Go component with short_code="test123"
  ↓
After countdown: window.location.href = "/test123"
  ↓
Browser navigates: https://example.com/test123
  ↓
nginx sees: /test123
  ↓
No /app/ or /api/ prefix
  ↓
Proxy to: backend_app/test123
  ↓
Backend queries DB, returns 302 redirect
```

### 2. Same-Origin Policy

All routes (`/app/*`, `/api/*`, `/app-config/*`, `/{short_code}`) are served from the same origin (e.g., `http://localhost`).

**Benefits**:
- No CORS issues
- Simplified authentication (cookies work seamlessly)
- Better security (no cross-origin requests)

### 3. Static Files via nginx

Config files like `promotions.json` are served directly by nginx, not proxied to frontend/backend.

**Benefits**:
- Faster (no proxy overhead)
- Cacheable (reduce server load)
- Editable without redeploy

---

## Example Request Flows

### Frontend Page

```
GET /app/dashboard
  ↓
nginx: matches /app/
  ↓
Proxy to frontend → Serves index.html
  ↓
React loads → Renders Dashboard component
```

### API Call from Frontend

```
GET /api/me
  ↓
nginx: matches /api/
  ↓
Proxy to backend → FastAPI handles request
  ↓
Returns JSON response
```

### Short URL Redirect

```
GET /abc123
  ↓
nginx: no /app/ or /api/ prefix
  ↓
Proxy to backend → FastAPI queries DB
  ↓
Returns 302 redirect to long_url
```

### Config File Fetch

```
GET /app-config/promotions.json
  ↓
nginx: matches /app-config/
  ↓
Serve static file directly
  ↓
Returns JSON with Cache-Control header
```

---

## Rate Limiting

Applied at nginx level for specific routes:

**Creation endpoint**:
```nginx
location = /api/urls {
    limit_req zone=creation_limit burst=3;
    proxy_pass...
}
```

**Redirect endpoint**:
```nginx
location / {
    limit_req zone=redirect_limit burst=20;
    proxy_pass...
}
```

**Not rate-limited**:
- `/app/*` (frontend SPA)
- `/app-config/*` (static files)
- `/api/auth/*` (login/register)

---

## Port Configuration

**External**:
- Port 80 → nginx proxy

**Internal** (Docker network):
- nginx → frontend:80
- nginx → backend:8000
- backend → postgres:5432

---

## Path Rewriting

### Frontend

```nginx
location ^~ /app/ {
    proxy_pass http://frontend_app/;
}
```

**Example**:
- Request: `/app/dashboard`
- Proxied as: `/dashboard` (to frontend)
- Frontend nginx serves: index.html for all paths

### Backend API

```nginx
location ^~ /api/ {
    proxy_pass http://backend_app/api/;
}
```

**Example**:
- Request: `/api/me`
- Proxied as: `/api/me` (to backend)
- FastAPI route: `@app.get("/api/me")`

---

## Troubleshooting

### Frontend page shows 404

**Check**: Is nginx routing to frontend?
```bash
curl -I http://localhost/app/dashboard
# Should return 200, not 404
```

### API call returns HTML instead of JSON

**Check**: Is request going to backend?
```bash
curl http://localhost/api/me
# Should return JSON or 401, not HTML
```

### Short URL redirect doesn't work

**Check**: Is backend receiving request?
```bash
docker compose logs backend | grep "GET /"
```

### Config file not found

**Check**: Is volume mounted correctly?
```bash
docker compose exec proxy ls /etc/nginx/app-config/
# Should list promotions.json
```

---

## Summary

| Route Pattern | Handler | Purpose |
|---------------|---------|---------|
| `/app-config/*` | nginx (static) | Config files (promotions.json) |
| `/app/*` | Frontend SPA | React application |
| `/api/*` | Backend API | REST API endpoints |
| `/{short_code}` | Backend | Short URL redirects |

**Key Rule**: All URL patterns are mutually exclusive by prefix, preventing conflicts.
