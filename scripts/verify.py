"""Verify release-critical local application invariants."""

import json
import os
import re
from importlib.metadata import distribution, version
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent.parent
IGNORED_DIRECTORIES = {
    ".git",
    ".venv",
    "data",
    "dist",
    "node_modules",
    "playwright-report",
    "test-results",
}


STORED_SCHEDULE_PATTERN = re.compile(r"^[0-9a-f]{32}\.(csv|xlsx)$")


def schedule_store_failures() -> list[str]:
    """Check the server-held schedule store the .ics sweep skips."""
    from firefighter_tools_backend.config import (
        SCHEDULE_STORE_ENV_VAR,
        settings,
    )

    failures: list[str] = []
    store = settings.schedule_store_dir

    if not os.environ.get(SCHEDULE_STORE_ENV_VAR):
        if not store.is_relative_to(ROOT / "data"):
            failures.append(
                f"Default schedule store must live under data/, found {store}"
            )

    if store.is_dir():
        for child in sorted(store.iterdir()):
            if not child.is_file():
                continue
            if child.suffix.lower() == ".ics":
                failures.append(
                    f"Generated calendar retained in the schedule store: {child.name}"
                )
            elif not STORED_SCHEDULE_PATTERN.match(child.name):
                failures.append(
                    f"Unexpected file in the schedule store: {child.name}"
                )
    return failures


def generated_calendars(directory: Path) -> list[Path]:
    """Find retained ICS files outside generated dependency/test folders."""
    calendars: list[Path] = []
    for child in directory.iterdir():
        if child.name in IGNORED_DIRECTORIES:
            continue
        if child.is_dir():
            calendars.extend(generated_calendars(child))
        elif child.suffix.lower() == ".ics":
            calendars.append(child)
    return calendars


def main() -> int:
    """Report every verified invariant or fail with actionable details."""
    failures: list[str] = []

    converter_version = version("calendar-conversion")
    if converter_version != "0.3.0":
        failures.append(
            "Expected calendar-conversion 0.3.0, found " + converter_version
        )

    direct_url_text = distribution("calendar-conversion").read_text(
        "direct_url.json"
    )
    direct_url = json.loads(direct_url_text) if direct_url_text else {}
    vcs_info = direct_url.get("vcs_info", {})
    if vcs_info.get("requested_revision") != "v0.3.0":
        failures.append(
            "calendar-conversion is not installed from requested revision v0.3.0"
        )

    from firefighter_tools_backend.server import HOST

    if HOST != "127.0.0.1":
        failures.append(f"Expected loopback host 127.0.0.1, found {HOST}")

    frontend_index = ROOT / "frontend" / "dist" / "index.html"
    if not frontend_index.is_file():
        failures.append("Production frontend build is missing frontend/dist/index.html")

    retained_calendars = generated_calendars(ROOT)
    if retained_calendars:
        failures.append(
            "Generated calendar files were retained: "
            + ", ".join(str(path.relative_to(ROOT)) for path in retained_calendars)
        )

    failures.extend(schedule_store_failures())

    retained_runtime_directories = [
        directory
        for directory in (ROOT / "uploads", ROOT / "generated", ROOT / "schedules")
        if directory.exists()
    ]
    if retained_runtime_directories:
        failures.append(
            "Runtime upload/generated directories were retained: "
            + ", ".join(
                str(path.relative_to(ROOT))
                for path in retained_runtime_directories
            )
        )

    if failures:
        for failure in failures:
            print(f"ERROR: {failure}", file=sys.stderr)
        return 1

    print(f"calendar-conversion: {converter_version}")
    print("calendar-conversion revision: v0.3.0")
    print(f"production frontend: {frontend_index.relative_to(ROOT)}")
    print(f"server host: {HOST}")
    print("retained calendar files: none")
    from firefighter_tools_backend.config import settings as _settings

    store = _settings.schedule_store_dir
    stored = len(list(store.iterdir())) if store.is_dir() else 0
    location = store.relative_to(ROOT) if store.is_relative_to(ROOT) else store
    print(f"schedule store: {location} ({stored} files)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
