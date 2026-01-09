"""Service for handling redirects."""
from datetime import datetime
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from ..models import URL, Click

async def get_redirect(session: AsyncSession, short_code: str, referrer: str | None, user_agent: str | None) -> str:
    # Look up the URL by short_code
    result = await session.execute(
        select(URL).where(URL.short_code == short_code)
    )
    url = result.scalar_one_or_none()
    if url is None or not url.is_active:
        raise HTTPException(status_code=404, detail="Short URL not found")
    if url.expires_at and url.expires_at < datetime.utcnow():
        raise HTTPException(status_code=410, detail="Short URL has expired")

    # Record click synchronously in the database. For MVP we avoid message queues.
    click = Click(
        url_id=url.id,
        referrer=referrer,
        user_agent=user_agent,
    )
    session.add(click)
    await session.commit()
    
    return url.long_url
