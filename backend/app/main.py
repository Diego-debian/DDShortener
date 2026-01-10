"""Main FastAPI application entry point."""

# Most imports live in their respective routers
from fastapi import FastAPI
from .database import engine
from .models import Base

from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse


app = FastAPI(title="URL Shortener MVP", version="0.1.0", redoc_url=None)

from .routers import health, urls, redirect, auth

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(urls.router)

# Serve static files (needs to be before the redirect router)
from pathlib import Path
static_dir = Path(__file__).parent / "static"
app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

# Offline ReDoc documentation (must come before redirect router)
@app.get("/redoc", response_class=HTMLResponse, include_in_schema=False)
async def redoc_html():
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>URL Shortener API</title>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body>
        <redoc spec-url="/openapi.json"></redoc>
        <script src="/static/redoc.standalone.js"></script>
    </body>
    </html>
    """

# Redirect router comes last since it matches any /{short_code}
app.include_router(redirect.router)




@app.on_event("startup")
async def startup_event():
    # Auto-create tables on startup. Use Alembic for production.
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

