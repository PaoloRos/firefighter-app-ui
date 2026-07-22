"""Behavior tests for ordered, in-memory upload validation."""

import ast
import asyncio
import inspect

import pytest

import firefighter_tools_backend.services.upload_validation as service
from firefighter_tools_backend.domain.upload import (
    UploadValidationError,
    UploadValidationErrorCode,
    ValidatedUpload,
)


class FakeUpload:
    """Small asynchronous upload double that records resource use."""

    def __init__(
        self,
        data: bytes,
        *,
        filename: str | None,
        read_error: Exception | None = None,
    ) -> None:
        self.filename = filename
        self.data = data
        self.read_error = read_error
        self.position = 0
        self.read_sizes: list[int] = []
        self.close_calls = 0

    async def read(self, size: int = -1) -> bytes:
        self.read_sizes.append(size)
        if self.read_error is not None:
            raise self.read_error
        start = self.position
        end = len(self.data) if size < 0 else start + size
        self.position = min(end, len(self.data))
        return self.data[start : self.position]

    async def close(self) -> None:
        self.close_calls += 1


def validate(upload: FakeUpload) -> ValidatedUpload:
    """Run the async service from these synchronous unit tests."""
    return asyncio.run(service.validate_upload(upload))


@pytest.mark.parametrize("filename", [None, "", "   ", "/", ".."])
def test_rejects_missing_filename_before_reading_and_always_closes(
    filename: str | None,
) -> None:
    upload = FakeUpload(b"not read", filename=filename)

    with pytest.raises(UploadValidationError) as raised:
        validate(upload)

    assert raised.value.code is UploadValidationErrorCode.MISSING_FILENAME
    assert upload.read_sizes == []
    assert upload.close_calls == 1


@pytest.mark.parametrize(
    ("filename", "expected"),
    [
        ("../../incoming/SCHEDULE.CSV", "SCHEDULE.CSV"),
        (r"C:\fakepath\schedule.xlsx", "schedule.xlsx"),
    ],
)
def test_sanitizes_directory_components_before_accepting_extension(
    filename: str,
    expected: str,
) -> None:
    upload = FakeUpload(b"schedule", filename=filename)

    result = validate(upload)

    assert result.filename == expected
    assert result.source.read() == b"schedule"
    assert result.size == 8
    assert upload.close_calls == 1


@pytest.mark.parametrize(
    "filename",
    ["schedule", "schedule.txt", "schedule.csv.exe", "archive.xlsx.zip"],
)
def test_rejects_unsupported_extension_before_reading(filename: str) -> None:
    upload = FakeUpload(b"not read", filename=filename)

    with pytest.raises(UploadValidationError) as raised:
        validate(upload)

    assert raised.value.code is UploadValidationErrorCode.UNSUPPORTED_FILE_TYPE
    assert upload.read_sizes == []
    assert upload.close_calls == 1


def test_reads_in_chunks_and_accepts_exactly_ten_mebibytes() -> None:
    data = b"x" * service.MAX_UPLOAD_BYTES
    upload = FakeUpload(data, filename="schedule.csv")

    result = validate(upload)

    assert result.size == service.MAX_UPLOAD_BYTES
    assert result.source.getvalue() == data
    assert max(upload.read_sizes) == service.READ_CHUNK_BYTES
    assert upload.read_sizes[-1] == 1
    assert upload.close_calls == 1


def test_stops_after_the_first_byte_over_the_limit() -> None:
    data = b"x" * (service.MAX_UPLOAD_BYTES + service.READ_CHUNK_BYTES)
    upload = FakeUpload(data, filename="schedule.xlsx")

    with pytest.raises(UploadValidationError) as raised:
        validate(upload)

    assert raised.value.code is UploadValidationErrorCode.OVERSIZED_UPLOAD
    assert upload.position == service.MAX_UPLOAD_BYTES + 1
    assert upload.read_sizes[-1] == 1
    assert upload.close_calls == 1


def test_translates_read_failure_and_closes_upload() -> None:
    upload = FakeUpload(
        b"contents",
        filename="schedule.csv",
        read_error=OSError("request stream failed"),
    )

    with pytest.raises(UploadValidationError) as raised:
        validate(upload)

    assert raised.value.code is UploadValidationErrorCode.INPUT_READ_ERROR
    assert upload.close_calls == 1


def test_service_has_no_persistence_or_logging_calls() -> None:
    syntax_tree = ast.parse(inspect.getsource(service))
    imported_roots: set[str] = set()
    called_names: set[str] = set()
    for node in ast.walk(syntax_tree):
        if isinstance(node, ast.Import):
            imported_roots.update(
                alias.name.partition(".")[0] for alias in node.names
            )
        elif isinstance(node, ast.ImportFrom) and node.module is not None:
            imported_roots.add(node.module.partition(".")[0])
        elif isinstance(node, ast.Call) and isinstance(node.func, ast.Name):
            called_names.add(node.func.id)

    assert "logging" not in imported_roots
    assert "open" not in called_names
