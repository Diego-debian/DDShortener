"""
        _~_
       (o o)   diegodebian
      /  V  \────────────────────────────────────
     /(  _  )\  URL Shortener API (MVP)
       ^^ ^^     FastAPI • PostgreSQL • Docker • Nginx

File   : admin.py
Author : Diego Parra
Web    : https://diegodebian.online
─────────────────────────────────────────────────

Admin router with protected endpoints.
All endpoints require JWT authentication and plan == 'admin'.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_session
from ..models import User, URL
from ..schemas import (
    User as UserSchema, 
    URLInfo, 
    PlanUpdate, 
    URLStatusUpdate, 
    TopURLInfo
)
from .auth import get_current_user

router = APIRouter(prefix="/api/admin", tags=["Admin"])


# ============================================================
# Admin Authorization Dependency
# ============================================================

async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """
    Dependency that requires the current user to have admin privileges.
    Returns the user if admin, otherwise raises 403 Forbidden.
    """
    if current_user.plan != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return current_user


# ============================================================
# Admin Endpoints
# ============================================================

@router.patch(
    "/users/{email}/plan",
    response_model=UserSchema,
    summary="Update user plan",
    description="Update a user's plan to free, premium, or admin. Requires admin privileges."
)
async def update_user_plan(
    email: str,
    plan_update: PlanUpdate,
    session: AsyncSession = Depends(get_session),
    admin: User = Depends(require_admin)
):
    """
    Update a user's plan.
    
    - **email**: The user's email address
    - **plan**: The new plan (free, premium, or admin)
    """
    # Find target user
    result = await session.execute(select(User).where(User.email == email))
    target_user = result.scalar_one_or_none()
    
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with email '{email}' not found"
        )
    
    # Update plan
    target_user.plan = plan_update.plan
    await session.commit()
    await session.refresh(target_user)
    
    return target_user


@router.patch(
    "/urls/{short_code}",
    response_model=URLInfo,
    summary="Update URL status",
    description="Enable or disable a short URL. Requires admin privileges."
)
async def update_url_status(
    short_code: str,
    status_update: URLStatusUpdate,
    session: AsyncSession = Depends(get_session),
    admin: User = Depends(require_admin)
):
    """
    Update a URL's active status.
    
    - **short_code**: The short code of the URL
    - **is_active**: Whether the URL should be active (true) or disabled (false)
    """
    # Find target URL
    result = await session.execute(select(URL).where(URL.short_code == short_code))
    target_url = result.scalar_one_or_none()
    
    if not target_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"URL with code '{short_code}' not found"
        )
    
    # Update status
    target_url.is_active = status_update.is_active
    await session.commit()
    await session.refresh(target_url)
    
    return target_url


@router.get(
    "/stats/top-urls",
    response_model=List[TopURLInfo],
    summary="Get top URLs by click count",
    description="Returns the most clicked URLs. Requires admin privileges."
)
async def get_top_urls(
    limit: int = Query(default=20, ge=1, le=100, description="Number of URLs to return"),
    session: AsyncSession = Depends(get_session),
    admin: User = Depends(require_admin)
):
    """
    Get the top URLs sorted by click count (descending).
    
    - **limit**: Maximum number of URLs to return (1-100, default 20)
    """
    result = await session.execute(
        select(URL)
        .order_by(desc(URL.click_count))
        .limit(limit)
    )
    urls = result.scalars().all()
    
    return [
        TopURLInfo(
            short_code=url.short_code,
            long_url=str(url.long_url),
            click_count=url.click_count or 0,
            user_email=url.user_email,
            is_active=url.is_active
        )
        for url in urls
    ]
