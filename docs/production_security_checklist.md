# Production Security Checklist

This document outlines the security requirements and verification steps for deploying DD Shortener to production.

## 🔴 CRITICAL: Environment Variables

The following environment variables MUST be set correctly before production deployment:

### Required Variables

| Variable | Requirement | Example |
| :--- | :--- | :--- |
| `ENVIRONMENT` | Set to `production` or `prod` | `ENVIRONMENT=production` |
| `SECRET_KEY` | Minimum 32 characters, cryptographically random | `SECRET_KEY=<generated>` |
| `DB_PASSWORD` | Strong password, not `change_me` | `DB_PASSWORD=<random>` |

### Generate a Secure SECRET_KEY

```bash
# Python (recommended)
python -c "import secrets; print(secrets.token_urlsafe(64))"

# OpenSSL alternative
openssl rand -base64 64
```

### .env File Template for Production

```env
ENVIRONMENT=production
SECRET_KEY=<paste-generated-key-here>
DB_USER=shortener_user
DB_PASSWORD=<strong-random-password>
DB_HOST=db
DB_PORT=5432
DB_NAME=shortener
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

## 🔒 SECRET_KEY Guardrail

**The application will NOT start in production if:**
- `SECRET_KEY` is empty
- `SECRET_KEY` is less than 32 characters
- `SECRET_KEY` matches known insecure defaults:
  - `change_me`
  - `super_secret_key_for_dev_only`
  - `secret`
  - `secretkey`
  - `your-secret-key`
  - `your-secret-key-here`

**Error message when guardrail triggers:**
```
============================================================
FATAL: Insecure SECRET_KEY detected in PRODUCTION!
============================================================
```

## 🌐 HTTPS Configuration (Cloudflare)

DD Shortener must run behind HTTPS. Recommended setup with Cloudflare:

1. **Add domain to Cloudflare**
2. **Enable "Always Use HTTPS"** in SSL/TLS settings
3. **Set SSL mode to "Full (strict)"** if using origin certificates
4. **Enable HSTS** (HTTP Strict Transport Security)

### Cloudflare Security Settings

| Setting | Value |
| :--- | :--- |
| SSL/TLS encryption mode | Full (strict) |
| Always Use HTTPS | ✅ On |
| Minimum TLS Version | TLS 1.2 |
| Automatic HTTPS Rewrites | ✅ On |
| HSTS | ✅ Enabled (6 months recommended) |

## 🛡️ Security Headers Verification

All security headers are configured in `nginx/nginx.conf`.

### Verify Headers via curl

```bash
# Check security headers
curl -I https://your-domain.com/app/

# Expected headers:
# X-Content-Type-Options: nosniff
# Referrer-Policy: strict-origin-when-cross-origin
# Permissions-Policy: camera=(), microphone=(), geolocation=()
# Content-Security-Policy: default-src 'self'; ...
```

### Verify CSP Headers

```bash
curl -I https://your-domain.com/app/ | grep -i content-security
```

Expected CSP policy:
```
default-src 'self'; 
script-src 'self'; 
style-src 'self' 'unsafe-inline'; 
img-src 'self' data:; 
font-src 'self'; 
connect-src 'self'; 
frame-src https://www.youtube-nocookie.com;
```

## 🚦 Rate Limiting

Rate limits are enforced by Nginx:

| Endpoint | Limit | Burst |
| :--- | :--- | :--- |
| `POST /api/urls` (URL creation) | 1 req/s | 3 |
| `/api/*` (auth, stats, etc.) | 5 req/s | 10 |
| `/{short_code}` (redirects) | 10 req/s | 20 |

### Test Rate Limiting

```bash
# Send rapid requests (should see 503 after burst)
for i in {1..20}; do curl -s -o /dev/null -w "%{http_code}\n" https://your-domain.com/api/health; done
```

## 🔐 Schema Hardening

All input schemas use `extra='forbid'` to reject unexpected fields:

- `UserCreate` - Rejects `plan`, `is_active`, `id` injection
- `UserLogin` - Rejects all fields except `email`, `password`
- `URLCreate` - Rejects `user_email`, `click_count`, `click_limit` injection

**Attempting to inject forbidden fields will result in HTTP 422.**

## ✅ Pre-Deploy Checklist

Before deploying to production, verify:

### Environment
- [ ] `ENVIRONMENT=production` is set
- [ ] `SECRET_KEY` is a unique, randomly generated key (≥32 chars)
- [ ] `SECRET_KEY` is NOT committed to version control
- [ ] `DB_PASSWORD` is strong and unique

### HTTPS/SSL
- [ ] Domain is configured in Cloudflare (or similar)
- [ ] "Always Use HTTPS" is enabled
- [ ] SSL mode is "Full (strict)"
- [ ] HSTS is enabled

### Headers
- [ ] `curl -I` shows all security headers
- [ ] CSP policy allows only expected sources
- [ ] No `Access-Control-Allow-Origin: *` on sensitive endpoints

### Rate Limiting
- [ ] Rate limits are tested and working
- [ ] 503 responses occur when limits exceeded

### Database
- [ ] PostgreSQL uses strong password
- [ ] Database port (5432) is NOT exposed to public
- [ ] Only backend container can reach database

### Logs & Monitoring
- [ ] Container logs accessible (`docker compose logs -f`)
- [ ] Health endpoint `/api/health` returns 200
- [ ] Error monitoring configured (optional)

## 🧪 Smoke Tests After Deploy

```bash
# 1. Health check
curl https://your-domain.com/api/health
# Expected: {"status":"ok"}

# 2. Frontend loads
curl -s -o /dev/null -w "%{http_code}" https://your-domain.com/app/
# Expected: 200

# 3. Security headers present
curl -I https://your-domain.com/app/ 2>&1 | grep -E "(X-Content-Type|Content-Security)"
# Expected: Headers visible

# 4. Registration works
curl -X POST https://your-domain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123!"}'
# Expected: 201 or 400 (if email exists)

# 5. Rate limit triggers on excessive requests
for i in {1..30}; do 
  curl -s -o /dev/null -w "%{http_code} " https://your-domain.com/api/health
done
# Expected: 200s then 503s
```

## 📁 Files to Review Before Deploy

| File | Check |
| :--- | :--- |
| `.env` | All production values set, not committed |
| `docker-compose.yml` | No debug ports exposed |
| `nginx/nginx.conf` | Rate limits and CSP correct |
| `backend/app/core/config.py` | Guardrail logic present |

---

**Last Updated:** January 2026  
**Maintainer:** Diego Parra (@diegodebian)
