"""Alembic migrations: legacy upgrade, schema parity, and personnel numbers."""

from collections.abc import Generator
from pathlib import Path

import pytest
from alembic.autogenerate import compare_metadata
from alembic.migration import MigrationContext
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.engine import Engine
from sqlalchemy.exc import IntegrityError

from firefighter_tools_backend.db.models import Base
from firefighter_tools_backend.db.schema import upgrade_schema

HEAD_REVISION = "0002_personnel_number"

# The exact DDL ``Base.metadata.create_all`` emitted before migrations existed,
# which is what every pre-Alembic ``data/firefighter.db`` contains.
_LEGACY_CREATE_ALL_DDL = (
    """
    CREATE TABLE users (
        id INTEGER NOT NULL,
        username VARCHAR(150) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL,
        name VARCHAR(150),
        surname VARCHAR(150),
        rank VARCHAR(100),
        zug VARCHAR(100),
        gruppe VARCHAR(100),
        created_at DATETIME NOT NULL,
        PRIMARY KEY (id)
    )
    """,
    "CREATE UNIQUE INDEX ix_users_username ON users (username)",
    """
    CREATE TABLE active_schedule (
        id INTEGER NOT NULL,
        stored_filename VARCHAR(80) NOT NULL,
        original_filename VARCHAR(255) NOT NULL,
        size_bytes INTEGER NOT NULL,
        uploaded_at DATETIME NOT NULL,
        uploaded_by_user_id INTEGER,
        uploaded_by_username VARCHAR(150) NOT NULL,
        PRIMARY KEY (id),
        CONSTRAINT ck_active_schedule_singleton CHECK (id = 1)
    )
    """,
)


@pytest.fixture
def scratch_engine(tmp_path: Path) -> Generator[Engine]:
    """An engine on its own database file, independent of the test database."""
    engine = create_engine(f"sqlite:///{tmp_path / 'scratch.db'}")
    try:
        yield engine
    finally:
        engine.dispose()


def _revision(engine: Engine) -> str:
    with engine.connect() as connection:
        return connection.execute(
            text("SELECT version_num FROM alembic_version")
        ).scalar_one()


def _insert_user(engine: Engine, username: str, **columns: object) -> None:
    values = {
        "username": username,
        "password_hash": "scrypt$stub",
        "role": "user",
        "created_at": "2026-09-01 10:00:00",
        **columns,
    }
    names = ", ".join(values)
    placeholders = ", ".join(f":{name}" for name in values)
    with engine.begin() as connection:
        connection.execute(
            text(f"INSERT INTO users ({names}) VALUES ({placeholders})"),
            values,
        )


def test_upgrades_a_legacy_create_all_database_and_keeps_its_rows(
    scratch_engine: Engine,
) -> None:
    with scratch_engine.begin() as connection:
        for statement in _LEGACY_CREATE_ALL_DDL:
            connection.execute(text(statement))
    _insert_user(scratch_engine, "chief", role="super_user", zug="1")

    upgrade_schema(scratch_engine)

    assert _revision(scratch_engine) == HEAD_REVISION
    with scratch_engine.connect() as connection:
        rows = connection.execute(
            text("SELECT username, role, zug, personnel_number FROM users")
        ).all()
    assert rows == [("chief", "super_user", "1", None)]


def test_migrates_an_empty_database_to_exactly_the_model_schema(
    scratch_engine: Engine,
) -> None:
    upgrade_schema(scratch_engine)

    assert _revision(scratch_engine) == HEAD_REVISION
    with scratch_engine.connect() as connection:
        differences = compare_metadata(
            MigrationContext.configure(connection),
            Base.metadata,
        )
    assert differences == []


def test_upgrading_an_up_to_date_database_changes_nothing(
    scratch_engine: Engine,
) -> None:
    upgrade_schema(scratch_engine)
    _insert_user(scratch_engine, "member", personnel_number="204")

    upgrade_schema(scratch_engine)

    assert _revision(scratch_engine) == HEAD_REVISION
    with scratch_engine.connect() as connection:
        count = connection.execute(text("SELECT COUNT(*) FROM users")).scalar()
    assert count == 1


def test_personnel_number_is_unique_but_optional(
    scratch_engine: Engine,
) -> None:
    upgrade_schema(scratch_engine)
    _insert_user(scratch_engine, "chief")
    _insert_user(scratch_engine, "member")
    _insert_user(scratch_engine, "driver", personnel_number="101")

    with pytest.raises(IntegrityError):
        _insert_user(scratch_engine, "cook", personnel_number="101")

    indexes = {
        index["name"]: index["unique"]
        for index in inspect(scratch_engine).get_indexes("users")
    }
    assert indexes["ix_users_personnel_number"]
