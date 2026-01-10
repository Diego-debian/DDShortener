"""
        _~_
       (o o)   diegodebian
      /  V  \────────────────────────────────────
     /(  _  )\  URL Shortener API (MVP)
       ^^ ^^     FastAPI • PostgreSQL • Docker • Nginx

File   : health.py
Author : Diego Parra
Web    : https://diegodebian.online
─────────────────────────────────────────────────
"""
from fastapi import APIRouter

router = APIRouter()


@router.get("/api/health", tags=["Health"])
async def health() -> dict:
    """Quick health check to verify the API is running."""
    return {"status": "ok"}
