"""Service for retrieving statistics."""
from fastapi import HTTPException
from sqlalchemy import select, func, cast, Date as SQLDate
from sqlalchemy.ext.asyncio import AsyncSession
from ..models import URL, Click
from ..schemas import URLStats, URLInfo, ClickAggregate

async def get_stats(session: AsyncSession, short_code: str) -> URLStats:
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
