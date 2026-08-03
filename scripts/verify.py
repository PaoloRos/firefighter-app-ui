"""Verify release-critical local application invariants."""

import json
from importlib.metadata import distribution, version
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent.parent
IGNORED_DIRECTORIES = {
    ".git",
    ".venv",
    "dist",
    "node_modules",
    "playwright-report",
    "test-results",
}


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
    if converter_version != "0.2.0":
        failures.append(
            "Expected calendar-conversion 0.2.0, found " + converter_version
        )

    direct_url_text = distribution("calendar-conversion").read_text(
        "direct_url.json"
    )
    direct_url = json.loads(direct_url_text) if direct_url_text else {}
    vcs_info = direct_url.get("vcs_info", {})
    if vcs_info.get("requested_revision") != "v0.2.0":
        failures.append(
            "calendar-conversion is not installed from requested revision v0.2.0"
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

    retained_runtime_directories = [
        directory
        for directory in (ROOT / "uploads", ROOT / "generated")
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
    print("calendar-conversion revision: v0.2.0")
    print(f"production frontend: {frontend_index.relative_to(ROOT)}")
    print(f"server host: {HOST}")
    print("retained calendar files: none")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
