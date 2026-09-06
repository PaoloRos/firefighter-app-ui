"""Local persistence: engine, session factory, and schema creation."""

from firefighter_tools_backend.db.engine import (
    SessionLocal,
    create_session,
    engine,
)
from firefighter_tools_backend.db.models import Base, UserRecord


def init_db() -> None:
    """Create every table declared on ``Base`` if it does not exist yet."""
    Base.metadata.create_all(engine)


__all__ = [
    "Base",
    "SessionLocal",
    "UserRecord",
    "create_session",
    "engine",
    "init_db",
]
