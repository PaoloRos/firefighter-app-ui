"""Persistence adapter translating ``UserRecord`` rows to domain users."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from firefighter_tools_backend.db.models import UserRecord
from firefighter_tools_backend.domain.user import AuthRecord, Role, User

_PROFILE_FIELDS = ("name", "surname", "rank", "zug", "gruppe")


def _to_user(record: UserRecord) -> User:
    return User(
        id=record.id,
        username=record.username,
        role=Role(record.role),
        name=record.name,
        surname=record.surname,
        rank=record.rank,
        zug=record.zug,
        gruppe=record.gruppe,
    )


def _find_record(session: Session, username: str) -> UserRecord | None:
    return session.scalars(
        select(UserRecord).where(UserRecord.username == username)
    ).one_or_none()


def get_by_id(session: Session, user_id: int) -> User | None:
    """Return the account with this identifier, without its password hash."""
    record = session.get(UserRecord, user_id)
    return None if record is None else _to_user(record)


def get_auth_record(session: Session, username: str) -> AuthRecord | None:
    """Return the account and its stored hash for credential verification."""
    record = _find_record(session, username)
    if record is None:
        return None
    return AuthRecord(user=_to_user(record), password_hash=record.password_hash)


def list_all(session: Session) -> list[User]:
    """Return every account ordered by username, without password hashes."""
    records = session.scalars(
        select(UserRecord).order_by(UserRecord.username)
    ).all()
    return [_to_user(record) for record in records]


def add(
    session: Session,
    *,
    username: str,
    password_hash: str,
    role: Role,
    profile: dict[str, str | None] | None = None,
) -> User:
    """Insert a new account and return it as a domain user."""
    attributes = {field: None for field in _PROFILE_FIELDS}
    if profile is not None:
        attributes.update(
            {key: profile.get(key) for key in _PROFILE_FIELDS}
        )
    record = UserRecord(
        username=username,
        password_hash=password_hash,
        role=role.value,
        **attributes,
    )
    session.add(record)
    session.commit()
    return _to_user(record)


def set_password_hash(
    session: Session,
    username: str,
    password_hash: str,
) -> bool:
    """Replace the stored hash for one account; return whether it existed."""
    record = _find_record(session, username)
    if record is None:
        return False
    record.password_hash = password_hash
    session.commit()
    return True


def delete(session: Session, username: str) -> bool:
    """Remove one account; return whether a row was deleted."""
    record = _find_record(session, username)
    if record is None:
        return False
    session.delete(record)
    session.commit()
    return True
