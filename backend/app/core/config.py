import os

# Database settings
DB_USER = os.getenv("DB_USER", "shortener_user")
DB_PASSWORD = os.getenv("DB_PASSWORD", "change_me")
DB_HOST = os.getenv("DB_HOST", "db")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "shortener")

DATABASE_URL = (
    f"postgresql+asyncpg://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

# Security
SECRET_KEY = os.getenv("SECRET_KEY", "super_secret_key_for_dev_only")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
ALGORITHM = "HS256"
