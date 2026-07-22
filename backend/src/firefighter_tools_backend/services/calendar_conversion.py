"""Backend service boundary for schedule conversion."""

from typing import BinaryIO

from firefighter_tools_backend.adapters.calendar_conversion import (
    convert_schedule,
)
from firefighter_tools_backend.domain.calendar_conversion import (
    ConversionResult,
)

CALENDAR_NAME = "Feuerwehr Tools"


def convert_calendar(
    source: BinaryIO,
    *,
    filename: str,
) -> ConversionResult:
    """Convert a validated upload through the calendar-conversion adapter."""
    return convert_schedule(
        source,
        filename=filename,
        calendar_name=CALENDAR_NAME,
    )
