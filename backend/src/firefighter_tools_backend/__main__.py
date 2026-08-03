"""Run the backend on the loopback interface."""

import argparse
from pathlib import Path

from firefighter_tools_backend.server import run


def main() -> None:
    """Parse the optional production frontend path and start the server."""
    parser = argparse.ArgumentParser(description="Run Feuerwehr Tools locally.")
    parser.add_argument(
        "--frontend-dist",
        type=Path,
        help="Serve a built Vite frontend from this directory.",
    )
    arguments = parser.parse_args()
    run(frontend_dist=arguments.frontend_dist)


if __name__ == "__main__":
    main()
