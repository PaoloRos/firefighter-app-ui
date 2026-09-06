"""FastAPI application construction."""

from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse
from starlette.middleware.sessions import SessionMiddleware

from firefighter_tools_backend.config import settings
from firefighter_tools_backend.db import init_db
from firefighter_tools_backend.domain.user import AuthError, AuthErrorCode
from firefighter_tools_backend.models.auth import AuthErrorResponse
from firefighter_tools_backend.routes.auth import router as auth_router
from firefighter_tools_backend.routes.calendar_converter import (
    router as calendar_converter_router,
)
from firefighter_tools_backend.routes.health import router as health_router

API_PREFIX = "/api/v1"

_AUTH_ERROR_RESPONSES: dict[AuthErrorCode, tuple[int, str]] = {
    AuthErrorCode.INVALID_CREDENTIALS: (401, "Invalid username or password."),
    AuthErrorCode.NOT_AUTHENTICATED: (401, "Authentication is required."),
    AuthErrorCode.FORBIDDEN: (403, "This action requires a super-user."),
}


class FrontendBuildNotFoundError(RuntimeError):
    """Raised when production serving is requested without a Vite build."""


def create_app(*, frontend_dist: Path | None = None) -> FastAPI:
    """Create and configure an independent FastAPI application instance."""
    init_db()

    application = FastAPI(title="Feuerwehr Tools API", version="0.1.0")
    application.add_middleware(
        SessionMiddleware,
        secret_key=settings.secret_key,
        session_cookie=settings.session_cookie_name,
        max_age=settings.session_max_age,
        same_site="lax",
        https_only=False,
    )
    application.add_exception_handler(AuthError, _handle_auth_error)
    application.include_router(health_router, prefix=API_PREFIX)
    application.include_router(auth_router, prefix=API_PREFIX)
    application.include_router(calendar_converter_router, prefix=API_PREFIX)
    if frontend_dist is not None:
        _configure_frontend_serving(application, frontend_dist)
    return application


async def _handle_auth_error(_: Request, error: Exception) -> JSONResponse:
    """Render a typed, traceback-free body for an auth failure."""
    assert isinstance(error, AuthError)
    status_code, message = _AUTH_ERROR_RESPONSES[error.code]
    payload = AuthErrorResponse(code=error.code.value, message=message)
    return JSONResponse(
        status_code=status_code,
        content=payload.model_dump(mode="json"),
    )


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
