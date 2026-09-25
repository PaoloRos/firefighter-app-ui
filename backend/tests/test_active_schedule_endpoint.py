"""HTTP contract for storing and converting the active schedule."""

import re
from dataclasses import replace
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from conftest import SUPER_USER, _client_authenticated_as, schedule_csv
from firefighter_tools_backend.domain.calendar_conversion import (
    ConversionError,
    ConversionErrorCode,
)
from firefighter_tools_backend.routes import calendar_converter as route
from firefighter_tools_backend.services import schedule_store
from firefighter_tools_backend.services.upload_validation import MAX_UPLOAD_BYTES

PROJECT_ROOT = Path(__file__).resolve().parents[2]
SCHEDULE_ENDPOINT = "/api/v1/tools/calendar-converter/schedule"
CONVERT_ENDPOINT = "/api/v1/tools/calendar-converter/schedule/convert"

PARTIAL_ROWS = (
    "id,summary,all_date,start_date,start_time,end_date,end_time,location,description",
    "valid-1,Atemschutz,false,2026-08-03,19:00,2026-08-03,21:00,Depot,Uebung",
    "invalid-1,,false,2026-08-05,19:00,2026-08-05,21:00,Depot,Ohne Titel",
)
PARTICIPANTS_HEADER = (
    "id,summary,all_date,start_date,start_time,end_date,end_time,"
    "location,description,participants"
)
PARTICIPANT_ROWS = (
    PARTICIPANTS_HEADER,
    "chief-only,Kommando,true,2026-08-01,,2026-08-01,,,,101",
    "member-only,Nachtdienst,true,2026-08-02,,2026-08-02,,,,204",
    'shared,Einsatzuebung,true,2026-08-03,,2026-08-03,,,,"101;204"',
    "everyone,Versammlung,true,2026-08-04,,2026-08-04,,,,",
)
ALL_INVALID_ROWS = (
    "id,summary,all_date,start_date,start_time,end_date,end_time,location,description",
    "invalid-1,,false,2026-08-05,19:00,2026-08-05,21:00,Depot,Ohne Titel",
)


def put_schedule(
    client: TestClient,
    *,
    filename: str = "dienstplan.csv",
    body: bytes | None = None,
) -> object:
    payload = schedule_csv() if body is None else body
    return client.put(
        SCHEDULE_ENDPOINT,
        files={"file": (filename, payload, "text/csv")},
    )


def repository_calendar_files() -> list[Path]:
    """Every .ics under the repository, including the git-ignored data dir."""
    skipped = {".git", ".venv", "node_modules", "dist"}
    return [
        path
        for path in PROJECT_ROOT.rglob("*.ics")
        if not any(part in skipped for part in path.parts)
    ]


def test_reports_no_schedule_before_any_upload(client: TestClient) -> None:
    response = client.get(SCHEDULE_ENDPOINT)

    assert response.status_code == 200
    assert response.json() == {"schedule": None}


def test_plain_user_also_sees_an_empty_store(user_client: TestClient) -> None:
    response = user_client.get(SCHEDULE_ENDPOINT)

    assert response.status_code == 200
    assert response.json() == {"schedule": None}


def test_reading_the_schedule_requires_a_session(
    anonymous_client: TestClient,
) -> None:
    response = anonymous_client.get(SCHEDULE_ENDPOINT)

    assert response.status_code == 401
    assert response.json()["code"] == "not_authenticated"


def test_super_user_upload_becomes_the_reported_schedule(
    client: TestClient,
) -> None:
    uploaded = put_schedule(client, filename="Dienstplan 2026.csv")

    assert uploaded.status_code == 200
    schedule = uploaded.json()["schedule"]
    assert schedule["filename"] == "Dienstplan 2026.csv"
    assert schedule["size_bytes"] == len(schedule_csv())
    assert schedule["uploaded_by"] == "chief"

    assert client.get(SCHEDULE_ENDPOINT).json()["schedule"] == schedule


def test_every_signed_in_account_sees_the_stored_schedule(
    client: TestClient,
    user_client: TestClient,
) -> None:
    put_schedule(client)

    schedule = user_client.get(SCHEDULE_ENDPOINT).json()["schedule"]
    assert schedule["filename"] == "dienstplan.csv"


