"""Backend-domain data and errors for uploaded schedule files."""

from dataclasses import dataclass
from enum import StrEnum
from io import BytesIO


class UploadValidationErrorCode(StrEnum):
    """Stable backend code for an invalid or unreadable upload."""

    MISSING_FILENAME = "missing_filename"
    UNSUPPORTED_FILE_TYPE = "unsupported_file_type"
    OVERSIZED_UPLOAD = "oversized_upload"
    INPUT_READ_ERROR = "input_read_error"


class UploadValidationError(Exception):
    """Typed upload failure for later translation by the HTTP layer."""

    def __init__(self, code: UploadValidationErrorCode) -> None:
        self.code = code
        super().__init__(code.value)


@dataclass(frozen=True, slots=True)
class ValidatedUpload:
    """Sanitized upload held only in memory for downstream conversion."""

    filename: str
    source: BytesIO
    size: int
