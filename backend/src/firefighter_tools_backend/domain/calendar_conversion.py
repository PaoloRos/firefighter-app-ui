"""Backend-domain data for calendar schedule conversion."""

from dataclasses import dataclass
from enum import StrEnum


class IssueCode(StrEnum):
    """Stable backend code for one semantic event problem."""

    EMPTY_ID = "empty_id"
    EMPTY_SUMMARY = "empty_summary"
    END_DATE_BEFORE_START_DATE = "end_date_before_start_date"
    END_TIME_BEFORE_START_TIME = "end_time_before_start_time"
    DUPLICATE_ID = "duplicate_id"


class ConversionErrorCode(StrEnum):
    """Stable backend code for a converter-level failure."""

    UNSUPPORTED_FILE_TYPE = "unsupported_file_type"
    MALFORMED_CSV = "malformed_csv"
    MALFORMED_XLSX = "malformed_xlsx"
    INPUT_READ_ERROR = "input_read_error"


@dataclass(frozen=True, slots=True)
class SourcePosition:
    """One-based location of an event in the source schedule."""

    event_index: int
    row: int
    worksheet: str | None = None


@dataclass(frozen=True, slots=True)
class InvalidEvent:
    """One event omitted because semantic validation failed."""

    source_position: SourcePosition
    id: str
    summary: str
    issue_codes: tuple[IssueCode, ...]


@dataclass(frozen=True, slots=True)
class ConversionResult:
    """Backend-owned outcome of a schedule conversion."""

    ics_text: str
    total_count: int
    converted_count: int
    skipped_count: int
    invalid_events: tuple[InvalidEvent, ...]


class ConversionError(Exception):
    """Backend-owned converter failure without a library error message."""

    def __init__(
        self,
        code: ConversionErrorCode,
        *,
        row: int | None = None,
        worksheet: str | None = None,
    ) -> None:
        self.code = code
        self.row = row
        self.worksheet = worksheet
        super().__init__(code.value)