def test_response_never_exposes_the_stored_name_or_a_local_path(
    client: TestClient,
    stored_schedule: dict[str, object],
) -> None:
    body = client.get(SCHEDULE_ENDPOINT).text

    assert set(stored_schedule) == {
        "filename",
        "size_bytes",
        "uploaded_at",
        "uploaded_by",
    }
    assert re.search(r"[0-9a-f]{32}", body) is None
    assert str(PROJECT_ROOT) not in body
    assert "/Users/" not in body


def test_rejects_an_upload_from_a_plain_user(user_client: TestClient) -> None:
    response = put_schedule(user_client)

    assert response.status_code == 403
    assert response.json()["code"] == "forbidden"


def test_rejects_an_upload_without_a_session(
    anonymous_client: TestClient,
) -> None:
    response = put_schedule(anonymous_client)

    assert response.status_code == 401
    assert response.json()["code"] == "not_authenticated"


def test_plain_user_upload_does_not_change_the_store(
    client: TestClient,
    user_client: TestClient,
) -> None:
    put_schedule(user_client)

    assert client.get(SCHEDULE_ENDPOINT).json() == {"schedule": None}


def test_rejects_a_request_without_a_file(client: TestClient) -> None:
    response = client.put(SCHEDULE_ENDPOINT)

    assert response.status_code == 422
    assert response.json()["code"] == "missing_filename"


def test_rejects_an_unsupported_extension(client: TestClient) -> None:
    response = put_schedule(client, filename="dienstplan.txt")

    assert response.status_code == 415
    assert response.json()["code"] == "unsupported_file_type"


def test_rejects_an_oversized_upload(client: TestClient) -> None:
    response = put_schedule(client, body=b"a" * (MAX_UPLOAD_BYTES + 1))

    assert response.status_code == 413
    assert response.json()["code"] == "oversized_upload"


def test_a_rejected_upload_leaves_the_store_untouched(client: TestClient) -> None:
    put_schedule(client, filename="first.csv")
    put_schedule(client, filename="second.txt")

    assert client.get(SCHEDULE_ENDPOINT).json()["schedule"]["filename"] == "first.csv"


def test_a_second_upload_replaces_the_first_for_every_account(
    client: TestClient,
    user_client: TestClient,
) -> None:
    put_schedule(client, filename="first.csv")
    put_schedule(client, filename="second.csv")

    schedule = user_client.get(SCHEDULE_ENDPOINT).json()["schedule"]
    assert schedule["filename"] == "second.csv"

    stored = list(schedule_store.store_directory().iterdir())
    assert len(stored) == 1


def test_plain_user_converts_the_active_schedule(
    stored_schedule: dict[str, object],
    user_client: TestClient,
) -> None:
    response = user_client.post(CONVERT_ENDPOINT)

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "success"
    assert payload["converted_count"] == 1
    assert payload["calendar"]["filename"] == "dienstplan-204.ics"
    assert "BEGIN:VCALENDAR" in payload["calendar"]["ics_text"]


def test_super_user_converts_the_same_active_schedule(
    stored_schedule: dict[str, object],
    client: TestClient,
) -> None:
    response = client.post(CONVERT_ENDPOINT)

    assert response.status_code == 200
    assert response.json()["status"] == "success"


def test_converting_requires_a_session(anonymous_client: TestClient) -> None:
    response = anonymous_client.post(CONVERT_ENDPOINT)

    assert response.status_code == 401
    assert response.json()["code"] == "not_authenticated"


def test_converting_without_a_stored_schedule_reports_a_conflict(
    user_client: TestClient,
) -> None:
    response = user_client.post(CONVERT_ENDPOINT)

    assert response.status_code == 409
    assert response.json() == {
        "code": "no_active_schedule",
        "message": "No schedule has been uploaded yet.",
    }


def test_conversion_reports_partial_results_with_event_details(
    client: TestClient,
) -> None:
    put_schedule(client, body=schedule_csv(PARTIAL_ROWS))

    payload = client.post(CONVERT_ENDPOINT).json()

    assert payload["status"] == "partial"
    assert payload["converted_count"] == 1
    assert payload["skipped_count"] == 1
    assert payload["invalid_events"][0]["id"] == "invalid-1"
    assert payload["calendar"] is not None


