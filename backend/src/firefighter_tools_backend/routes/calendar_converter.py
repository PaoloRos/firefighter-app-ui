"""HTTP endpoints for converting schedules and downloading the example."""

from pathlib import Path, PurePath

from fastapi import APIRouter, Depends, File, Query, UploadFile, status
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.orm import Session

from firefighter_tools_backend.dependencies import (
    get_current_user,
    get_db,
    require_super_user,
)
from firefighter_tools_backend.domain.calendar_conversion import (
    ConversionError,
    ConversionErrorCode,
    ConversionResult,
)
from firefighter_tools_backend.domain.schedule_store import (
    ScheduleStoreError,
    ScheduleStoreErrorCode,
    StoredSchedule,
)
from firefighter_tools_backend.domain.upload import (
    UploadValidationError,
    UploadValidationErrorCode,
)
from firefighter_tools_backend.domain.user import (
    AuthError,
    AuthErrorCode,
    Role,
    User,
)
from firefighter_tools_backend.models.auth import AuthErrorResponse
from firefighter_tools_backend.models.calendar_conversion import (
    ActiveSchedule,
    ActiveScheduleResponse,
    Calendar,
    ConversionResponse,
    ConversionScope,
    ConversionStatus,
    FatalErrorCode,
    FatalErrorResponse,
    InvalidEvent,
    SourcePosition,
)
from firefighter_tools_backend.services import calendar_conversion, schedule_store
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

_STORE_ERRORS = {
    ScheduleStoreErrorCode.NO_ACTIVE_SCHEDULE: (
        status.HTTP_409_CONFLICT,
        FatalErrorCode.NO_ACTIVE_SCHEDULE,
        "No schedule has been uploaded yet.",
    ),
    ScheduleStoreErrorCode.STORE_WRITE_ERROR: (
        status.HTTP_500_INTERNAL_SERVER_ERROR,
        FatalErrorCode.INTERNAL_ERROR,
        "The request could not be processed.",
    ),
}

_MISSING_PERSONNEL_NUMBER = (
    status.HTTP_409_CONFLICT,
    FatalErrorCode.MISSING_PERSONNEL_NUMBER,
    "This account has no personnel number.",
)


@router.get(
    "/example",
    response_class=FileResponse,
    responses={401: {"model": AuthErrorResponse}},
)
def download_example_schedule(
    _: User = Depends(get_current_user),
) -> FileResponse:
    """Download the version-controlled example schedule without copying it."""
    return FileResponse(
        _SAMPLE_SCHEDULE_PATH,
        media_type=_SAMPLE_SCHEDULE_MEDIA_TYPE,
        filename=_SAMPLE_SCHEDULE_PATH.name,
    )


@router.put(
    "/schedule",
    response_model=ActiveScheduleResponse,
    responses={
        401: {"model": AuthErrorResponse},
        403: {"model": AuthErrorResponse},
        413: {"model": FatalErrorResponse},
        415: {"model": FatalErrorResponse},
        422: {"model": FatalErrorResponse},
        500: {"model": FatalErrorResponse},
    },
)
async def replace_active_schedule(
    file: UploadFile | None = File(default=None),
    current_user: User = Depends(require_super_user),
    session: Session = Depends(get_db),
) -> ActiveScheduleResponse | JSONResponse:
    """Store one validated upload as the schedule every account converts."""
    if file is None:
        return _fatal_response(
            *_UPLOAD_ERRORS[UploadValidationErrorCode.MISSING_FILENAME]
        )

    try:
        upload = await validate_upload(file)
        schedule = schedule_store.save_active_schedule(
            session,
            upload,
            uploaded_by=current_user,
        )
        return _active_schedule_response(schedule)
    except UploadValidationError as error:
        return _fatal_response(*_UPLOAD_ERRORS[error.code])
    except ScheduleStoreError as error:
        return _fatal_response(*_STORE_ERRORS[error.code])
    except Exception:
        return _fatal_response(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            FatalErrorCode.INTERNAL_ERROR,
            "The request could not be processed.",
        )


@router.get(
    "/schedule",
    response_model=ActiveScheduleResponse,
    responses={401: {"model": AuthErrorResponse}},
)
def read_active_schedule(
    _: User = Depends(get_current_user),
    session: Session = Depends(get_db),
) -> ActiveScheduleResponse:
    """Report the stored schedule, or ``None`` when none is held yet."""
    schedule = schedule_store.find_active_schedule(session)
    if schedule is None:
        return ActiveScheduleResponse(schedule=None)
    return _active_schedule_response(schedule)


@router.post(
    "/schedule/convert",
    response_model=ConversionResponse,
    responses={
        401: {"model": AuthErrorResponse},
        403: {"model": AuthErrorResponse},
        409: {"model": FatalErrorResponse},
        415: {"model": FatalErrorResponse},
        422: {"model": FatalErrorResponse},
        500: {"model": FatalErrorResponse},
    },
)
def convert_active_schedule(
    scope: ConversionScope = Query(
        ConversionScope.PERSONAL,
        description=(
            "`personal` returns the caller's events plus the events for "
            "everyone; `full` returns the whole schedule (super-user only)."
        ),
    ),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db),
) -> ConversionResponse | JSONResponse:
    """Convert the stored schedule for the signed-in account.

    A personal conversion matches the account's personnel number against the
    schedule's ``participants`` column, so an account without a number is
    refused rather than silently given only the events for everyone.
    """
    if scope is ConversionScope.FULL:
        if current_user.role is not Role.SUPER_USER:
            raise AuthError(AuthErrorCode.FORBIDDEN)
        participant = None
    else:
        participant = current_user.personnel_number
        if participant is None:
            return _fatal_response(*_MISSING_PERSONNEL_NUMBER)

    try:
        schedule = schedule_store.load_active_schedule(session)
        with schedule_store.open_active_schedule(schedule) as source:
            result = calendar_conversion.convert_calendar(
                source,
                filename=schedule.original_filename,
                participant=participant,
            )
        return _conversion_response(
            result,
            source_filename=schedule.original_filename,
            filename_suffix=participant,
        )
    except ScheduleStoreError as error:
        return _fatal_response(*_STORE_ERRORS[error.code])
    except ConversionError as error:
        return _fatal_response(*_CONVERSION_ERRORS[error.code])
    except Exception:
        return _fatal_response(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            FatalErrorCode.INTERNAL_ERROR,
            "The request could not be processed.",
        )


@router.post(
    "/convert",
    response_model=ConversionResponse,
    responses={
        401: {"model": AuthErrorResponse},
        403: {"model": AuthErrorResponse},
        413: {"model": FatalErrorResponse},
        415: {"model": FatalErrorResponse},
        422: {"model": FatalErrorResponse},
        500: {"model": FatalErrorResponse},
    },
)
async def convert_calendar_upload(
    file: UploadFile | None = File(default=None),
    _: User = Depends(require_super_user),
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
    filename_suffix: str | None = None,
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
        # A personnel number is restricted to filename-safe characters.
        stem = PurePath(source_filename).stem
        if filename_suffix is not None:
            stem = f"{stem}-{filename_suffix}"
        calendar = Calendar(
            filename=f"{stem}.ics",
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


def _active_schedule_response(schedule: StoredSchedule) -> ActiveScheduleResponse:
    """Expose the stored schedule without its opaque on-disk filename."""
    return ActiveScheduleResponse(
        schedule=ActiveSchedule(
            filename=schedule.original_filename,
            size_bytes=schedule.size_bytes,
            uploaded_at=schedule.uploaded_at,
            uploaded_by=schedule.uploaded_by,
        )
    )
