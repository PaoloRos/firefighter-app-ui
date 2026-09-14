"""Local persistence: engine, session factory, and schema creation."""

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


def init_db() -> None:
    """Create every table declared on ``Base`` if it does not exist yet."""
    Base.metadata.create_all(engine)


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
