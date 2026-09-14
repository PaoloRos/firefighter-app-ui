"""Persist and read the single active schedule held for every account.

The database row is the source of truth. Any file in the store directory that
the row does not name is garbage and is purged on the next successful save, so
a crash at any point leaves the store consistent rather than ambiguous.
"""

import os
import re
from datetime import datetime, timezone
from pathlib import Path
from tempfile import NamedTemporaryFile
from typing import BinaryIO
from uuid import uuid4

from sqlalchemy.orm import Session

from firefighter_tools_backend.config import settings
from firefighter_tools_backend.db.models import (
    SINGLETON_SCHEDULE_ID,
    ActiveScheduleRecord,
)
from firefighter_tools_backend.domain.schedule_store import (
    ScheduleStoreError,
    ScheduleStoreErrorCode,
    StoredSchedule,
)
from firefighter_tools_backend.domain.upload import ValidatedUpload
from firefighter_tools_backend.domain.user import User

STORED_FILENAME_PATTERN = re.compile(r"^[0-9a-f]{32}\.(csv|xlsx)$")

_TEMPORARY_SUFFIX = ".tmp"


def store_directory() -> Path:
    """Resolve the store location on every call so tests can redirect it."""
    return settings.schedule_store_dir


def save_active_schedule(
    session: Session,
    upload: ValidatedUpload,
    *,
    uploaded_by: User,
) -> StoredSchedule:
    """Replace the active schedule with one validated upload."""
    directory = store_directory()
    directory.mkdir(parents=True, exist_ok=True)

    suffix = Path(upload.filename).suffix.casefold()
    stored_filename = f"{uuid4().hex}{suffix}"
    target = directory / stored_filename

    _write_atomically(directory, target, upload)

    try:
        record = session.get(ActiveScheduleRecord, SINGLETON_SCHEDULE_ID)
        if record is None:
            record = ActiveScheduleRecord(id=SINGLETON_SCHEDULE_ID)
            session.add(record)
        record.stored_filename = stored_filename
        record.original_filename = upload.filename
        record.size_bytes = upload.size
        record.uploaded_at = datetime.now(timezone.utc)
        record.uploaded_by_user_id = uploaded_by.id
        record.uploaded_by_username = uploaded_by.username
        session.commit()
    except Exception as error:
        session.rollback()
        target.unlink(missing_ok=True)
        raise ScheduleStoreError(ScheduleStoreErrorCode.STORE_WRITE_ERROR) from error

    _purge_orphans(directory, keep=stored_filename)
    return _to_stored_schedule(record, directory)


def find_active_schedule(session: Session) -> StoredSchedule | None:
    """Report the active schedule, dropping a row whose file disappeared."""
    record = session.get(ActiveScheduleRecord, SINGLETON_SCHEDULE_ID)
    if record is None:
        return None

    directory = store_directory()
    if not (directory / record.stored_filename).is_file():
        session.delete(record)
        session.commit()
        return None
    return _to_stored_schedule(record, directory)


def load_active_schedule(session: Session) -> StoredSchedule:
    """Return the active schedule or fail with a stable code."""
    schedule = find_active_schedule(session)
    if schedule is None:
        raise ScheduleStoreError(ScheduleStoreErrorCode.NO_ACTIVE_SCHEDULE)
    return schedule


def open_active_schedule(schedule: StoredSchedule) -> BinaryIO:
    """Open the stored file for conversion without copying it."""
    return schedule.path.open("rb")


def _write_atomically(
    directory: Path,
    target: Path,
    upload: ValidatedUpload,
) -> None:
    """Materialize the upload so a reader never observes a partial file."""
    upload.source.seek(0)
    temporary = NamedTemporaryFile(
        dir=directory,
        suffix=_TEMPORARY_SUFFIX,
        delete=False,
    )
    try:
        with temporary as handle:
            handle.write(upload.source.read())
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temporary.name, target)
    except Exception as error:
        Path(temporary.name).unlink(missing_ok=True)
        raise ScheduleStoreError(ScheduleStoreErrorCode.STORE_WRITE_ERROR) from error


def _purge_orphans(directory: Path, *, keep: str) -> None:
    """Delete every stored file the current row does not name."""
    for child in directory.iterdir():
        if child.name != keep and child.is_file():
            child.unlink(missing_ok=True)


def _to_stored_schedule(
    record: ActiveScheduleRecord,
    directory: Path,
) -> StoredSchedule:
    return StoredSchedule(
        original_filename=record.original_filename,
        path=directory / record.stored_filename,
        size_bytes=record.size_bytes,
        uploaded_at=_as_utc(record.uploaded_at),
        uploaded_by=record.uploaded_by_username,
    )


def _as_utc(moment: datetime) -> datetime:
    """Re-attach UTC, which SQLite drops when reading a stored timestamp."""
    if moment.tzinfo is None:
        return moment.replace(tzinfo=timezone.utc)
    return moment.astimezone(timezone.utc)
