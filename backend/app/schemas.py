"""
        _~_
       (o o)   diegodebian
      /  V  \────────────────────────────────────
     /(  _  )\  URL Shortener API (MVP)
       ^^ ^^     FastAPI • PostgreSQL • Docker • Nginx

File   : schemas.py
Author : Diego Parra
Web    : https://diegodebian.online
─────────────────────────────────────────────────
"""

from datetime import datetime, date
from typing import Optional, List, Dict
from pydantic import BaseModel, HttpUrl, Field, ConfigDict
from fastapi.security import OAuth2PasswordRequestForm


class URLCreate(BaseModel):
    """Input schema for creating a short URL. Strict validation, no extra fields allowed."""
    long_url: HttpUrl = Field(..., description="The original URL to shorten")
    expires_at: Optional[datetime] = Field(
        None, description="Optional expiration date/time for the short URL"
    )
    
    # Forbid extra fields to prevent injection of unwanted data
    model_config = ConfigDict(extra='forbid')


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


class UserBase(BaseModel):
    email: str


class UserCreate(UserBase):
    """Input schema for user registration. Strict validation, no extra fields allowed."""
    password: str
    
    # Forbid extra fields to prevent injection of 'plan', 'is_active', etc.
    model_config = ConfigDict(extra='forbid')


class UserLogin(BaseModel):
    """Input schema for user login. Strict validation, no extra fields allowed."""
    email: str
    password: str
    
    # Forbid extra fields for security
    model_config = ConfigDict(extra='forbid')


class User(UserBase):
    id: int
    is_active: bool
    plan: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str