"""Tests for the calendar-conversion library adapter."""

import ast
import inspect
from io import BytesIO

import pytest

import firefighter_tools_backend.adapters.calendar_conversion as adapter
from calendar_conversion import (
    ConversionError as LibraryConversionError,
    ConversionErrorCode as LibraryConversionErrorCode,
)
from firefighter_tools_backend.domain.calendar_conversion import (
    ConversionError,
    ConversionErrorCode,
    ConversionResult,
    IssueCode,
)

CSV_HEADER = (
    "id,summary,all_date,start_date,start_time,end_date,end_time,"
    "location,description\n"
)


def test_adapter_has_no_fastapi_dependency() -> None:
    syntax_tree = ast.parse(inspect.getsource(adapter))
    imported_roots: set[str] = set()
    for node in ast.walk(syntax_tree):
        if isinstance(node, ast.Import):
            imported_roots.update(
                alias.name.partition(".")[0] for alias in node.names
            )
        elif isinstance(node, ast.ImportFrom) and node.module is not None:
            imported_roots.add(node.module.partition(".")[0])

    assert "fastapi" not in imported_roots


def test_translates_successful_conversion_into_backend_domain_data() -> None:
    source = BytesIO(
        (
            CSV_HEADER
            + "valid,Exercise,true,2026-07-22,,2026-07-22,,,\n"
        ).encode()
    )

    result = adapter.convert_schedule(
        source,
        filename="schedule.csv",
        calendar_name="Feuerwehr",
    )

    assert isinstance(result, ConversionResult)
    assert (result.total_count, result.converted_count, result.skipped_count) == (
        1,
        1,
        0,
    )
    assert result.invalid_events == ()
    assert "X-WR-CALNAME:Feuerwehr" in result.ics_text
    assert "UID:valid" in result.ics_text


def test_translates_partial_conversion_into_backend_domain_data() -> None:
    source = BytesIO(
        (
            CSV_HEADER
            + "valid,Exercise,true,2026-07-22,,2026-07-22,,,\n"
            + ",Invalid,true,2026-07-23,,2026-07-23,,,\n"
        ).encode()
    )

    result = adapter.convert_schedule(
        source,
        filename="schedule.csv",
        calendar_name="Feuerwehr",
    )

    assert isinstance(result, ConversionResult)
    assert (result.total_count, result.converted_count, result.skipped_count) == (
        2,
        1,
        1,
    )
    assert "X-WR-CALNAME:Feuerwehr" in result.ics_text
    assert "UID:valid" in result.ics_text
    invalid = result.invalid_events[0]
    assert invalid.source_position.event_index == 2
    assert invalid.source_position.row == 3
    assert invalid.source_position.worksheet is None
    assert invalid.id == ""
    assert invalid.summary == "Invalid"
    assert invalid.issue_codes == (IssueCode.EMPTY_ID,)
    assert type(invalid).__module__.startswith("firefighter_tools_backend.domain")


def test_translates_all_invalid_schedule_into_backend_domain_data() -> None:
    source = BytesIO(
        (
            CSV_HEADER
            + ",Invalid,true,2026-07-23,,2026-07-23,,,\n"
        ).encode()
    )

    result = adapter.convert_schedule(
        source,
        filename="schedule.csv",
        calendar_name="Feuerwehr",
    )

    assert (result.total_count, result.converted_count, result.skipped_count) == (
        1,
        0,
        1,
    )
    assert len(result.invalid_events) == 1
    assert result.invalid_events[0].id == ""
    assert result.invalid_events[0].issue_codes == (IssueCode.EMPTY_ID,)
    assert "BEGIN:VEVENT" not in result.ics_text


@pytest.mark.parametrize(
    ("library_code", "domain_code"),
    [
        (
            LibraryConversionErrorCode.UNSUPPORTED_FILE_TYPE,
            ConversionErrorCode.UNSUPPORTED_FILE_TYPE,
        ),
        (
            LibraryConversionErrorCode.MALFORMED_CSV,
            ConversionErrorCode.MALFORMED_CSV,
        ),
        (
            LibraryConversionErrorCode.MALFORMED_XLSX,
            ConversionErrorCode.MALFORMED_XLSX,
        ),
        (
            LibraryConversionErrorCode.INPUT_READ_ERROR,
            ConversionErrorCode.INPUT_READ_ERROR,
        ),
    ],
)
def test_translates_every_library_error_code_without_exposing_its_message(
    monkeypatch: pytest.MonkeyPatch,
    library_code: LibraryConversionErrorCode,
    domain_code: ConversionErrorCode,
) -> None:
    def fail_conversion(*args: object, **kwargs: object) -> None:
        raise LibraryConversionError(
            library_code,
            "converter detail that must remain internal",
            row=7,
            worksheet="Schedule",
        )

    monkeypatch.setattr(adapter, "library_convert_schedule", fail_conversion)

    with pytest.raises(ConversionError) as raised:
        adapter.convert_schedule(
            BytesIO(b"contents"),
            filename="schedule.csv",
            calendar_name="Feuerwehr",
        )

    assert raised.value.code is domain_code
    assert raised.value.row == 7
    assert raised.value.worksheet == "Schedule"
    assert "converter detail" not in str(raised.value)


def test_calls_library_with_the_stream_and_named_arguments(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    source = BytesIO(b"contents")
    captured: dict[str, object] = {}

    class EmptyResult:
        ics_text = "BEGIN:VCALENDAR"
        total_count = 0
        converted_count = 0
        skipped_count = 0
        invalid_events: tuple[object, ...] = ()

    def capture_conversion(
        passed_source: BytesIO,
        *,
        filename: str,
        calendar_name: str,
        participant: str | None,
    ) -> EmptyResult:
        captured.update(
            source=passed_source,
            filename=filename,
            calendar_name=calendar_name,
            participant=participant,
        )
        return EmptyResult()

    monkeypatch.setattr(adapter, "library_convert_schedule", capture_conversion)

    adapter.convert_schedule(
        source,
        filename="schedule.xlsx",
        calendar_name="Übungen",
        participant="204",
    )

    assert captured == {
        "source": source,
        "filename": "schedule.xlsx",
        "calendar_name": "Übungen",
        "participant": "204",
    }
