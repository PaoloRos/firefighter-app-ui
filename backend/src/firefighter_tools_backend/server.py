"""Local Uvicorn server configuration."""

import uvicorn

HOST = "127.0.0.1"
PORT = 8000


def run() -> None:
    """Serve the API locally without exposing it to the network."""
    uvicorn.run(
        "firefighter_tools_backend.main:app",
        host=HOST,
        port=PORT,
    )