def test_conversion_reports_failure_without_a_calendar(client: TestClient) -> None:
    put_schedule(client, body=schedule_csv(ALL_INVALID_ROWS))

    payload = client.post(CONVERT_ENDPOINT).json()

    assert payload["status"] == "failure"
    assert payload["converted_count"] == 0
    assert payload["calendar"] is None


def test_a_malformed_stored_schedule_maps_to_a_safe_422(
    client: TestClient,
) -> None:
    put_schedule(client, body=b"not,a,schedule\n\x00\x01\x02\n")

    response = client.post(CONVERT_ENDPOINT)

    assert response.status_code == 422
    assert response.json()["code"] in {"malformed_csv", "input_read_error"}


def test_an_unexpected_conversion_problem_maps_to_a_generic_500(
    client: TestClient,
    stored_schedule: dict[str, object],
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    def explode(*args: object, **kwargs: object) -> None:
        raise RuntimeError("secret internal detail")

    monkeypatch.setattr(route.calendar_conversion, "convert_calendar", explode)

    response = client.post(CONVERT_ENDPOINT)

    assert response.status_code == 500
    assert response.json() == {
        "code": "internal_error",
        "message": "The request could not be processed.",
    }
    assert "secret internal detail" not in response.text


def test_conversion_errors_expose_no_traceback_or_local_path(
    client: TestClient,
    stored_schedule: dict[str, object],
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    def explode(*args: object, **kwargs: object) -> None:
        raise ConversionError(ConversionErrorCode.MALFORMED_CSV, row=2)

    monkeypatch.setattr(route.calendar_conversion, "convert_calendar", explode)

    body = client.post(CONVERT_ENDPOINT).text

    assert "Traceback" not in body
    assert str(PROJECT_ROOT) not in body


def test_repeated_conversion_leaves_the_stored_schedule_in_place(
    client: TestClient,
    stored_schedule: dict[str, object],
) -> None:
    before = sorted(schedule_store.store_directory().iterdir())

    assert client.post(CONVERT_ENDPOINT).status_code == 200
    assert client.post(CONVERT_ENDPOINT).status_code == 200

    assert sorted(schedule_store.store_directory().iterdir()) == before
    assert client.get(SCHEDULE_ENDPOINT).json()["schedule"] == stored_schedule


def test_conversion_writes_no_calendar_file_anywhere(
    client: TestClient,
    stored_schedule: dict[str, object],
) -> None:
    before = repository_calendar_files()

    client.post(CONVERT_ENDPOINT)

    assert repository_calendar_files() == before
    store_files = list(schedule_store.store_directory().iterdir())
    assert [path for path in store_files if path.suffix == ".ics"] == []


def test_openapi_documents_the_stored_schedule_endpoints(
    client: TestClient,
) -> None:
    paths = client.get("/openapi.json").json()["paths"]

    schedule = paths["/api/v1/tools/calendar-converter/schedule"]
    assert set(schedule) == {"get", "put"}
    assert set(schedule["put"]["responses"]) == {
        "200",
        "401",
        "403",
        "413",
        "415",
        "422",
        "500",
    }
    assert set(schedule["get"]["responses"]) == {"200", "401"}

    convert = paths["/api/v1/tools/calendar-converter/schedule/convert"]["post"]
    assert set(convert["responses"]) == {
        "200",
        "401",
        "403",
        "409",
        "415",
        "422",
        "500",
    }
    scope = {parameter["name"]: parameter for parameter in convert["parameters"]}
    assert scope["scope"]["in"] == "query"
    assert scope["scope"]["schema"]["default"] == "personal"


def test_stored_timestamp_round_trips_as_utc(
    client: TestClient,
    stored_schedule: dict[str, object],
) -> None:
    """SQLite drops tzinfo, so a re-read must still serialize as UTC."""
    reread = client.get(SCHEDULE_ENDPOINT).json()["schedule"]

    assert reread == stored_schedule
    assert str(reread["uploaded_at"]).endswith("Z")


def _event_ids(payload: dict[str, object]) -> list[str]:
    calendar = payload["calendar"]
    assert isinstance(calendar, dict)
    return re.findall(r"^UID:(.+?)\r?$", calendar["ics_text"], re.MULTILINE)


def test_personal_conversion_keeps_own_shared_and_everyone_events(
    client: TestClient,
    user_client: TestClient,
) -> None:
    put_schedule(client, body=schedule_csv(PARTICIPANT_ROWS))

    payload = user_client.post(CONVERT_ENDPOINT).json()

    assert payload["status"] == "success"
    assert payload["total_count"] == 3
    assert sorted(_event_ids(payload)) == ["everyone", "member-only", "shared"]
    assert payload["calendar"]["filename"] == "dienstplan-204.ics"


def test_explicit_personal_scope_matches_the_default(
    client: TestClient,
    user_client: TestClient,
) -> None:
    put_schedule(client, body=schedule_csv(PARTICIPANT_ROWS))

    explicit = user_client.post(f"{CONVERT_ENDPOINT}?scope=personal").json()

    assert explicit == user_client.post(CONVERT_ENDPOINT).json()


def test_super_user_full_scope_returns_every_event(client: TestClient) -> None:
    put_schedule(client, body=schedule_csv(PARTICIPANT_ROWS))

    payload = client.post(f"{CONVERT_ENDPOINT}?scope=full").json()

    assert payload["total_count"] == 4
    assert sorted(_event_ids(payload)) == [
        "chief-only",
        "everyone",
        "member-only",
        "shared",
    ]
    assert payload["calendar"]["filename"] == "dienstplan.ics"


def test_super_user_personal_scope_returns_only_their_events(
    client: TestClient,
) -> None:
    put_schedule(client, body=schedule_csv(PARTICIPANT_ROWS))

    payload = client.post(CONVERT_ENDPOINT).json()

    assert sorted(_event_ids(payload)) == ["chief-only", "everyone", "shared"]
    assert payload["calendar"]["filename"] == "dienstplan-101.ics"


def test_plain_user_cannot_request_the_full_schedule(
    client: TestClient,
    user_client: TestClient,
) -> None:
    put_schedule(client, body=schedule_csv(PARTICIPANT_ROWS))

    response = user_client.post(f"{CONVERT_ENDPOINT}?scope=full")

    assert response.status_code == 403
    assert response.json()["code"] == "forbidden"


def test_personal_conversion_without_a_personnel_number_is_refused(
    stored_schedule: dict[str, object],
    unnumbered_client: TestClient,
) -> None:
    response = unnumbered_client.post(CONVERT_ENDPOINT)

    assert response.status_code == 409
    assert response.json() == {
        "code": "missing_personnel_number",
        "message": "This account has no personnel number.",
    }


def test_super_user_without_a_number_can_still_convert_the_full_schedule(
    stored_schedule: dict[str, object],
) -> None:
    unnumbered_chief = replace(SUPER_USER, personnel_number=None)
    for client in _client_authenticated_as(unnumbered_chief):
        assert client.post(f"{CONVERT_ENDPOINT}?scope=full").status_code == 200
        personal = client.post(CONVERT_ENDPOINT)
        assert personal.json()["code"] == "missing_personnel_number"


def test_personal_conversion_with_no_matching_events_offers_no_calendar(
    client: TestClient,
    user_client: TestClient,
) -> None:
    rows = (PARTICIPANTS_HEADER, PARTICIPANT_ROWS[1])
    put_schedule(client, body=schedule_csv(rows))

    payload = user_client.post(CONVERT_ENDPOINT).json()

    assert payload["status"] == "failure"
    assert payload["total_count"] == 0
    assert payload["invalid_events"] == []
    assert payload["calendar"] is None


def test_personal_conversion_hides_other_peoples_invalid_events(
    client: TestClient,
    user_client: TestClient,
) -> None:
    rows = (
        PARTICIPANTS_HEADER,
        "broken,,true,2026-08-01,,2026-08-01,,,,101",
        "everyone,Versammlung,true,2026-08-04,,2026-08-04,,,,",
    )
    put_schedule(client, body=schedule_csv(rows))

    personal = user_client.post(CONVERT_ENDPOINT).json()
    full = client.post(f"{CONVERT_ENDPOINT}?scope=full").json()

    assert personal["status"] == "success"
    assert personal["skipped_count"] == 0
    assert full["status"] == "partial"
    assert full["invalid_events"][0]["id"] == "broken"


def test_rejects_an_unknown_scope(
    stored_schedule: dict[str, object],
    client: TestClient,
) -> None:
    response = client.post(f"{CONVERT_ENDPOINT}?scope=everything")

    assert response.status_code == 422
