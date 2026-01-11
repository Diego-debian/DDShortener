# System Architecture

## Overview

The URL Shortener system consists of four main services orchestrated by Docker Compose:

1. **Proxy** (nginx) - Entry point for all HTTP traffic
2. **Frontend** (React SPA) - User interface served under `/app/*`
3. **Backend** (FastAPI) - API endpoints and redirection logic
4. **Database** (PostgreSQL) - Data persistence

## Request Flow

All HTTP requests enter through the **proxy service** (nginx on port 80), which routes them based on URL patterns:

```
┌─────────────────────────────────────────────────────────────┐
│                    Nginx Proxy (Port 80)                    │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │   Route Matching   │
                    └─────────┬─────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ /app/* → ①   │     │ /api/* → ②   │     │ /* → ③       │
│ Frontend SPA │     │ Backend API  │     │ Backend      │
│ (React)      │     │ (FastAPI)    │     │ Redirection  │
└──────────────┘     └──────────────┘     └──────────────┘
```

### Priority Order

Nginx location matching follows this priority:

1. **`location = /app`** - Exact match, redirects to `/app/`
2. **`location ^~ /app/`** - Prefix match, no regex, routes to frontend
3. **`location = /api/urls`** - Exact match with rate limiting
4. **`location ^~ /api/`** - Prefix match for other API routes
5. **`location /`** - Fallback for short URL redirection (`/{short_code}`)

This ensures:
- `/app/login` → Frontend
- `/api/docs` → Backend (FastAPI docs)
- `/abc123` → Backend (short URL redirection)

## Same-Origin Policy

The frontend and backend are served from the **same domain** via nginx proxy. This eliminates CORS issues:

- **Frontend**: `http://localhost/app/*`
- **Backend API**: `http://localhost/api/*`
- **Redirection**: `http://localhost/{short_code}`

Frontend code can make API calls using relative paths:

```typescript
fetch('/api/urls')  // Same origin, no CORS needed
```

## Why `/app/*` for Frontend?

The frontend **must** use a prefix path (`/app/*`) to avoid conflicts with short URL redirection:

### Problem

If the frontend were served at `/`, it would capture all requests, including short codes:

```
User visits: http://localhost/abc123
Without prefix: Frontend SPA catches it → 404 in React Router ❌
```

### Solution

By serving the frontend under `/app/*`, we create clear separation:

```
http://localhost/app/dashboard  → Frontend (React Router)
http://localhost/abc123         → Backend (Redirect to target URL)
```

Nginx uses `location ^~` (prefix, no regex) to ensure `/app/` takes priority over the fallback `/` location.

## Routing Rules in Detail

### 1. Frontend Routes (`/app/*`)

```nginx
location = /app {
    return 301 /app/;
}

location ^~ /app/ {
    proxy_pass http://frontend_app/;
    # Headers for proper proxying
}
```

- Redirects `/app` to `/app/` for consistency
- Proxies to `frontend` container (nginx serving React build)
- Frontend's nginx uses `try_files` for SPA routing

### 2. API Routes (`/api/*`)

```nginx
location = /api/urls {
    limit_req zone=creation_limit burst=3 nodelay;
    proxy_pass http://backend_app;
}

location ^~ /api/ {
    proxy_pass http://backend_app;
}
```

- Rate limiting on URL creation endpoint (1 req/s)
- All `/api/*` requests go to backend (FastAPI)

### 3. Short URL Redirection (`/{short_code}`)

```nginx
location / {
    limit_req zone=redirect_limit burst=20 nodelay;
    proxy_pass http://backend_app;
}
```

- Fallback location for everything else
- Rate limiting (10 req/s) to prevent abuse
- Backend handles:
  - 302 redirect if URL exists and active
  - 404 if URL not found
  - 410 Gone if URL is soft-deleted

## Service Communication

### Docker Network

All services communicate via Docker's internal network:

```yaml
services:
  proxy:
    depends_on: [backend, frontend]
  
  frontend:
    # Runs nginx on port 80 (internal)
  
  backend:
    # Runs FastAPI on port 8000 (internal)
    depends_on: db
  
  db:
    # Runs PostgreSQL on port 5432 (internal)
```

Containers reference each other by service name:

- `proxy` → `http://frontend:80`
- `proxy` → `http://backend:8000`
- `backend` → `postgresql://db:5432`

### Exposed Ports

Only these ports are exposed to the host:

- `80:80` - Proxy (all traffic)
- `8010:8000` - Backend (direct access for debugging)
- `5433:5432` - Database (direct access for admin)

In production, only port 80 should be exposed.

## Data Flow Example

### Creating a Short URL

```
[User] → POST /api/urls → [Proxy] → [Backend] → [DB]
                                        ↓
                                    [Response with short_code]
```

### Accessing a Short URL

```
[User] → GET /abc123 → [Proxy] → [Backend] → [DB lookup]
                                      ↓
                                  [302 Redirect to target_url]
```

### Viewing Statistics

```
[User] → GET /app/stats/abc123 → [Proxy] → [Frontend SPA]
                                               ↓
[User] ← HTML/JS/CSS               
                                               ↓
[Frontend] → GET /api/urls/abc123/stats → [Backend] → [DB]
                                               ↓
[Frontend] ← JSON response with click data
```

## Security Considerations

### Rate Limiting

- **Creation**: 1 req/s (prevents spam)
- **Redirection**: 10 req/s (prevents DDoS)

Implemented at nginx level using `limit_req_zone`.

### Authentication

Backend enforces JWT authentication for protected endpoints. The frontend will:

1. Store JWT in memory or secure cookie
2. Include in `Authorization: Bearer <token>` header
3. Redirect to `/app/login` on 401 responses

### HTTPS

In production, add SSL/TLS:

```nginx
server {
    listen 443 ssl http2;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
}
```

## Tech Debt & Future Improvements

1. **Database migration**: Currently using `user_email` FK instead of `user_id`
2. **Frontend state management**: Add Zustand or React Query for API state
3. **Error boundaries**: Add React error boundaries for graceful failures
4. **Monitoring**: Add logging and metrics (Prometheus, Grafana)
5. **CI/CD**: Automate builds and deployments

## Troubleshooting

### Backend not accessible

Check if backend is healthy:

```bash
curl http://localhost:8010/docs
docker compose logs backend
```

### Frontend shows 404

Verify nginx routing:

```bash
curl -v http://localhost/app/
docker compose logs proxy
```

### Database connection errors

Check database is ready:

```bash
docker compose ps db
docker compose logs db
```
