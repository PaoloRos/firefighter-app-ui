"""Final architecture, security, and lifecycle checks for calendar conversion."""

import ast
from collections.abc import Generator
import inspect
from importlib.metadata import version
import json
from pathlib import Path
import tempfile
import tomllib
from types import ModuleType

import pytest
from fastapi import UploadFile
from fastapi.testclient import TestClient
from httpx2 import Response
from starlette import formparsers

import firefighter_tools_backend.adapters.calendar_conversion as adapter
import firefighter_tools_backend.routes.calendar_converter as route
import firefighter_tools_backend.services.calendar_conversion as service
from firefighter_tools_backend import create_app
from firefighter_tools_backend.domain.upload import ValidatedUpload

PROJECT_ROOT = Path(__file__).parents[2]
ENDPOINT = "/api/v1/tools/calendar-converter/convert"
CSV_HEADER = (
    "id,summary,all_date,start_date,start_time,end_date,end_time,"
    "location,description\n"
)


@pytest.fixture
def client() -> Generator[TestClient]:
    with TestClient(create_app()) as test_client:
        yield test_client


def _imported_modules(module: ModuleType) -> set[str]:
    syntax_tree = ast.parse(inspect.getsource(module))
    imported: set[str] = set()
    for node in ast.walk(syntax_tree):
        if isinstance(node, ast.Import):
            imported.update(alias.name for alias in node.names)
        elif isinstance(node, ast.ImportFrom) and node.module is not None:
            imported.add(node.module)
    return imported


def _post_csv(client: TestClient, rows: str) -> Response:
    return client.post(
        ENDPOINT,
        files={
            "file": (
                "schedule.csv",
                (CSV_HEADER + rows).encode(),
                "text/csv",
            )
        },
    )


def _repository_calendar_files() -> set[Path]:
    excluded_parts = {".git", ".venv", "node_modules", "dist"}
    return {
        path.relative_to(PROJECT_ROOT)
        for path in PROJECT_ROOT.rglob("*.ics")
        if not excluded_parts.intersection(path.relative_to(PROJECT_ROOT).parts)
    }


def test_route_reaches_typed_converter_api_without_cli_or_subprocess() -> None:
    for module in (route, service, adapter):
        imported = _imported_modules(module)
        assert "subprocess" not in imported
        assert "calendar_conversion.application" not in imported

    assert adapter.library_convert_schedule.__module__ == (
        "calendar_conversion.service"
    )


def test_backend_declares_tagged_v020_api_dependency() -> None:
    configuration = tomllib.loads(
        (PROJECT_ROOT / "backend" / "pyproject.toml").read_text()
    )
    dependencies = configuration["project"]["dependencies"]

    assert (
        "calendar-conversion @ "
        "git+https://github.com/PaoloRos/calendar-conversion.git@v0.2.0"
    ) in dependencies
    assert version("calendar-conversion") == "0.2.0"


def test_partial_response_ics_contains_only_valid_events(
    client: TestClient,
) -> None:
    response = _post_csv(
        client,
        "valid,Valid event,true,2026-07-23,,2026-07-23,,,\n"
        "invalid,Invalid event,false,2026-07-23,11:00,"
        "2026-07-23,10:00,,\n",
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "partial"
    assert payload["invalid_events"][0]["id"] == "invalid"
    ics_text = payload["calendar"]["ics_text"]
    assert "UID:valid" in ics_text
    assert "SUMMARY:Valid event" in ics_text
    assert "UID:invalid" not in ics_text
    assert "SUMMARY:Invalid event" not in ics_text


def test_all_invalid_response_has_no_empty_calendar(client: TestClient) -> None:
    response = _post_csv(
        client,
        "invalid,Invalid event,false,2026-07-23,11:00,"
        "2026-07-23,10:00,,\n",
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "failure"
    assert payload["converted_count"] == 0
    assert payload["skipped_count"] == 1
    assert payload["calendar"] is None


def test_responses_expose_no_traceback_or_local_path(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    private_detail = (
        "Traceback (most recent call last): "
        f'File "{PROJECT_ROOT}/private_converter.py", line 1'
    )

    def fail_with_private_detail(*args: object, **kwargs: object) -> None:
        raise RuntimeError(private_detail)

    monkeypatch.setattr(
        route.calendar_conversion,
        "convert_calendar",
        fail_with_private_detail,
    )

    unexpected = _post_csv(
        client,
        "event-1,Exercise,true,2026-07-23,,2026-07-23,,,\n",
    )
    unsupported = client.post(
        ENDPOINT,
        files={"file": ("schedule.txt", b"contents", "text/plain")},
    )

    assert unexpected.status_code == 500
    assert unexpected.json() == {
        "code": "internal_error",
        "message": "The request could not be processed.",
    }
    assert unsupported.status_code == 415
    for response in (unexpected, unsupported):
        serialized = json.dumps(response.json())
        assert "traceback" not in serialized.casefold()
        assert str(PROJECT_ROOT) not in serialized
        assert "/Users/" not in serialized


def test_request_leaves_no_upload_or_generated_calendar_file(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    calendars_before = _repository_calendar_files()
    captured_uploads: list[UploadFile] = []
    original_validate_upload = route.validate_upload

    async def capture_upload(upload: UploadFile) -> ValidatedUpload:
        captured_uploads.append(upload)
        return await original_validate_upload(upload)

    monkeypatch.setattr(route, "validate_upload", capture_upload)
    monkeypatch.setattr(formparsers.MultiPartParser, "spool_max_size", 1)
    monkeypatch.setattr(tempfile, "tempdir", str(tmp_path))

    response = _post_csv(
        client,
        "event-1,Exercise,true,2026-07-23,,2026-07-23,,,"
        "retention-boundary-marker\n",
    )

    assert response.status_code == 200
    assert len(captured_uploads) == 1
    uploaded_file = captured_uploads[0].file
    assert getattr(uploaded_file, "_rolled", False)
    assert uploaded_file.closed
    assert list(tmp_path.iterdir()) == []
    assert _repository_calendar_files() == calendars_before
