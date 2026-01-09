"""FastAPI entry point for the URL shortener MVP."""

# Imports are now mostly in routers
from fastapi import FastAPI
from .database import engine
from .models import Base

app = FastAPI(title="URL Shortener MVP", version="0.1.0")

from .routers import health, urls, redirect, auth

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(urls.router)
app.include_router(redirect.router)


@app.on_event("startup")
async def startup_event():
    # Create tables if they do not exist. In production use Alembic migrations.
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

