"""Shared fixtures: an isolated database and authenticated test clients."""

import os
import tempfile

os.environ.setdefault(
    "FIREFIGHTER_TOOLS_DATABASE_URL",
    f"sqlite:///{tempfile.mkdtemp(prefix='firefighter-tools-test-')}/test.db",
)
os.environ.setdefault("FIREFIGHTER_TOOLS_SECRET_KEY", "test-only-session-secret")
os.environ.setdefault(
    "FIREFIGHTER_TOOLS_SCHEDULE_STORE",
    tempfile.mkdtemp(prefix="firefighter-tools-schedules-"),
)

from collections.abc import Generator  # noqa: E402

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy.orm import Session  # noqa: E402

from firefighter_tools_backend import create_app  # noqa: E402
from firefighter_tools_backend.db import (  # noqa: E402
    Base,
    SessionLocal,
    engine,
)
from firefighter_tools_backend.dependencies import get_current_user  # noqa: E402
from firefighter_tools_backend.domain.user import Role, User  # noqa: E402
from firefighter_tools_backend.services import schedule_store  # noqa: E402

SUPER_USER = User(id=1, username="chief", role=Role.SUPER_USER, name="Chief")
PLAIN_USER = User(id=2, username="member", role=Role.USER, name="Member")


@pytest.fixture(autouse=True)
def fresh_database() -> Generator[None]:
    """Recreate every table before each test and drop it afterwards."""
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    yield
    Base.metadata.drop_all(engine)


@pytest.fixture(autouse=True)
def clean_schedule_store() -> Generator[None]:
    """Empty the server-held schedule store around each test."""
    _empty_schedule_store()
    yield
    _empty_schedule_store()


def _empty_schedule_store() -> None:
    directory = schedule_store.store_directory()
    if not directory.is_dir():
        return
    for child in directory.iterdir():
        if child.is_file():
            child.unlink()


@pytest.fixture
def db_session() -> Generator[Session]:
    """A database session bound to the isolated test engine."""
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def _client_authenticated_as(user: User | None) -> Generator[TestClient]:
    app = create_app()
    if user is not None:
        app.dependency_overrides[get_current_user] = lambda: user
    try:
        with TestClient(app) as test_client:
            yield test_client
    finally:
        app.dependency_overrides.clear()


@pytest.fixture
def client() -> Generator[TestClient]:
    """Client whose session resolves to a super-user account."""
    yield from _client_authenticated_as(SUPER_USER)


@pytest.fixture
def user_client() -> Generator[TestClient]:
    """Client whose session resolves to a normal (non-super) user account."""
    yield from _client_authenticated_as(PLAIN_USER)


@pytest.fixture
def anonymous_client() -> Generator[TestClient]:
    """Client with no authenticated session; real auth dependencies run."""
    yield from _client_authenticated_as(None)


SCHEDULE_ENDPOINT = "/api/v1/tools/calendar-converter/schedule"

VALID_SCHEDULE_ROWS = (
    "id,summary,all_date,start_date,start_time,end_date,end_time,location,description",
    "uebung-1,Atemschutz,false,2026-08-03,19:00,2026-08-03,21:00,Depot,Uebung",
)


def schedule_csv(rows: tuple[str, ...] = VALID_SCHEDULE_ROWS) -> bytes:
    """Build a CSV schedule body for upload fixtures and tests."""
    return ("\n".join(rows) + "\n").encode("utf-8")


@pytest.fixture
def stored_schedule(client: TestClient) -> dict[str, object]:
    """Put a known-good schedule on the server and return its metadata."""
    response = client.put(
        SCHEDULE_ENDPOINT,
        files={"file": ("dienstplan.csv", schedule_csv(), "text/csv")},
    )
    assert response.status_code == 200, response.text
    schedule = response.json()["schedule"]
    assert isinstance(schedule, dict)
    return schedule
