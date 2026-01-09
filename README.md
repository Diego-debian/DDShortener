# URL Shortener MVP (Refactored)

This project is a FastAPI-based URL shortener. It has been refactored into a modular structure using routers and services.

## Project Structure

- `app/main.py`: Application entry point and router inclusion.
- `app/models.py`: Database models (`User`, `URL`, `Click`).
- `app/schemas.py`: Pydantic schemas.
- `app/core/config.py`: Environment configuration.
- `app/core/security.py`: Authentication utilities (JWT, hashing).
- `app/routers/`: API endpoints.
  - `health.py`: Health check logic.
  - `urls.py`: URL management (create, stats).
  - `redirect.py`: Redirection logic.
  - `auth.py`: User authentication (register, login).
- `app/services/`: Business logic.
  - `url_service.py`: URL creation logic.
  - `redirect_service.py`: Redirect lookup and click tracking.
  - `stats_service.py`: Statistics aggregation.

## Rate Limiting (Nginx)

The project includes basic rate limiting configured in Nginx to protect the application:

- **URL Creation (`POST /api/urls`)**: Limited to **1 request/second** (burst 3).
- **Redirects & Others (`GET /...`)**: Limited to **10 requests/second** (burst 20).

These limits are defined in `nginx/nginx.conf` using `limit_req_zone` and can be adjusted there.

## How to Run

1. **Start the stack**:
   ```bash
   docker compose up --build
   ```

2. **Endpoints**:

   - **Health**: `GET /api/health`
   - **Auth**:
     - `POST /api/auth/register` (JSON: `{ "email": "user@example.com", "password": "password" }`)
     - `POST /api/auth/login` (Form Data: `username=user@example.com`, `password=password`) -> Returns `access_token`
   - **Create URL** (Requires Auth):
     - `POST /api/urls` (Header: `Authorization: Bearer <token>`, JSON: `{ "long_url": "https://example.com" }`)
   - **Redirect**: `GET /{short_code}`
   - **Stats**: `GET /api/urls/{short_code}/stats` (Requires Auth for some logic or open? Currently open but usually protected)

## Testing Steps (Manual)

### 1. Register and Login
```bash
curl -X POST "http://localhost:8010/api/auth/register" -H "Content-Type: application/json" -d "{\"email\": \"test@test.com\", \"password\": \"secret\"}"
curl -X POST "http://localhost:8010/api/auth/login" -d "username=test@test.com&password=secret"
# OR via JSON:
curl -X POST "http://localhost:8010/api/auth/login-json" -H "Content-Type: application/json" -d "{\"email\": \"test@test.com\", \"password\": \"secret\"}"
# Save the access token

```

### 2. Create URL
```bash
curl -X POST "http://localhost:8010/api/urls" -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" -d "{\"long_url\": \"https://google.com\"}"
```

### 3. Redirect
Open `http://localhost:8010/{short_code}` in browser or use curl:
```bash
curl -I http://localhost:8010/{short_code}
```

### 4. Stats
```bash
curl http://localhost:8010/api/urls/{short_code}/stats
```

## Database Migrations (Manual)

To apply database schema changes, run migrations in order:

### Initial Setup (Run Once)

**Migration 0001: Users and Basic Limits**
```bash
# PowerShell/Windows:
Get-Content docs/migrations/0001_users_limits.sql | docker compose exec -T db psql -U shortener_user -d shortener

# Linux/Mac:
docker compose exec -T db psql -U shortener_user -d shortener < docs/migrations/0001_users_limits.sql
```

**Migration 0002: User Tracking (REQUIRED for MVP)**
```bash
# PowerShell/Windows:
Get-Content docs/migrations/0002_add_user_tracking.sql | docker compose exec -T db psql -U shortener_user -d shortener

# Linux/Mac:
docker compose exec -T db psql -U shortener_user -d shortener < docs/migrations/0002_add_user_tracking.sql
```

### Verify Schema
```bash
docker compose exec -T db psql -U shortener_user -d shortener -c "\d+ urls"
```

---

## DB Contract (MVP)

The application **requires** the following columns in the `urls` table to function correctly:

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `user_email` | VARCHAR | NULL | Associates URLs with users (logical FK) |
| `click_count` | INTEGER | 0 | Tracks total clicks for each URL |
| `click_limit` | INTEGER | 1000 | Maximum allowed clicks before URL stops redirecting |

### User-URL Relationship

**Important Design Decision:**

The relationship between **User** and **URL** is established through **email** (logical foreign key), not through a traditional integer `user_id` foreign key constraint.

- ✅ **Current MVP**: `urls.user_email` references `users.email` (by value, no FK constraint)
- ⏭️ **Future Phase**: Could migrate to `urls.user_id` with proper `FOREIGN KEY` constraint

**Why this approach?**
1. **Simplicity**: No JOIN needed for free tier limit queries
2. **JWT Integration**: JWT `sub` claim already contains user email
3. **Denormalization**: Acceptable for MVP scale
4. **Flexibility**: URLs can exist independently (e.g., if user is deleted)

### Critical Columns

These columns **must exist** for the application to work:

- `urls.user_email` - Used by `url_service.py` to enforce free tier limit (3 URLs)
- `urls.click_count` - Used by `redirect_service.py` to track clicks atomically
- `urls.click_limit` - Used by `redirect_service.py` to enforce click limits
- `urls.is_active` - Used by `redirect_service.py` to filter inactive URLs

If any of these columns are missing, you'll see errors like:
```
column urls.user_email does not exist
```

**Solution**: Run migration `0002_add_user_tracking.sql` (see Database Migrations section above).

---

## Automated Verification

Run the full test suite to validate everything works:

```bash
powershell -ExecutionPolicy Bypass -File .\verify.ps1
```

**Expected output**: All 8 tests pass
- ✅ Docker compose up
- ✅ Backend health
- ✅ User registration
- ✅ User login (JWT)
- ✅ Create 3 URLs (free tier)
- ✅ 4th URL blocked (403 limit)
- ✅ Redirect (302)
- ✅ Stats endpoint
