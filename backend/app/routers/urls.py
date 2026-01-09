"""URLs management router."""
from fastapi import APIRouter

router = APIRouter()

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_session
from ..models import URL
from ..schemas import URLCreate, URLInfo
from ..utils import encode_base62


@router.post("/api/urls", response_model=URLInfo, status_code=201, tags=["URLs"])
async def create_url(
    url_in: URLCreate, session: AsyncSession = Depends(get_session)
) -> URLInfo:
    """Create a new shortened URL."""
    # Create URL entry without short_code
    new_url = URL(
        long_url=str(url_in.long_url),
        expires_at=url_in.expires_at,
    )
    session.add(new_url)
    await session.commit()
    await session.refresh(new_url)

    # Generate short code from the auto-generated ID
    short_code = encode_base62(new_url.id)
    new_url.short_code = short_code
    await session.commit()
    await session.refresh(new_url)

    return URLInfo.model_validate(new_url)
