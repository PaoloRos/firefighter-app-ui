"""Ordered, in-memory validation for uploaded schedule files."""

from io import BytesIO
from pathlib import PurePath
from typing import Protocol

from firefighter_tools_backend.domain.upload import (
    UploadValidationError,
    UploadValidationErrorCode,
    ValidatedUpload,
)

MAX_UPLOAD_BYTES = 10 * 1024 * 1024
READ_CHUNK_BYTES = 64 * 1024
SUPPORTED_EXTENSIONS = frozenset({".csv", ".xlsx"})


class UploadedFile(Protocol):
    """Minimal asynchronous interface supplied by request upload objects."""

    filename: str | None

    async def read(self, size: int = -1) -> bytes:
        """Read at most ``size`` bytes from the upload."""

    async def close(self) -> None:
        """Release resources owned by the request upload."""


async def validate_upload(upload: UploadedFile) -> ValidatedUpload:
    """Validate one schedule upload in order and retain it only in memory."""
    try:
        filename = _require_and_sanitize_filename(upload.filename)
        if PurePath(filename).suffix.casefold() not in SUPPORTED_EXTENSIONS:
            raise UploadValidationError(
                UploadValidationErrorCode.UNSUPPORTED_FILE_TYPE
            )

        source = BytesIO()
        size = 0
        while True:
            read_size = min(READ_CHUNK_BYTES, MAX_UPLOAD_BYTES - size + 1)
            try:
                chunk = await upload.read(read_size)
            except (OSError, ValueError) as error:
                raise UploadValidationError(
                    UploadValidationErrorCode.INPUT_READ_ERROR
                ) from error

            if not isinstance(chunk, bytes):
                raise UploadValidationError(
                    UploadValidationErrorCode.INPUT_READ_ERROR
                )
            if not chunk:
                break

            size += len(chunk)
            if size > MAX_UPLOAD_BYTES:
                raise UploadValidationError(
                    UploadValidationErrorCode.OVERSIZED_UPLOAD
                )
            source.write(chunk)

        source.seek(0)
        return ValidatedUpload(filename=filename, source=source, size=size)
    finally:
        await upload.close()


def _require_and_sanitize_filename(filename: str | None) -> str:
    if filename is None or not filename.strip():
        raise UploadValidationError(
            UploadValidationErrorCode.MISSING_FILENAME
        )

    sanitized = filename.replace("\\", "/").rsplit("/", maxsplit=1)[-1]
    sanitized = sanitized.strip()
    if sanitized in {"", ".", ".."}:
        raise UploadValidationError(
            UploadValidationErrorCode.MISSING_FILENAME
        )
    return sanitized
