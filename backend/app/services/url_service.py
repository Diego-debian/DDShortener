"""Service for managing URLs."""
from sqlalchemy.ext.asyncio import AsyncSession
from ..models import URL, User
from ..schemas import URLCreate
from ..utils import encode_base62

async def create_url(session: AsyncSession, url_in: URLCreate, user: User) -> URL:
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
