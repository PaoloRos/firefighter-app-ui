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
    participant: str | None = None,
) -> ConversionResult:
    """Convert a validated upload through the calendar-conversion adapter.

    With ``participant`` set, only that person's events and the events meant
    for everyone are converted.
    """
    return convert_schedule(
        source,
        filename=filename,
        calendar_name=CALENDAR_NAME,
        participant=participant,
    )
