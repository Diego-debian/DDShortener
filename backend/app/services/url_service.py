"""Service for managing URLs."""
from sqlalchemy.ext.asyncio import AsyncSession
from ..models import URL, User
from ..schemas import URLCreate
from ..utils import encode_base62

from fastapi import HTTPException
from sqlalchemy import select, func

async def create_url(session: AsyncSession, url_in: URLCreate, user: User) -> URL:
    # Check limit for free plan
    if user.plan == "free":
        result = await session.execute(
            select(func.count(URL.id)).where(URL.user_id == user.id, URL.is_active == True)
        )
        count = result.scalar() or 0
        if count >= 3:
            raise HTTPException(status_code=403, detail="Free plan limit reached (max 3 active URLs)")

    # Create URL entry without short_code
    new_url = URL(
        long_url=str(url_in.long_url),
        expires_at=url_in.expires_at,
        user_id=user.id,
    )
    session.add(new_url)
    await session.commit()
    await session.refresh(new_url)

    # Generate short code from the auto-generated ID
    short_code = encode_base62(new_url.id)
    new_url.short_code = short_code
    await session.commit()
    await session.refresh(new_url)
    
    return new_url
