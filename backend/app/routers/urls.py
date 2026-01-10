"""
        _~_
       (o o)   diegodebian
      /  V  \────────────────────────────────────
     /(  _  )\  URL Shortener API (MVP)
       ^^ ^^     FastAPI • PostgreSQL • Docker • Nginx

File   : urls.py
Author : Diego Parra
Web    : https://diegodebian.online
─────────────────────────────────────────────────
"""
from fastapi import APIRouter

router = APIRouter()

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_session
from ..schemas import URLCreate, URLInfo, URLStats
from ..services import url_service, stats_service
from .auth import get_current_user
from ..models import User


@router.post("/api/urls", response_model=URLInfo, status_code=201, tags=["URLs"])
async def create_url(
    url_in: URLCreate, 
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
) -> URLInfo:
    """Generate a short URL for the authenticated user."""
    new_url = await url_service.create_url(session, url_in, current_user)
    return URLInfo.model_validate(new_url)


@router.get("/api/urls/{short_code}/stats", response_model=URLStats, tags=["Analytics"])
async def url_stats(
    short_code: str, session: AsyncSession = Depends(get_session)
) -> URLStats:
    """Get click stats grouped by date for a short URL."""
    return await stats_service.get_stats(session, short_code)
