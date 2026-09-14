"""Service tests for the server-held active schedule store."""

import re
from datetime import datetime, timezone
from io import BytesIO

import pytest
from sqlalchemy.orm import Session

from conftest import PLAIN_USER, SUPER_USER, schedule_csv
from firefighter_tools_backend.config import settings
from firefighter_tools_backend.db.models import (
    SINGLETON_SCHEDULE_ID,
    ActiveScheduleRecord,
)
from firefighter_tools_backend.domain.schedule_store import (
    ScheduleStoreError,
    ScheduleStoreErrorCode,
)
from firefighter_tools_backend.domain.upload import ValidatedUpload
from firefighter_tools_backend.services import schedule_store

STORED_NAME = re.compile(r"^[0-9a-f]{32}\.(csv|xlsx)$")


def upload(filename: str = "dienstplan.csv", payload: bytes | None = None) -> ValidatedUpload:
    """Build a validated upload the way the endpoint would hand one over."""
    body = schedule_csv() if payload is None else payload
    return ValidatedUpload(filename=filename, source=BytesIO(body), size=len(body))


def stored_files() -> list[str]:
    directory = schedule_store.store_directory()
    return sorted(child.name for child in directory.iterdir() if child.is_file())


def test_saves_the_upload_inside_the_configured_store_directory(
    db_session: Session,
) -> None:
    schedule = schedule_store.save_active_schedule(
        db_session, upload(), uploaded_by=SUPER_USER
    )

    assert schedule.path.parent == schedule_store.store_directory()
    assert schedule.path.read_bytes() == schedule_csv()


def test_stored_filename_is_opaque_and_keeps_the_source_extension(
    db_session: Session,
) -> None:
    schedule_store.save_active_schedule(
        db_session, upload("Dienstplan 2026.XLSX"), uploaded_by=SUPER_USER
    )

    names = stored_files()
    assert len(names) == 1
    assert STORED_NAME.match(names[0]), names[0]
    assert "Dienstplan" not in names[0]


def test_row_records_the_original_filename_and_uploader(
    db_session: Session,
) -> None:
    before = datetime.now(timezone.utc)

    schedule = schedule_store.save_active_schedule(
        db_session, upload("Dienstplan 2026.csv"), uploaded_by=SUPER_USER
    )

    assert schedule.original_filename == "Dienstplan 2026.csv"
    assert schedule.uploaded_by == SUPER_USER.username
    assert schedule.size_bytes == len(schedule_csv())
    assert schedule.uploaded_at >= before.replace(microsecond=0)

    record = db_session.get(ActiveScheduleRecord, SINGLETON_SCHEDULE_ID)
    assert record is not None
    assert record.uploaded_by_user_id == SUPER_USER.id


def test_replacing_deletes_the_previous_file_and_keeps_one_row(
    db_session: Session,
) -> None:
    first = schedule_store.save_active_schedule(
        db_session, upload("first.csv"), uploaded_by=SUPER_USER
    )
    second = schedule_store.save_active_schedule(
        db_session, upload("second.csv"), uploaded_by=PLAIN_USER
    )

    assert not first.path.exists()
    assert second.path.is_file()
    assert stored_files() == [second.path.name]
    assert db_session.query(ActiveScheduleRecord).count() == 1


def test_replacement_leaves_no_temporary_file_behind(db_session: Session) -> None:
    schedule_store.save_active_schedule(db_session, upload(), uploaded_by=SUPER_USER)

    assert [name for name in stored_files() if name.endswith(".tmp")] == []


def test_failed_commit_removes_the_newly_written_file(
    db_session: Session,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    def explode() -> None:
        raise RuntimeError("commit failed")

    monkeypatch.setattr(db_session, "commit", explode)

    with pytest.raises(ScheduleStoreError) as caught:
        schedule_store.save_active_schedule(db_session, upload(), uploaded_by=SUPER_USER)

    assert caught.value.code is ScheduleStoreErrorCode.STORE_WRITE_ERROR
    assert stored_files() == []


def test_saving_purges_files_no_row_references(db_session: Session) -> None:
    directory = schedule_store.store_directory()
    directory.mkdir(parents=True, exist_ok=True)
    (directory / "orphan.csv").write_bytes(b"stale")
    (directory / "leftover.tmp").write_bytes(b"stale")

    schedule = schedule_store.save_active_schedule(
        db_session, upload(), uploaded_by=SUPER_USER
    )

    assert stored_files() == [schedule.path.name]


def test_loading_without_a_row_reports_no_active_schedule(
    db_session: Session,
) -> None:
    assert schedule_store.find_active_schedule(db_session) is None

    with pytest.raises(ScheduleStoreError) as caught:
        schedule_store.load_active_schedule(db_session)

    assert caught.value.code is ScheduleStoreErrorCode.NO_ACTIVE_SCHEDULE


def test_row_whose_file_disappeared_is_dropped_and_reported_absent(
    db_session: Session,
) -> None:
    schedule = schedule_store.save_active_schedule(
        db_session, upload(), uploaded_by=SUPER_USER
    )
    schedule.path.unlink()

    assert schedule_store.find_active_schedule(db_session) is None
    assert db_session.get(ActiveScheduleRecord, SINGLETON_SCHEDULE_ID) is None


def test_a_traversing_filename_cannot_escape_the_store(db_session: Session) -> None:
    schedule = schedule_store.save_active_schedule(
        db_session, upload("../../escaped.csv"), uploaded_by=SUPER_USER
    )

    assert schedule.path.parent == schedule_store.store_directory()
    assert STORED_NAME.match(schedule.path.name)


def test_opening_the_active_schedule_streams_the_stored_bytes(
    db_session: Session,
) -> None:
    schedule = schedule_store.save_active_schedule(
        db_session, upload(), uploaded_by=SUPER_USER
    )

    with schedule_store.open_active_schedule(schedule) as source:
        assert source.read() == schedule_csv()


def test_the_default_store_lives_under_the_data_directory() -> None:
    from firefighter_tools_backend.config import _DEFAULT_SCHEDULE_STORE_PATH

    assert _DEFAULT_SCHEDULE_STORE_PATH.parent.name == "data"
    assert _DEFAULT_SCHEDULE_STORE_PATH.name == "schedules"
    assert settings.schedule_store_dir.is_absolute()
