# Deployment Guide - Nginx + Frontend

## Overview

Step-by-step guide to deploy the frontend and nginx proxy to production or staging environments.

---

## Pre-Deployment Checklist

### Code Quality

- [ ] All tests pass (`npm run build` succeeds)
- [ ] No TypeScript errors
- [ ] No `alert()` calls in codebase
- [ ] [QA Checklist](./qa_checklist.md) completed
- [ ] Security review done ([security_frontend.md](./security_frontend.md))

### Configuration

- [ ] Environment variables set (if applicable)
- [ ] `promotions.json` configured with valid video IDs
- [ ] nginx.conf reviewed (cache headers, security headers)
- [ ] Docker images built successfully

---

## Deployment Steps

### 1. Build Frontend

```bash
cd frontend
npm run build
```

**Verify output**:
```
✓ X modules transformed.
dist/index.html                  0.XX kB
dist/assets/index-XXXXX.css     XX.XX kB
dist/assets/index-XXXXX.js     XXX.XX kB
✓ built in X.XXs
```

**Check**: Dist folder created with hashed asset filenames

---

### 2. Build Docker Images

```bash
cd ..  # Back to project root
docker compose build
```

**Verify**:
```bash
docker compose images
# Should show: shortener_proxy, shortener_frontend, shortener_backend
```

---

### 3. Start Services

```bash
docker compose up -d
```

**Expected output**:
```
[+] Running 4/4
 ✔ Container shortener_db       Started
 ✔ Container shortener_backend  Started
 ✔ Container shortener_frontend Started
 ✔ Container shortener_proxy    Started
```

---

### 4. Verify Containers Running

```bash
docker compose ps
```

**All containers should show State: "running"**

---

## Post-Deployment Verification

### Route Verification

**Test each route type**:

```bash
# Frontend SPA (should return 200)
curl -I http://localhost/app/

# Backend API docs (should return 200 with HTML)
curl -I http://localhost/api/docs

# Promotions config (should return 200 with JSON)
curl http://localhost/app-config/promotions.json

# Short URL redirect (should return 404 or 302 depending on if code exists)
curl -I http://localhost/test123
```

**Expected**:
- All return appropriate status codes
- No 500 errors
- No nginx 502/504 errors

---

### Cache Headers Verification

**Critical verification** (run all 3):

#### 1. Index.html - No caching

```bash
curl -I http://localhost/app/ | grep Cache-Control
```

**Expected**: `Cache-Control: no-store, max-age=0, must-revalidate`

**Why**: Ensures users always get latest version

---

#### 2. Hashed Assets - Long cache + immutable

```bash
# Replace XXXXX with actual hash from build output
curl -I http://localhost/app/assets/index-XXXXX.js | grep Cache-Control
```

**Expected**: `Cache-Control: public, max-age=31536000, immutable`

**Why**: Hashed files safe to cache forever (hash changes if content changes)

**How to find actual filename**:
```bash
# List assets
curl -s http://localhost/app/ | grep -o 'assets/index-[^"]*\.js' | head -1
# Or check frontend/dist/assets/ directory
```

---

#### 3. Promotions config - Short cache

```bash
curl -I http://localhost/app-config/promotions.json | grep Cache-Control
```

**Expected**: `Cache-Control: public, max-age=120`

**Why**: Allow config updates without frontend redeploy (2 min cache)

---

### Security Headers Verification

**Check all security headers present**:

```bash
# All headers in one command
curl -I http://localhost/app/ | grep -E "(Content-Security|X-Content|Referrer|Permissions)"
```

**Expected output includes**:
```
Content-Security-Policy: default-src 'self'; ... frame-src https://www.youtube-nocookie.com;
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

**Individual checks**:

```bash
# CSP
curl -I http://localhost/app/ | grep Content-Security-Policy
# Should allow youtube-nocookie.com for embeds

# nosniff
curl -I http://localhost/app/ | grep X-Content-Type-Options
# Should show: nosniff

# Referrer Policy
curl -I http://localhost/app/ | grep Referrer-Policy
# Should show: strict-origin-when-cross-origin

# Permissions Policy
curl -I http://localhost/app/ | grep Permissions-Policy
# Should show: camera=(), microphone=(), geolocation=()
```

---

### Functional Verification

**Manual browser tests**:

1. **Navigate to** `http://localhost/app/`
   - Should redirect to `/app/login` (or `/app/dashboard` if logged in)
   - No console errors

2. **Login**
   - Enter valid credentials
   - Should redirect to `/app/dashboard`
   - Token saved in localStorage

3. **Create Short URL**
   - Enter valid long URL
   - Submit form
   - Should show success (Toast notification, not alert)
   - Short URL appears in history

4. **Go Page** `http://localhost/app/go/test123`
   - YouTube embed loads (if promotions.json configured)
   - Countdown visible (5→4→3→2→1→0)
   - Redirects to `/test123` after countdown

5. **Stats Page** `http://localhost/app/stats/:code`
   - Shows stats for existing URL
   - Shows appropriate error for non-existent URL (404, 410)

6. **Backend Redirect** `http://localhost/:short_code`
   - Existing code → 302 redirect to long_url
   - Non-existent code → 404
   - Expired code → 410

