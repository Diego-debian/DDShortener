"""Health check router."""
from fastapi import APIRouter

router = APIRouter()


@router.get("/api/health", tags=["Health"])
async def health() -> dict:
    """Simple health check endpoint."""
    return {"status": "ok"}
