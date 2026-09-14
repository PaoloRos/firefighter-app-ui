"""Contract tests for calendar conversion response models."""

from datetime import datetime, timezone

import pytest
from pydantic import ValidationError

from firefighter_tools_backend.models import (
    ActiveSchedule,
    ActiveScheduleResponse,
    Calendar,
    ConversionResponse,
    FatalErrorCode,
    FatalErrorResponse,
    InvalidEvent,
    IssueCode,
    SourcePosition,
)


def calendar() -> Calendar:
    """Create the smallest representative calendar payload."""
    return Calendar(filename="schedule.ics", ics_text="BEGIN:VCALENDAR")


def invalid_event() -> InvalidEvent:
    """Create one representative semantic validation result."""
    return InvalidEvent(
        source_position=SourcePosition(event_index=2, row=3),
        id="",
        summary="Exercise",
        issue_codes=[IssueCode.EMPTY_ID],
    )


@pytest.mark.parametrize(
    ("status", "converted_count", "skipped_count", "invalid_events", "result"),
    [
        ("success", 2, 0, [], calendar()),
        ("partial", 1, 1, [invalid_event()], calendar()),
        ("failure", 0, 1, [invalid_event()], None),
    ],
)
def test_accepts_each_normal_conversion_outcome(
    status: str,
    converted_count: int,
    skipped_count: int,
    invalid_events: list[InvalidEvent],
    result: Calendar | None,
) -> None:
    response = ConversionResponse(
        status=status,
        total_count=converted_count + skipped_count,
        converted_count=converted_count,
        skipped_count=skipped_count,
        invalid_events=invalid_events,
        calendar=result,
    )

    payload = response.model_dump(mode="json")
    assert payload["status"] == status
    if result is None:
        assert payload["calendar"] is None
    else:
        assert payload["calendar"] is not None
        assert payload["calendar"]["mime_type"] == (
            "text/calendar;charset=utf-8"
        )


@pytest.mark.parametrize(
    "changes",
    [
        {"total_count": 3},
        {"skipped_count": 0},
        {"status": "success"},
        {"status": "failure"},
        {"calendar": None},
    ],
)
def test_rejects_contradictory_normal_responses(
    changes: dict[str, object],
) -> None:
    fields: dict[str, object] = {
        "status": "partial",
        "total_count": 2,
        "converted_count": 1,
        "skipped_count": 1,
        "invalid_events": [invalid_event()],
        "calendar": calendar(),
    }
    fields.update(changes)

    with pytest.raises(ValidationError):
        ConversionResponse.model_validate(fields)


def test_serializes_stable_issue_codes_and_source_details() -> None:
    event = InvalidEvent(
        source_position=SourcePosition(
            event_index=4,
            row=8,
            worksheet="Schedule",
        ),
        id="duplicate",
        summary="Exercise",
        issue_codes=[
            IssueCode.DUPLICATE_ID,
            IssueCode.END_TIME_BEFORE_START_TIME,
        ],
    )

    assert event.model_dump(mode="json") == {
        "source_position": {
            "event_index": 4,
            "row": 8,
            "worksheet": "Schedule",
        },
        "id": "duplicate",
        "summary": "Exercise",
        "issue_codes": ["duplicate_id", "end_time_before_start_time"],
    }


def test_issue_code_values_match_the_converter_contract() -> None:
    assert [code.value for code in IssueCode] == [
        "empty_id",
        "empty_summary",
        "end_date_before_start_date",
        "end_time_before_start_time",
        "duplicate_id",
    ]


@pytest.mark.parametrize("code", list(FatalErrorCode))
def test_fatal_error_contract_has_a_stable_code_and_safe_message(
    code: FatalErrorCode,
) -> None:
    response = FatalErrorResponse(
        code=code,
        message="The request could not be processed.",
    )

    assert response.model_dump(mode="json") == {
        "code": code.value,
        "message": "The request could not be processed.",
    }


def test_fatal_error_code_values_are_stable() -> None:
    assert [code.value for code in FatalErrorCode] == [
        "missing_filename",
        "unsupported_file_type",
        "oversized_upload",
        "malformed_csv",
        "malformed_xlsx",
        "input_read_error",
        "no_active_schedule",
        "internal_error",
    ]


def test_contract_rejects_unknown_fields() -> None:
    with pytest.raises(ValidationError):
        FatalErrorResponse.model_validate(
            {
                "code": "internal_error",
                "message": "The request could not be processed.",
                "traceback": "must not leak",
            }
        )


def test_active_schedule_response_allows_an_empty_store() -> None:
    assert ActiveScheduleResponse(schedule=None).model_dump() == {"schedule": None}


def test_active_schedule_exposes_only_the_documented_fields() -> None:
    schedule = ActiveSchedule(
        filename="dienstplan.xlsx",
        size_bytes=2048,
        uploaded_at=datetime(2026, 9, 14, 8, 30, tzinfo=timezone.utc),
        uploaded_by="chief",
    )

    assert schedule.model_dump(mode="json") == {
        "filename": "dienstplan.xlsx",
        "size_bytes": 2048,
        "uploaded_at": "2026-09-14T08:30:00Z",
        "uploaded_by": "chief",
    }


def test_active_schedule_rejects_a_stored_filename_leak() -> None:
    with pytest.raises(ValidationError):
        ActiveSchedule.model_validate(
            {
                "filename": "dienstplan.xlsx",
                "size_bytes": 2048,
                "uploaded_at": "2026-09-14T08:30:00Z",
                "uploaded_by": "chief",
                "stored_filename": "0123456789abcdef0123456789abcdef.xlsx",
            }
        )


def test_active_schedule_rejects_a_negative_size() -> None:
    with pytest.raises(ValidationError):
        ActiveSchedule(
            filename="dienstplan.xlsx",
            size_bytes=-1,
            uploaded_at=datetime(2026, 9, 14, 8, 30, tzinfo=timezone.utc),
            uploaded_by="chief",
        )
