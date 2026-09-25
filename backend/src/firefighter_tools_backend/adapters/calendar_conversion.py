"""Adapter from calendar-conversion types to backend-domain data."""

from typing import BinaryIO

from calendar_conversion import (
    ConversionError as LibraryConversionError,
    ConversionErrorCode as LibraryConversionErrorCode,
    IssueCode as LibraryIssueCode,
    convert_schedule as library_convert_schedule,
)

from firefighter_tools_backend.domain.calendar_conversion import (
    ConversionError,
    ConversionErrorCode,
    ConversionResult,
    InvalidEvent,
    IssueCode,
    SourcePosition,
)

_ERROR_CODE_MAP = {
    LibraryConversionErrorCode.UNSUPPORTED_FILE_TYPE: (
        ConversionErrorCode.UNSUPPORTED_FILE_TYPE
    ),
    LibraryConversionErrorCode.MALFORMED_CSV: ConversionErrorCode.MALFORMED_CSV,
    LibraryConversionErrorCode.MALFORMED_XLSX: (
        ConversionErrorCode.MALFORMED_XLSX
    ),
    LibraryConversionErrorCode.INPUT_READ_ERROR: (
        ConversionErrorCode.INPUT_READ_ERROR
    ),
}

_ISSUE_CODE_MAP = {
    LibraryIssueCode.EMPTY_ID: IssueCode.EMPTY_ID,
    LibraryIssueCode.EMPTY_SUMMARY: IssueCode.EMPTY_SUMMARY,
    LibraryIssueCode.END_DATE_BEFORE_START_DATE: (
        IssueCode.END_DATE_BEFORE_START_DATE
    ),
    LibraryIssueCode.END_TIME_BEFORE_START_TIME: (
        IssueCode.END_TIME_BEFORE_START_TIME
    ),
    LibraryIssueCode.DUPLICATE_ID: IssueCode.DUPLICATE_ID,
}


def convert_schedule(
    source: BinaryIO,
    *,
    filename: str,
    calendar_name: str,
    participant: str | None = None,
) -> ConversionResult:
    """Convert an in-memory stream and return only backend-owned types.

    ``participant`` keeps only that person's events plus the events for
    everyone; ``None`` converts the full schedule.
    """
    try:
        result = library_convert_schedule(
            source,
            filename=filename,
            calendar_name=calendar_name,
            participant=participant,
        )
    except LibraryConversionError as error:
        raise ConversionError(
            _ERROR_CODE_MAP[error.code],
            row=error.row,
            worksheet=error.worksheet,
        ) from error

    return ConversionResult(
        ics_text=result.ics_text,
        total_count=result.total_count,
        converted_count=result.converted_count,
        skipped_count=result.skipped_count,
        invalid_events=tuple(
            InvalidEvent(
                source_position=SourcePosition(
                    event_index=event.source_position.event_index,
                    row=event.source_position.row,
                    worksheet=event.source_position.worksheet,
                ),
                id=event.id,
                summary=event.summary,
                issue_codes=tuple(
                    _ISSUE_CODE_MAP[code] for code in event.issue_codes
                ),
            )
            for event in result.invalid_events
        ),
    )