---

## Troubleshooting

### Frontend Not Loading

**Symptom**: White screen or 404 on `/app/`

**Checks**:
```bash
# Is nginx routing correctly?
docker compose logs proxy | grep "/app"

# Is frontend container running?
docker compose ps frontend

# Check frontend logs
docker compose logs frontend | tail -20
```

**Solutions**:
1. Rebuild frontend: `docker compose up -d --build frontend`
2. Check nginx config: `docker compose exec proxy nginx -t`
3. Restart proxy: `docker compose restart proxy`

---

### Assets Not Loading

**Symptom**: CSS/JS 404 errors in browser console

**Checks**:
```bash
# Check if assets exist in container
docker compose exec frontend ls /usr/share/nginx/html/assets

# Check nginx asset routing
curl -I http://localhost/app/assets/index-XXXXX.js
```

**Solutions**:
1. Verify build created dist/assets/
2. Rebuild: `docker compose up -d --build frontend`

---

### Cache Headers Not Applying

**Symptom**: `curl -I` doesn't show expected Cache-Control

**Checks**:
```bash
# Check nginx config syntax
docker compose exec proxy nginx -t

# Check nginx conf file
docker compose exec proxy cat /etc/nginx/nginx.conf | grep -A5 "location.*app"
```

**Solutions**:
1. Verify nginx.conf has cache headers
2. Restart nginx: `docker compose restart proxy`
3. Check for conflicting headers

---

### Security Headers Missing

**Symptom**: CSP or other headers not present

**Checks**:
```bash
# Check server block has headers
docker compose exec proxy cat /etc/nginx/nginx.conf | grep -A3 "Security Headers"
```

**Solutions**:
1. Verify nginx.conf has `add_header` directives in server block
2. Check `always` flag is present
3. Restart nginx: `docker compose restart proxy`

---

## Rollback Procedure

### Quick Rollback

If deployment fails, rollback to previous version:

```bash
# 1. Stop current deployment
docker compose down

# 2. Checkout previous version
git checkout <previous-tag>
# Example: git checkout v0.5.0-frontend-hardening

# 3. Rebuild and restart
docker compose build
docker compose up -d

# 4. Verify
docker compose ps
curl -I http://localhost/app/
```

---

### Gradual Rollback (Blue-Green)

For zero-downtime rollback (if applicable):

1. Keep old containers running
2. Deploy new version to different port
3. Test new version
4. Switch nginx upstream
5. Stop old containers

---

## Production Considerations

### HTTPS/SSL

**In production, enforce HTTPS**:

```nginx
# nginx.conf - production
server {
    listen 80;
    server_name example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name example.com;
    
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    # ... rest of config
}
```

---

### Environment Variables

**Never commit secrets**:

```bash
# Use .env file (gitignored)
DATABASE_URL=postgresql://user:pass@host/db
JWT_SECRET=your-secret-key-here
```

**Load in docker-compose**:
```yaml
services:
  backend:
    env_file:
      - .env
```

---

### Monitoring

**Set up monitoring**:
- Health checks: `/api/docs` should return 200
- Error logs: `docker compose logs` aggregation
- Resource usage: `docker stats`
- Uptime monitoring: External service (Pingdom, UptimeRobot)

---

### Backups

**Regular backups**:

```bash
# Database backup (daily)
docker compose exec db pg_dump -U postgres url_shortener > backup_$(date +%Y%m%d).sql

# Config backup
tar -czf config_backup_$(date +%Y%m%d).tar.gz nginx/ app-config/
```

---

## Deployment Checklist

### Pre-Deploy
- [ ] Code reviewed
- [ ] Tests pass
- [ ] QA checklist completed
- [ ] Security review done
- [ ] Backup created

### Deploy
- [ ] Build frontend
- [ ] Build Docker images
- [ ] Start services
- [ ] Containers running

### Post-Deploy
- [ ] Routes verified (frontend, API, config, redirect)
- [ ] Cache headers verified (index no-store, assets immutable, config short)
- [ ] Security headers verified (CSP, nosniff, referrer, permissions)
- [ ] Functional tests pass (login, create URL, Go page, Stats)
- [ ] No errors in logs
- [ ] Monitoring active

### Sign-Off
- [ ] Deployment successful
- [ ] All verifications passed
- [ ] Rollback plan ready
- [ ] Team notified

---

## Quick Reference Commands

```bash
# Build & Deploy
docker compose build
docker compose up -d

# Verify
docker compose ps
curl -I http://localhost/app/
curl -I http://localhost/app/assets/index-XXXXX.js
curl -I http://localhost/app-config/promotions.json

# Logs
docker compose logs -f
docker compose logs backend | grep ERROR

# Restart
docker compose restart proxy
docker compose restart backend

# Rollback
git checkout <tag>
docker compose down
docker compose build
docker compose up -d
```

---

## Support

For deployment issues:

1. Check [Runbook](./runbook.md) for troubleshooting
2. Review [QA Checklist](./qa_checklist.md)
3. Check logs: `docker compose logs`
4. Verify configuration files (nginx.conf, docker-compose.yml)
