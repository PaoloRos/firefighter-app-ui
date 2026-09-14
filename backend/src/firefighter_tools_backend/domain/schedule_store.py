"""Typed errors and results for the server-held active schedule."""

from dataclasses import dataclass
from datetime import datetime
from enum import StrEnum
from pathlib import Path


class ScheduleStoreErrorCode(StrEnum):
    """Stable codes describing why a schedule-store operation failed."""

    NO_ACTIVE_SCHEDULE = "no_active_schedule"
    STORE_WRITE_ERROR = "store_write_error"


class ScheduleStoreError(Exception):
    """Raised when the active schedule cannot be read or replaced."""

    def __init__(self, code: ScheduleStoreErrorCode) -> None:
        self.code = code
        super().__init__(code.value)


@dataclass(frozen=True, slots=True)
class StoredSchedule:
    """One schedule held on the server, described without its stored name."""

    original_filename: str
    path: Path
    size_bytes: int
    uploaded_at: datetime
    uploaded_by: str
