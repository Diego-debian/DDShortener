"""Pydantic schemas for the URL shortener MVP."""

from datetime import datetime, date
from typing import Optional, List, Dict
from pydantic import BaseModel, HttpUrl, Field, ConfigDict


class URLCreate(BaseModel):
    long_url: HttpUrl = Field(..., description="The original URL to shorten")
    expires_at: Optional[datetime] = Field(
        None, description="Optional expiration date/time for the short URL"
    )


class URLInfo(BaseModel):
    id: int
    short_code: str
    long_url: HttpUrl
    created_at: datetime
    expires_at: Optional[datetime]
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class ClickAggregate(BaseModel):
    date: date
    clicks: int


class URLStats(BaseModel):
    url: URLInfo
    total_clicks: int
    by_date: List[ClickAggregate]