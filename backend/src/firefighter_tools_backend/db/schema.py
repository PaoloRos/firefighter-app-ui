"""Bring a database to the latest schema through the Alembic migrations."""

from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import inspect
from sqlalchemy.engine import Connection, Engine

MIGRATIONS_DIRECTORY = Path(__file__).with_name("migrations")
BASELINE_REVISION = "0001_baseline"


def upgrade_schema(bind: Engine) -> None:
    """Apply every pending migration to the database behind ``bind``.

    A database created by ``Base.metadata.create_all`` before migrations
    existed has the baseline tables but no ``alembic_version`` table. It is
    stamped at the baseline first, so upgrading keeps its rows instead of
    trying to create the tables again.
    """
    with bind.begin() as connection:
        config = _alembic_config(connection)
        if _is_unversioned_legacy_database(connection):
            command.stamp(config, BASELINE_REVISION)
        command.upgrade(config, "head")


def _alembic_config(connection: Connection) -> Config:
    config = Config()
    config.set_main_option("script_location", str(MIGRATIONS_DIRECTORY))
    config.attributes["connection"] = connection
    return config


def _is_unversioned_legacy_database(connection: Connection) -> bool:
    inspector = inspect(connection)
    return inspector.has_table("users") and not inspector.has_table(
        "alembic_version"
    )
