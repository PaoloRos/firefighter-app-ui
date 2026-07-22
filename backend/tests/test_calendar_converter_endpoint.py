"""HTTP contract tests for the calendar converter endpoint."""

from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from httpx2 import Response

import firefighter_tools_backend.routes.calendar_converter as route
from firefighter_tools_backend import create_app
from firefighter_tools_backend.domain.calendar_conversion import (
    ConversionErrorCode,
)
from firefighter_tools_backend.domain.upload import UploadValidationErrorCode
from firefighter_tools_backend.services.upload_validation import (
    MAX_UPLOAD_BYTES,
)

ENDPOINT = "/api/v1/tools/calendar-converter/convert"
CSV_HEADER = (
    "id,summary,all_date,start_date,start_time,end_date,end_time,"
    "location,description\n"
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
        filename="../../incoming/SCHEDULE.CSV",
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
    assert payload["calendar"]["filename"] == "SCHEDULE.ics"
    assert payload["calendar"]["mime_type"] == (
        "text/calendar;charset=utf-8"
    )
    assert "X-WR-CALNAME:Feuerwehr Tools" in payload["calendar"]["ics_text"]
    assert "UID:event-1" in payload["calendar"]["ics_text"]


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
    assert payload["calendar"] is not None


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
