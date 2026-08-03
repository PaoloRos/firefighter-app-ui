"""Local Uvicorn server configuration."""

from pathlib import Path

import uvicorn

from firefighter_tools_backend.main import create_app

HOST = "127.0.0.1"
PORT = 8000


def run(*, frontend_dist: Path | None = None) -> None:
    """Serve the API, optionally with the built UI, on loopback only."""
    application = (
        "firefighter_tools_backend.main:app"
        if frontend_dist is None
        else create_app(frontend_dist=frontend_dist)
    )
    uvicorn.run(
        application,
        host=HOST,
        port=PORT,
    )
