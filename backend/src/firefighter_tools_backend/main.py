"""FastAPI application construction."""

from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse

from firefighter_tools_backend.routes.calendar_converter import (
    router as calendar_converter_router,
)
from firefighter_tools_backend.routes.health import router as health_router

API_PREFIX = "/api/v1"


class FrontendBuildNotFoundError(RuntimeError):
    """Raised when production serving is requested without a Vite build."""


def create_app(*, frontend_dist: Path | None = None) -> FastAPI:
    """Create and configure an independent FastAPI application instance."""
    application = FastAPI(title="Feuerwehr Tools API", version="0.1.0")
    application.include_router(health_router, prefix=API_PREFIX)
    application.include_router(calendar_converter_router, prefix=API_PREFIX)
    if frontend_dist is not None:
        _configure_frontend_serving(application, frontend_dist)
    return application


def _configure_frontend_serving(
    application: FastAPI,
    frontend_dist: Path,
) -> None:
    """Serve a built Vite application without shadowing API routes."""
    resolved_dist = frontend_dist.resolve()
    index_path = resolved_dist / "index.html"
    if not resolved_dist.is_dir() or not index_path.is_file():
        raise FrontendBuildNotFoundError(
            "Production frontend build not found at "
            f"{resolved_dist}. Run `pnpm --dir frontend build` first."
        )

    @application.get("/{frontend_path:path}", include_in_schema=False)
    def serve_frontend(frontend_path: str) -> FileResponse:
        if frontend_path == "api" or frontend_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="Not Found")

        requested_path = (resolved_dist / frontend_path).resolve()
        if (
            requested_path.is_relative_to(resolved_dist)
            and requested_path.is_file()
        ):
            return FileResponse(requested_path)
        return FileResponse(index_path, media_type="text/html")


app = create_app()
