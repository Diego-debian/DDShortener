"""
        _~_
       (o o)   diegodebian
      /  V  \────────────────────────────────────
     /(  _  )\  URL Shortener API (MVP)
       ^^ ^^     FastAPI • PostgreSQL • Docker • Nginx

File   : url_service.py
Author : Diego Parra
Web    : https://diegodebian.online
─────────────────────────────────────────────────
"""
from sqlalchemy.ext.asyncio import AsyncSession
from ..models import URL, User
from ..schemas import URLCreate
from ..utils import encode_base62

from fastapi import HTTPException
from sqlalchemy import select, func

async def create_url(session: AsyncSession, url_in: URLCreate, user: User) -> URL:
    # Free users can only have 3 active URLs
    if user.plan == "free":
        result = await session.execute(
            select(func.count(URL.id)).where(URL.user_email == user.email, URL.is_active == True)
        )
        count = result.scalar() or 0
        if count >= 3:
            raise HTTPException(status_code=403, detail="Free plan limit reached (max 3 active URLs)")

    # Create the URL record first to get an auto-generated ID
    new_url = URL(
        long_url=str(url_in.long_url),
        expires_at=url_in.expires_at,
        user_email=user.email,
        click_count=0,
        click_limit=1000,
    )
    session.add(new_url)
    await session.commit()
    await session.refresh(new_url)

    # Turn the numeric ID into a short base62 code
    short_code = encode_base62(new_url.id)
    new_url.short_code = short_code
    await session.commit()
    await session.refresh(new_url)
    
    return new_url
