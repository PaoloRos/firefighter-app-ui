"""FastAPI application construction."""

from fastapi import FastAPI

from firefighter_tools_backend.routes.calendar_converter import (
    router as calendar_converter_router,
)
from firefighter_tools_backend.routes.health import router as health_router

API_PREFIX = "/api/v1"


def create_app() -> FastAPI:
    """Create and configure an independent FastAPI application instance."""
    application = FastAPI(title="Feuerwehr Tools API", version="0.1.0")
    application.include_router(health_router, prefix=API_PREFIX)
    application.include_router(calendar_converter_router, prefix=API_PREFIX)
    return application


app = create_app()
