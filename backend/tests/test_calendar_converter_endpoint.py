"""HTTP contract tests for the calendar converter endpoint."""

from collections.abc import Generator
from pathlib import Path
import tempfile
from typing import BinaryIO

import pytest
from fastapi import UploadFile
from fastapi.testclient import TestClient
from httpx2 import Response
from starlette import formparsers

import firefighter_tools_backend.routes.calendar_converter as route
from firefighter_tools_backend import create_app
from firefighter_tools_backend.domain.calendar_conversion import (
    ConversionErrorCode,
    ConversionResult,
)
from firefighter_tools_backend.domain.upload import (
    UploadValidationErrorCode,
    ValidatedUpload,
)
from firefighter_tools_backend.services.upload_validation import (
    MAX_UPLOAD_BYTES,
)

ENDPOINT = "/api/v1/tools/calendar-converter/convert"
CSV_HEADER = (
    "id,summary,all_date,start_date,start_time,end_date,end_time,"
    "location,description\n"
)
SAMPLE_XLSX_PATH = (
    Path(__file__).parents[2]
    / "assets"
    / "examples"
    / "calendar_schedule_example.xlsx"
)


@pytest.fixture
def client() -> Generator[TestClient]:
    with TestClient(create_app()) as test_client:
        yield test_client


def post_csv(
    client: TestClient,
    rows: str,
    *,
    filename: str = "schedule.csv",
) -> Response:
    return client.post(
        ENDPOINT,
        files={"file": (filename, (CSV_HEADER + rows).encode(), "text/csv")},
    )


def test_openapi_declares_conversion_and_error_responses(
    client: TestClient,
) -> None:
    operation = client.get("/openapi.json").json()["paths"][ENDPOINT]["post"]

    assert set(operation["responses"]) >= {"200", "413", "415", "422", "500"}
    assert operation["responses"]["200"]["content"]["application/json"][
        "schema"
    ]["$ref"].endswith("/ConversionResponse")
    for status_code in ("413", "415", "422", "500"):
        schema = operation["responses"][status_code]["content"][
            "application/json"
        ]["schema"]
        assert schema["$ref"].endswith("/FatalErrorResponse")


def test_every_expected_domain_error_has_an_http_mapping() -> None:
    assert set(route._UPLOAD_ERRORS) == set(UploadValidationErrorCode)
    assert set(route._CONVERSION_ERRORS) == set(ConversionErrorCode)
    assert {
        status_code for status_code, _, _ in route._UPLOAD_ERRORS.values()
    } == {413, 415, 422}
    assert {
        status_code for status_code, _, _ in route._CONVERSION_ERRORS.values()
    } == {415, 422}


