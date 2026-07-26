"""HTTP endpoints for converting schedules and downloading the example."""

from pathlib import Path, PurePath

from fastapi import APIRouter, File, UploadFile, status
from fastapi.responses import FileResponse, JSONResponse

from firefighter_tools_backend.domain.calendar_conversion import (
    ConversionError,
    ConversionErrorCode,
    ConversionResult,
)
from firefighter_tools_backend.domain.upload import (
    UploadValidationError,
    UploadValidationErrorCode,
)
from firefighter_tools_backend.models.calendar_conversion import (
    Calendar,
    ConversionResponse,
    ConversionStatus,
    FatalErrorCode,
    FatalErrorResponse,
    InvalidEvent,
    SourcePosition,
)
from firefighter_tools_backend.services import calendar_conversion
from firefighter_tools_backend.services.upload_validation import validate_upload

router = APIRouter(prefix="/tools/calendar-converter", tags=["calendar converter"])

_SAMPLE_SCHEDULE_PATH = (
    Path(__file__).parents[4]
    / "assets"
    / "examples"
    / "calendar_schedule_example.xlsx"
)
_SAMPLE_SCHEDULE_MEDIA_TYPE = (
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
)

_UPLOAD_ERRORS = {
    UploadValidationErrorCode.MISSING_FILENAME: (
        status.HTTP_422_UNPROCESSABLE_CONTENT,
        FatalErrorCode.MISSING_FILENAME,
        "A filename is required.",
    ),
    UploadValidationErrorCode.UNSUPPORTED_FILE_TYPE: (
        status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
        FatalErrorCode.UNSUPPORTED_FILE_TYPE,
        "Only CSV and XLSX files are supported.",
    ),
    UploadValidationErrorCode.OVERSIZED_UPLOAD: (
        status.HTTP_413_CONTENT_TOO_LARGE,
        FatalErrorCode.OVERSIZED_UPLOAD,
        "The uploaded file exceeds the 10 MiB limit.",
    ),
    UploadValidationErrorCode.INPUT_READ_ERROR: (
        status.HTTP_422_UNPROCESSABLE_CONTENT,
        FatalErrorCode.INPUT_READ_ERROR,
        "The uploaded file could not be read.",
    ),
}

_CONVERSION_ERRORS = {
    ConversionErrorCode.UNSUPPORTED_FILE_TYPE: (
        status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
        FatalErrorCode.UNSUPPORTED_FILE_TYPE,
        "Only CSV and XLSX files are supported.",
    ),
    ConversionErrorCode.MALFORMED_CSV: (
        status.HTTP_422_UNPROCESSABLE_CONTENT,
        FatalErrorCode.MALFORMED_CSV,
        "The CSV schedule is malformed.",
    ),
    ConversionErrorCode.MALFORMED_XLSX: (
        status.HTTP_422_UNPROCESSABLE_CONTENT,
        FatalErrorCode.MALFORMED_XLSX,
        "The XLSX schedule is malformed.",
    ),
    ConversionErrorCode.INPUT_READ_ERROR: (
        status.HTTP_422_UNPROCESSABLE_CONTENT,
        FatalErrorCode.INPUT_READ_ERROR,
        "The uploaded file could not be read.",
    ),
}


@router.get(
    "/example",
    response_class=FileResponse,
)
def download_example_schedule() -> FileResponse:
    """Download the version-controlled example schedule without copying it."""
    return FileResponse(
        _SAMPLE_SCHEDULE_PATH,
        media_type=_SAMPLE_SCHEDULE_MEDIA_TYPE,
        filename=_SAMPLE_SCHEDULE_PATH.name,
    )


@router.post(
    "/convert",
    response_model=ConversionResponse,
    responses={
        413: {"model": FatalErrorResponse},
        415: {"model": FatalErrorResponse},
        422: {"model": FatalErrorResponse},
        500: {"model": FatalErrorResponse},
    },
)
async def convert_calendar_upload(
    file: UploadFile | None = File(default=None),
) -> ConversionResponse | JSONResponse:
    """Validate one upload, convert it, and expose only declared responses."""
    if file is None:
        return _fatal_response(
            *_UPLOAD_ERRORS[UploadValidationErrorCode.MISSING_FILENAME]
        )

    try:
        upload = await validate_upload(file)
        result = calendar_conversion.convert_calendar(
            upload.source,
            filename=upload.filename,
        )
        return _conversion_response(result, source_filename=upload.filename)
    except UploadValidationError as error:
        return _fatal_response(*_UPLOAD_ERRORS[error.code])
    except ConversionError as error:
        return _fatal_response(*_CONVERSION_ERRORS[error.code])
    except Exception:
        return _fatal_response(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            FatalErrorCode.INTERNAL_ERROR,
            "The request could not be processed.",
        )


def _conversion_response(
    result: ConversionResult,
    *,
    source_filename: str,
) -> ConversionResponse:
    if result.converted_count == 0:
        conversion_status = ConversionStatus.FAILURE
        calendar = None
    else:
        conversion_status = (
            ConversionStatus.PARTIAL
            if result.skipped_count
            else ConversionStatus.SUCCESS
        )
        calendar = Calendar(
            filename=f"{PurePath(source_filename).stem}.ics",
            ics_text=result.ics_text,
        )

    return ConversionResponse(
        status=conversion_status,
        total_count=result.total_count,
        converted_count=result.converted_count,
        skipped_count=result.skipped_count,
        invalid_events=[
            InvalidEvent(
                source_position=SourcePosition(
                    event_index=event.source_position.event_index,
                    row=event.source_position.row,
                    worksheet=event.source_position.worksheet,
                ),
                id=event.id,
                summary=event.summary,
                issue_codes=list(event.issue_codes),
            )
            for event in result.invalid_events
        ],
        calendar=calendar,
    )


def _fatal_response(
    status_code: int,
    code: FatalErrorCode,
    message: str,
) -> JSONResponse:
    payload = FatalErrorResponse(code=code, message=message)
    return JSONResponse(
        status_code=status_code,
        content=payload.model_dump(mode="json"),
    )
