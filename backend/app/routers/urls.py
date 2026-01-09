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


from fastapi import HTTPException
from sqlalchemy import select, func, cast, Date as SQLDate
from ..models import URL, Click
from ..schemas import URLStats, ClickAggregate

@router.get("/api/urls/{short_code}/stats", response_model=URLStats, tags=["Analytics"])
async def url_stats(
    short_code: str, session: AsyncSession = Depends(get_session)
) -> URLStats:
    """Return aggregated click statistics for a given short URL."""
    # Fetch the URL
    result = await session.execute(
        select(URL).where(URL.short_code == short_code)
    )
    url = result.scalar_one_or_none()
    if url is None:
        raise HTTPException(status_code=404, detail="Short URL not found")

    # Total clicks
    total_result = await session.execute(
        select(func.count(Click.id)).where(Click.url_id == url.id)
    )
    total_clicks = total_result.scalar() or 0

    # Clicks grouped by date
    group_result = await session.execute(
        select(
            cast(Click.event_time, SQLDate).label("date"),
            func.count(Click.id).label("clicks"),
        )
        .where(Click.url_id == url.id)
        .group_by(cast(Click.event_time, SQLDate))
        .order_by(cast(Click.event_time, SQLDate))
    )
    by_date = [ClickAggregate(date=row.date, clicks=row.clicks) for row in group_result]

    return URLStats(url=URLInfo.model_validate(url), total_clicks=total_clicks, by_date=by_date)
