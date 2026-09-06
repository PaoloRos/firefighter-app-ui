"""Backend-domain data and errors for application accounts."""

from dataclasses import dataclass
from enum import StrEnum


class Role(StrEnum):
    """What an authenticated account is allowed to do."""

    SUPER_USER = "super_user"
    USER = "user"


class AuthErrorCode(StrEnum):
    """Stable backend code for an authentication or authorization failure."""

    INVALID_CREDENTIALS = "invalid_credentials"
    NOT_AUTHENTICATED = "not_authenticated"
    FORBIDDEN = "forbidden"


class AuthError(Exception):
    """Typed auth failure for later translation by the HTTP layer."""

    def __init__(self, code: AuthErrorCode) -> None:
        self.code = code
        super().__init__(code.value)


@dataclass(frozen=True, slots=True)
class User:
    """An account and its firefighter profile, without any secret material."""

    id: int
    username: str
    role: Role
    name: str | None = None
    surname: str | None = None
    rank: str | None = None
    zug: str | None = None
    gruppe: str | None = None


@dataclass(frozen=True, slots=True)
class AuthRecord:
    """A user paired with its stored password hash for verification only."""

    user: User
    password_hash: str
