"""Local persistence: engine, session factory, and schema migrations."""

from firefighter_tools_backend.db.engine import (
    SessionLocal,
    create_session,
    engine,
)
from firefighter_tools_backend.db.models import (
    SINGLETON_SCHEDULE_ID,
    ActiveScheduleRecord,
    Base,
    UserRecord,
)
from firefighter_tools_backend.db.schema import upgrade_schema


def init_db() -> None:
    """Migrate the configured database to the latest schema revision."""
    upgrade_schema(engine)


__all__ = [
    "SINGLETON_SCHEDULE_ID",
    "ActiveScheduleRecord",
    "Base",
    "SessionLocal",
    "UserRecord",
    "create_session",
    "engine",
    "init_db",
]
