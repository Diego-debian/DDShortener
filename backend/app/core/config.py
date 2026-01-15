"""
        _~_
       (o o)   diegodebian
      /  V  \────────────────────────────────────
     /(  _  )\  URL Shortener API (MVP)
       ^^ ^^     FastAPI • PostgreSQL • Docker • Nginx

File   : config.py
Author : Diego Parra
Web    : https://diegodebian.online
─────────────────────────────────────────────────
"""
import os
import sys

# Environment detection (production, staging, development, test)
ENVIRONMENT = os.getenv("ENVIRONMENT", "development").lower()
IS_PRODUCTION = ENVIRONMENT in ("production", "prod")

# Database connection settings
DB_USER = os.getenv("DB_USER", "shortener_user")
DB_PASSWORD = os.getenv("DB_PASSWORD", "change_me")
DB_HOST = os.getenv("DB_HOST", "db")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "shortener")

DATABASE_URL = (
    f"postgresql+asyncpg://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

# JWT and auth settings
SECRET_KEY = os.getenv("SECRET_KEY", "super_secret_key_for_dev_only")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
ALGORITHM = "HS256"

# Known insecure SECRET_KEY values - must not be used in production
INSECURE_SECRET_KEYS = {
    "",
    "change_me",
    "super_secret_key_for_dev_only",
    "secret",
    "secretkey",
    "your-secret-key",
    "your-secret-key-here",
}

# Security guardrail: abort in production if SECRET_KEY is insecure
if IS_PRODUCTION:
    if not SECRET_KEY or SECRET_KEY.lower() in INSECURE_SECRET_KEYS or len(SECRET_KEY) < 32:
        print("=" * 60, file=sys.stderr)
        print("FATAL: Insecure SECRET_KEY detected in PRODUCTION!", file=sys.stderr)
        print("=" * 60, file=sys.stderr)
        print(f"  ENVIRONMENT = {ENVIRONMENT}", file=sys.stderr)
        print(f"  SECRET_KEY length = {len(SECRET_KEY) if SECRET_KEY else 0}", file=sys.stderr)
        print("", file=sys.stderr)
        print("To fix:", file=sys.stderr)
        print("  1. Generate a secure key: python -c \"import secrets; print(secrets.token_urlsafe(64))\"", file=sys.stderr)
        print("  2. Set it in .env: SECRET_KEY=<your-generated-key>", file=sys.stderr)
        print("  3. Restart the application", file=sys.stderr)
        print("=" * 60, file=sys.stderr)
        sys.exit(1)
