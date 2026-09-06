"""Shared fixtures: an isolated database and authenticated test clients."""

import os
import tempfile

os.environ.setdefault(
    "FIREFIGHTER_TOOLS_DATABASE_URL",
    f"sqlite:///{tempfile.mkdtemp(prefix='firefighter-tools-test-')}/test.db",
)
os.environ.setdefault("FIREFIGHTER_TOOLS_SECRET_KEY", "test-only-session-secret")

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

SUPER_USER = User(id=1, username="chief", role=Role.SUPER_USER, name="Chief")
PLAIN_USER = User(id=2, username="member", role=Role.USER, name="Member")


@pytest.fixture(autouse=True)
def fresh_database() -> Generator[None]:
    """Recreate every table before each test and drop it afterwards."""
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    yield
    Base.metadata.drop_all(engine)


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
