"""Authentication service: password hashing and credential checks."""

import base64
import hashlib
import hmac
import secrets

from sqlalchemy.orm import Session

from firefighter_tools_backend.adapters import user_repository
from firefighter_tools_backend.domain.user import (
    AuthError,
    AuthErrorCode,
    Role,
    User,
)

_SCHEME = "scrypt"
_SCRYPT_N = 2**14
_SCRYPT_R = 8
_SCRYPT_P = 1
_SALT_BYTES = 16
_KEY_BYTES = 32


def _derive(password: str, salt: bytes, *, n: int, r: int, p: int) -> bytes:
    return hashlib.scrypt(
        password.encode("utf-8"),
        salt=salt,
        n=n,
        r=r,
        p=p,
        dklen=_KEY_BYTES,
    )


def hash_password(password: str) -> str:
    """Return a self-describing scrypt hash string for storage."""
    salt = secrets.token_bytes(_SALT_BYTES)
    derived = _derive(
        password,
        salt,
        n=_SCRYPT_N,
        r=_SCRYPT_R,
        p=_SCRYPT_P,
    )
    return "$".join(
        (
            _SCHEME,
            str(_SCRYPT_N),
            str(_SCRYPT_R),
            str(_SCRYPT_P),
            base64.b64encode(salt).decode("ascii"),
            base64.b64encode(derived).decode("ascii"),
        )
    )


def verify_password(password: str, encoded: str) -> bool:
    """Check a candidate password against a stored scrypt hash string."""
    try:
        scheme, raw_n, raw_r, raw_p, raw_salt, raw_hash = encoded.split("$")
        if scheme != _SCHEME:
            return False
        n, r, p = int(raw_n), int(raw_r), int(raw_p)
        salt = base64.b64decode(raw_salt)
        expected = base64.b64decode(raw_hash)
    except (ValueError, TypeError):
        return False

    candidate = _derive(password, salt, n=n, r=r, p=p)
    return hmac.compare_digest(candidate, expected)


def authenticate(session: Session, username: str, password: str) -> User:
    """Return the user for valid credentials or raise ``AuthError``."""
    record = user_repository.get_auth_record(session, username)
    if record is None or not verify_password(password, record.password_hash):
        raise AuthError(AuthErrorCode.INVALID_CREDENTIALS)
    return record.user


def get_user(session: Session, user_id: int) -> User | None:
    """Return the account for a session identifier, if it still exists."""
    return user_repository.get_by_id(session, user_id)


def create_user(
    session: Session,
    *,
    username: str,
    password: str,
    role: Role,
    profile: dict[str, str | None] | None = None,
) -> User:
    """Hash the password and persist a new account."""
    return user_repository.add(
        session,
        username=username,
        password_hash=hash_password(password),
        role=role,
        profile=profile,
    )


def set_password(session: Session, username: str, password: str) -> bool:
    """Replace one account's password; return whether the account existed."""
    return user_repository.set_password_hash(
        session,
        username,
        hash_password(password),
    )
