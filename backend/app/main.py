"""FastAPI entry point for the URL shortener MVP."""

from datetime import datetime, date
from typing import List

from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.responses import RedirectResponse, JSONResponse
from sqlalchemy import select, func, cast, Date as SQLDate
from sqlalchemy.ext.asyncio import AsyncSession

from .database import get_session, engine
from .models import Base, URL, Click
from .schemas import URLCreate, URLInfo, URLStats, ClickAggregate
from .utils import encode_base62

app = FastAPI(title="URL Shortener MVP", version="0.1.0")

from .routers import health, urls

app.include_router(health.router)
app.include_router(urls.router)


@app.on_event("startup")
async def startup_event():
    # Create tables if they do not exist. In production use Alembic migrations.
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


@app.get("/{short_code}", tags=["Redirect"])
async def redirect_short_url(
    short_code: str, request: Request, session: AsyncSession = Depends(get_session)
):
    """Redirect to the original URL and record a click."""
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
        referrer=request.headers.get("referer"),
        user_agent=request.headers.get("user-agent"),
    )
    session.add(click)
    await session.commit()

    return RedirectResponse(url.long_url, status_code=302)

