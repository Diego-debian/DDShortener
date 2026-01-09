from datetime import datetime
from fastapi import HTTPException
from sqlalchemy import update, select
from sqlalchemy.ext.asyncio import AsyncSession
from ..models import URL, Click

async def get_redirect(session: AsyncSession, short_code: str, referrer: str | None, user_agent: str | None) -> str:
    # Atomic update and fetch.
    # Increment click_count ONLY if it is less than click_limit
    stmt = (
        update(URL)
        .where(URL.short_code == short_code)
        .where(URL.is_active == True)
        .where((URL.expires_at == None) | (URL.expires_at > datetime.utcnow()))
        .where(URL.click_count < URL.click_limit)
        .values(click_count=URL.click_count + 1)
        .returning(URL.long_url, URL.id)
    )
    
    result = await session.execute(stmt)
    row = result.first()
    
    if not row:
        # Check why it failed: Not Found/Expired or Limit Reached?
        # We do a read-only query to give specific error
        q = await session.execute(select(URL).where(URL.short_code == short_code))
        url = q.scalar_one_or_none()
        
        if not url or not url.is_active:
            raise HTTPException(status_code=404, detail="Short URL not found")
        if url.expires_at and url.expires_at <= datetime.utcnow():
            raise HTTPException(status_code=410, detail="Short URL has expired")
        if url.click_count >= url.click_limit:
            raise HTTPException(status_code=410, detail="Click limit reached")
        
        # Fallback
        raise HTTPException(status_code=404, detail="Short URL not found")

    long_url, url_id = row
    await session.commit() # Commit the increment

    # Record click details (best effort/non-blocking for MVP flow essentially)
    # Note: If commit above failed, we wouldn't be here.
    click = Click(
        url_id=url_id,
        referrer=referrer,
        user_agent=user_agent,
    )
    session.add(click)
    # We could commit again or let it be atomic with the update if we moved commit down.
    # Moving commit down ensures click logic + count logic are same transaction.
    await session.commit()
    
    return long_url
