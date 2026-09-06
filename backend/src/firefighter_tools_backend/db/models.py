"""SQLAlchemy table definitions for the local user store."""

from datetime import datetime, timezone

from sqlalchemy import DateTime, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """Declarative base shared by every persisted table."""


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class UserRecord(Base):
    """One application account and its firefighter profile attributes."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(150), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(20))
    name: Mapped[str | None] = mapped_column(String(150), default=None)
    surname: Mapped[str | None] = mapped_column(String(150), default=None)
    rank: Mapped[str | None] = mapped_column(String(100), default=None)
    zug: Mapped[str | None] = mapped_column(String(100), default=None)
    gruppe: Mapped[str | None] = mapped_column(String(100), default=None)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=_utcnow,
    )
