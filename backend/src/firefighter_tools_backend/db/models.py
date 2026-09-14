"""SQLAlchemy table definitions for the local user store."""

from datetime import datetime, timezone

from sqlalchemy import CheckConstraint, DateTime, Integer, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """Declarative base shared by every persisted table."""


SINGLETON_SCHEDULE_ID = 1


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


class ActiveScheduleRecord(Base):
    """The single source schedule currently published to every account.

    The table holds at most one row, pinned to ``SINGLETON_SCHEDULE_ID``. The
    row is the source of truth for the store: any file in the store directory
    that ``stored_filename`` does not name is garbage and may be purged.
    """

    __tablename__ = "active_schedule"
    __table_args__ = (
        CheckConstraint("id = 1", name="ck_active_schedule_singleton"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    stored_filename: Mapped[str] = mapped_column(String(80))
    original_filename: Mapped[str] = mapped_column(String(255))
    size_bytes: Mapped[int] = mapped_column(Integer)
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=_utcnow,
    )
    uploaded_by_user_id: Mapped[int | None] = mapped_column(Integer, default=None)
    uploaded_by_username: Mapped[str] = mapped_column(String(150))
