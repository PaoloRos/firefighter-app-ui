"""Local Uvicorn server configuration."""

import warnings
from pathlib import Path

import uvicorn

from firefighter_tools_backend.config import SECRET_KEY_ENV_VAR, settings
from firefighter_tools_backend.main import create_app

HOST = "127.0.0.1"
PORT = 8000


def run(*, frontend_dist: Path | None = None, port: int = PORT) -> None:
    """Serve the API, optionally with the built UI, on loopback only."""
    if settings.uses_development_secret_key:
        warnings.warn(
            "Using the built-in development session secret. Set "
            f"{SECRET_KEY_ENV_VAR} to a private random value before relying "
            "on sessions.",
            RuntimeWarning,
            stacklevel=2,
        )

    application = (
        "firefighter_tools_backend.main:app"
        if frontend_dist is None
        else create_app(frontend_dist=frontend_dist)
    )
    uvicorn.run(
        application,
        host=HOST,
        port=port,
    )