def test_returns_success_with_calendar_for_valid_schedule(
    client: TestClient,
) -> None:
    response = post_csv(
        client,
        "event-1,Exercise,true,2026-07-22,,2026-07-22,,,\n",
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "success"
    assert (
        payload["total_count"],
        payload["converted_count"],
        payload["skipped_count"],
    ) == (1, 1, 0)
    assert payload["invalid_events"] == []
    assert payload["calendar"]["filename"] == "schedule.ics"
    assert payload["calendar"]["mime_type"] == (
        "text/calendar;charset=utf-8"
    )
    assert "X-WR-CALNAME:Feuerwehr Tools" in payload["calendar"]["ics_text"]
    assert "UID:event-1" in payload["calendar"]["ics_text"]


def test_returns_success_for_valid_xlsx(client: TestClient) -> None:
    with SAMPLE_XLSX_PATH.open("rb") as source:
        response = client.post(
            ENDPOINT,
            files={
                "file": (
                    SAMPLE_XLSX_PATH.name,
                    source,
                    (
                        "application/vnd.openxmlformats-officedocument."
                        "spreadsheetml.sheet"
                    ),
                )
            },
        )

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "success"
    assert (
        payload["total_count"],
        payload["converted_count"],
        payload["skipped_count"],
    ) == (3, 3, 0)
    assert payload["calendar"]["filename"] == "calendar_schedule_example.ics"


def test_returns_partial_with_invalid_event_details(
    client: TestClient,
) -> None:
    response = post_csv(
        client,
        "valid,Exercise,true,2026-07-22,,2026-07-22,,,\n"
        ",Invalid,true,2026-07-23,,2026-07-23,,,\n",
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "partial"
    assert (
        payload["total_count"],
        payload["converted_count"],
        payload["skipped_count"],
    ) == (2, 1, 1)
    assert payload["invalid_events"] == [
        {
            "source_position": {
                "event_index": 2,
                "row": 3,
                "worksheet": None,
            },
            "id": "",
            "summary": "Invalid",
            "issue_codes": ["empty_id"],
        }
    ]
    calendar = payload["calendar"]
    assert calendar["filename"] == "schedule.ics"
    assert calendar["mime_type"] == "text/calendar;charset=utf-8"
    assert "BEGIN:VCALENDAR" in calendar["ics_text"]
    assert "UID:valid" in calendar["ics_text"]
    assert "SUMMARY:Invalid" not in calendar["ics_text"]


def test_returns_normal_failure_without_calendar_when_all_events_are_invalid(
    client: TestClient,
) -> None:
    response = post_csv(
        client,
        ",Invalid,true,2026-07-23,,2026-07-23,,,\n",
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "failure"
    assert (
        payload["total_count"],
        payload["converted_count"],
        payload["skipped_count"],
    ) == (1, 0, 1)
    assert payload["invalid_events"][0]["issue_codes"] == ["empty_id"]
    assert payload["calendar"] is None


def test_maps_missing_file_to_safe_422(client: TestClient) -> None:
    response = client.post(ENDPOINT)

    assert response.status_code == 422
    assert response.json() == {
        "code": "missing_filename",
        "message": "A filename is required.",
    }


def test_maps_unsupported_extension_to_safe_415(client: TestClient) -> None:
    response = client.post(
        ENDPOINT,
        files={"file": ("schedule.txt", b"contents", "text/plain")},
    )

    assert response.status_code == 415
    assert response.json() == {
        "code": "unsupported_file_type",
        "message": "Only CSV and XLSX files are supported.",
    }


def test_accepts_upload_of_exactly_ten_mebibytes(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    captured_size = 0

    def convert_exact_limit(
        source: BinaryIO,
        *,
        filename: str,
    ) -> ConversionResult:
        nonlocal captured_size
        captured_size = len(source.read())
        assert filename == "schedule.csv"
        return ConversionResult(
            ics_text="BEGIN:VCALENDAR\r\nEND:VCALENDAR\r\n",
            total_count=1,
            converted_count=1,
            skipped_count=0,
            invalid_events=(),
        )

    monkeypatch.setattr(
        route.calendar_conversion,
        "convert_calendar",
        convert_exact_limit,
    )

    response = client.post(
        ENDPOINT,
        files={
            "file": (
                "schedule.csv",
                b"x" * MAX_UPLOAD_BYTES,
                "text/csv",
            )
        },
    )

    assert response.status_code == 200
    assert response.json()["status"] == "success"
    assert captured_size == MAX_UPLOAD_BYTES


def test_maps_oversized_upload_to_safe_413(client: TestClient) -> None:
    response = client.post(
        ENDPOINT,
        files={
            "file": (
                "schedule.csv",
                b"x" * (MAX_UPLOAD_BYTES + 1),
                "text/csv",
            )
        },
    )

    assert response.status_code == 413
    assert response.json() == {
        "code": "oversized_upload",
        "message": "The uploaded file exceeds the 10 MiB limit.",
    }


def test_maps_structurally_malformed_schedule_to_safe_422(
    client: TestClient,
) -> None:
    response = post_csv(client, "event-1,too,few\n")

    assert response.status_code == 422
    assert response.json() == {
        "code": "malformed_csv",
        "message": "The CSV schedule is malformed.",
    }


def test_maps_structurally_malformed_xlsx_to_safe_422(
    client: TestClient,
) -> None:
    response = client.post(
        ENDPOINT,
        files={
            "file": (
                "schedule.xlsx",
                b"not an XLSX workbook",
                (
                    "application/vnd.openxmlformats-officedocument."
                    "spreadsheetml.sheet"
                ),
            )
        },
    )

    assert response.status_code == 422
    assert response.json() == {
        "code": "malformed_xlsx",
        "message": "The XLSX schedule is malformed.",
    }


def test_sanitizes_dangerous_filename(client: TestClient) -> None:
    response = post_csv(
        client,
        "event-1,Exercise,true,2026-07-22,,2026-07-22,,,\n",
        filename="../../schedule.csv",
    )

    assert response.status_code == 200
    assert response.json()["calendar"]["filename"] == "schedule.ics"


def test_preserves_unicode_filename_and_event_data(client: TestClient) -> None:
    response = post_csv(
        client,
        (
            "übung-1,Atemschutzübung,true,2026-07-22,,2026-07-22,,"
            "München,Grüße aus Südtirol\n"
        ),
        filename="../../Übungsplan_🔥.csv",
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["calendar"]["filename"] == "Übungsplan_🔥.ics"
    assert "UID:übung-1" in payload["calendar"]["ics_text"]
    assert "SUMMARY:Atemschutzübung" in payload["calendar"]["ics_text"]
    assert "LOCATION:München" in payload["calendar"]["ics_text"]
    assert "DESCRIPTION:Grüße aus Südtirol" in payload["calendar"]["ics_text"]


def test_maps_unexpected_problem_to_generic_500(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    secret_detail = "private schedule detail"

    def fail_unexpectedly(*args: object, **kwargs: object) -> None:
        raise RuntimeError(secret_detail)

    monkeypatch.setattr(
        route.calendar_conversion,
        "convert_calendar",
        fail_unexpectedly,
    )

    response = post_csv(
        client,
        "event-1,Exercise,true,2026-07-22,,2026-07-22,,,\n",
    )

    assert response.status_code == 500
    assert response.json() == {
        "code": "internal_error",
        "message": "The request could not be processed.",
    }
    assert secret_detail not in response.text


def test_uploaded_data_is_not_retained_after_request(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    captured_uploads: list[UploadFile] = []
    original_validate_upload = route.validate_upload

    async def capture_upload(upload: UploadFile) -> ValidatedUpload:
        captured_uploads.append(upload)
        return await original_validate_upload(upload)

    monkeypatch.setattr(route, "validate_upload", capture_upload)
    monkeypatch.setattr(formparsers.MultiPartParser, "spool_max_size", 1)
    monkeypatch.setattr(tempfile, "tempdir", str(tmp_path))

    response = post_csv(
        client,
        (
            "event-1,Exercise,true,2026-07-22,,2026-07-22,,,"
            "unique-retention-marker\n"
        ),
    )

    assert response.status_code == 200
    assert len(captured_uploads) == 1
    assert captured_uploads[0].file.closed
    assert list(tmp_path.iterdir()) == []
