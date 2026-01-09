"""Redirect router."""
from fastapi import APIRouter

router = APIRouter()

from fastapi import Depends, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_session
from ..services import redirect_service


@router.get("/{short_code}", tags=["Redirect"])
async def redirect_short_url(
    short_code: str, request: Request, session: AsyncSession = Depends(get_session)
):
    """Redirect to the original URL and record a click."""
    long_url = await redirect_service.get_redirect(
        session, 
        short_code, 
        request.headers.get("referer"), 
        request.headers.get("user-agent")
    )

    return RedirectResponse(long_url, status_code=302)
