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

To apply the database changes for users and limits:

1. Copy the SQL file to the container:
   ```bash
   docker cp docs/migrations/0001_users_limits.sql shortener_db:/tmp/migration.sql
   ```

2. Run the SQL using psql:
   ```bash
   docker exec -it shortener_db psql -U shortener_user -d shortener -f /tmp/migration.sql
   ```
