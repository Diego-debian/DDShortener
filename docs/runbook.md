# Operations Runbook

## Table of Contents

- [Daily Operations](#daily-operations)
- [Configuration Management](#configuration-management)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)
- [Emergency Procedures](#emergency-procedures)

---

## Daily Operations

### Starting the Services

```bash
cd /path/to/url_shortener_project/repo
docker compose up -d
```

**Expected output**:
```
[+] Running 4/4
 ✔ Container shortener_db      Started
 ✔ Container shortener_backend Started
 ✔ Container shortener_frontend Started
 ✔ Container shortener_proxy   Started
```

**Verify services**:
```bash
docker compose ps
# All should show "running"
```

### Stopping the Services

```bash
docker compose down
```

**Preserve database**:
```bash
docker compose down
# Volumes are preserved by default
```

**Clean shutdown (with volume removal)**:
```bash
docker compose down -v
# WARNING: This deletes the database!
```

---

## Configuration Management

### Updating promotions.json

**Location**: `app-config/promotions.json`

**Steps**:

1. **Edit the file**:
```bash
cd app-config
nano promotions.json
```

2. **Validate JSON**:
```bash
cat promotions.json | python -m json.tool
# Should show pretty-printed JSON with no errors
```

3. **Apply changes**:

**Option A**: Wait for cache (2 minutes)
```bash
# Changes will be live within ~2 minutes
```

**Option B**: Restart nginx immediately
```bash
docker compose restart proxy
# Takes ~1 second, briefly interrupts service
```

4. **Verify**:
```bash
curl http://localhost/app-config/promotions.json
# Should show updated config
```

**Example: Change countdown to 3 seconds**:
```json
{
  "hold_seconds": 3,  // Changed from 5
  "videos": [...]
}
```

**Example: Add new video**:
```json
{
  "hold_seconds": 5,
  "videos": [
    { "id": "dQw4w9WgXcQ", "weight": 1 },
    { "id": "jNQXAC9IVRw", "weight": 1 },
    { "id": "9bZkp7q19f0", "weight": 1 }  // NEW
  ]
}
```

**Example: Disable videos (countdown only)**:
```json
{
  "hold_seconds": 5,
  "videos": []  // Empty array = no videos
}
```

### Updating Environment Variables

**Location**: `.env` file (create if not exists)

**Steps**:

1. **Edit `.env`**:
```bash
DATABASE_URL=postgresql://user:pass@db:5432/dbname
JWT_SECRET=your-secret-key-here
```

2. **Restart affected services**:
```bash
docker compose up -d --force-recreate backend
```

---

## Monitoring

### Check Service Health

**All services**:
```bash
docker compose ps
```

**Backend logs**:
```bash
docker compose logs -f backend
# Ctrl+C to exit
```

**Frontend logs**:
```bash
docker compose logs -f frontend
```

**nginx logs**:
```bash
docker compose logs -f proxy
```

**Database logs**:
```bash
docker compose logs -f db
```

### Check Resource Usage

```bash
docker stats
```

### Verify Endpoints

**Frontend**:
```bash
curl -I http://localhost/app/
# Should return 200
```

**Backend API**:
```bash
curl http://localhost/api/docs
# Should return Swagger UI HTML
```

**Promotions config**:
```bash
curl http://localhost/app-config/promotions.json
# Should return JSON
```

**Short URL redirect** (example):
```bash
curl -I http://localhost/test123
# Should return 404 or 302 depending on if code exists
```

---

## Security

### Verify Security Headers

**Check all security headers are present**:

```bash
# Check Content-Security-Policy
curl -I http://localhost/app/ | grep Content-Security-Policy

# Expected output includes:
# frame-src https://www.youtube-nocookie.com

# Check X-Content-Type-Options
curl -I http://localhost/app/ | grep X-Content-Type-Options

# Expected: X-Content-Type-Options: nosniff

# Check Referrer-Policy
curl -I http://localhost/app/ | grep Referrer-Policy

# Expected: Referrer-Policy: strict-origin-when-cross-origin

# Check Permissions-Policy
curl -I http://localhost/app/ | grep Permissions-Policy

# Expected: Permissions-Policy: camera=(), microphone=(), geolocation=()
```

**Test CSP Compliance**:

```bash
# Navigate to Go page and check browser console
# Should see NO CSP violations
# YouTube embed should load correctly
```

**If headers missing**:
1. Check nginx.conf has security headers in server block
2. Restart nginx: `docker compose restart proxy`
3. Verify again

---

## Troubleshooting

### Frontend not loading

**Symptoms**: Browser shows white screen or 404

**Check**:
```bash
# Is frontend container running?
docker compose ps frontend

# Check frontend logs
docker compose logs frontend | tail -20

# Is nginx routing correctly?
curl -I http://localhost/app/
```

**Solutions**:
1. **Rebuild frontend**:
```bash
docker compose up -d --build frontend
```

2. **Check nginx config**:
```bash
docker compose exec proxy cat /etc/nginx/nginx.conf | grep "location /app"
```

### API returns HTML instead of JSON

**Symptoms**: API calls get HTML error pages

**Check**:
```bash
# Is backend running?
docker compose ps backend

# Check backend logs for errors
docker compose logs backend | grep ERROR
```

**Solutions**:
1. **Restart backend**:
```bash
docker compose restart backend
```

2. **Check database connection**:
```bash
docker compose exec backend env | grep DATABASE
```

### promotions.json not updating

**Symptoms**: Changes to config not reflected in frontend

**Check**:
```bash
# Verify file on host
cat app-config/promotions.json

# Verify file in container
docker compose exec proxy cat /etc/nginx/app-config/promotions.json

# Check cache headers
curl -I http://localhost/app-config/promotions.json | grep Cache-Control
```

**Solutions**:
1. **Wait for cache** (2 minutes)

2. **Hard refresh browser** (Ctrl+Shift+R)

3. **Restart nginx**:
```bash
docker compose restart proxy
```

4. **Verify volume mount**:
```bash
docker compose exec proxy ls /etc/nginx/app-config/
# Should list promotions.json
```

### Database connection errors

**Symptoms**: Backend logs show "connection refused" or "could not connect"

**Check**:
```bash
# Is postgres running?
docker compose ps db

# Check postgres logs
docker compose logs db | tail -20
```

**Solutions**:
1. **Restart database**:
```bash
docker compose restart db
```

2. **Rebuild database** (WARNING: loses data):
```bash
docker compose down
docker compose up -d
```

### Rate limiting triggering unexpectedly

**Symptoms**: Users getting 503 on legitimate requests

**Check nginx logs**:
```bash
docker compose logs proxy | grep "limiting requests"
```

**Solutions**:
1. **Adjust rate limits** in `nginx/nginx.conf`:
```nginx
# Increase burst size
limit_req zone=creation_limit burst=5;  # Was: burst=3
```

2. **Restart nginx**:
```bash
docker compose restart proxy
```

---

## Emergency Procedures

### Complete Service Restart

```bash
# Stop all services
docker compose down

# Start all services
docker compose up -d

# Verify
docker compose ps
curl -I http://localhost/app/
```

### Reset Database (DESTRUCTIVE)

```bash
# Stop services
docker compose down

# Remove volumes
docker volume rm url_shortener_project_postgres-data

# Restart (will recreate DB)
docker compose up -d

# Run migrations
docker compose exec backend alembic upgrade head
```

### Rollback Configuration

**If promotions.json breaks site**:

```bash
# Quick fix: empty videos array
echo '{"hold_seconds": 5, "videos": []}' > app-config/promotions.json

# Restart nginx
docker compose restart proxy
```

**If nginx config breaks**:

```bash
# Restore from git
git checkout nginx/nginx.conf

# Restart nginx
docker compose restart proxy
```

### View All Logs

```bash
# Last 100 lines from all services
docker compose logs --tail=100

# Follow all logs
docker compose logs -f
```

---

## Backup and Restore

### Backup Database

```bash
# Export database
docker compose exec db pg_dump -U postgres url_shortener > backup_$(date +%Y%m%d).sql
```

### Restore Database

```bash
# Stop backend to avoid conflicts
docker compose stop backend

# Restore from backup
cat backup_20260111.sql | docker compose exec -T db psql -U postgres url_shortener

# Restart backend
docker compose start backend
```

---

## Regular Maintenance

### Weekly

- Check disk space: `df -h`
- Review logs for errors: `docker compose logs | grep ERROR`
- Verify all services running: `docker compose ps`

### Monthly

- Update Docker images: `docker compose pull && docker compose up -d`
- Review and archive old logs
- Check for security updates

---

## Quick Reference

### Common Commands

```bash
# View service status
docker compose ps

# View logs (last 20 lines)
docker compose logs --tail=20 backend

# Restart a service
docker compose restart backend

# Rebuild a service
docker compose up -d --build frontend

# Access container shell
docker compose exec backend bash

# Check nginx config syntax
docker compose exec proxy nginx -t

# Reload nginx config
docker compose exec proxy nginx -s reload
```

### Important Files

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Service orchestration |
| `nginx/nginx.conf` | Proxy and routing rules |
| `app-config/promotions.json` | Video configuration |
| `.env` | Environment variables |
| `backend/alembic/versions/*.py` | Database migrations |

### Service URLs

| Service | URL | Notes |
|---------|-----|-------|
| Frontend SPA | http://localhost/app/ | React application |
| Backend API Docs | http://localhost/api/docs | Swagger UI |
| Promotions Config | http://localhost/app-config/promotions.json | JSON file |
| Short URL Example | http://localhost/{code} | Backend redirect |

---

## Support

For issues not covered in this runbook:

1. Check application logs
2. Review [troubleshooting](#troubleshooting) section
3. Check GitHub issues (if applicable)
4. Consult technical documentation in `docs/`
