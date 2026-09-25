"""Backend-domain data and errors for application accounts."""

import re
from dataclasses import dataclass
from enum import StrEnum

# Personnel numbers are matched against the participant ids in a schedule and
# may name a downloaded calendar file, so they exclude separators and any
# character with a meaning in a path.
PERSONNEL_NUMBER_PATTERN = re.compile(r"[A-Za-z0-9._-]{1,50}")


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


class PersonnelNumberErrorCode(StrEnum):
    """Why a personnel number cannot be assigned to an account."""

    INVALID = "invalid_personnel_number"
    TAKEN = "personnel_number_taken"


class PersonnelNumberError(ValueError):
    """Typed failure when assigning a personnel number."""

    def __init__(self, code: PersonnelNumberErrorCode) -> None:
        self.code = code
        super().__init__(code.value)


def parse_personnel_number(value: str) -> str:
    """Return the stripped personnel number or raise ``PersonnelNumberError``."""
    personnel_number = value.strip()
    if not PERSONNEL_NUMBER_PATTERN.fullmatch(personnel_number):
        raise PersonnelNumberError(PersonnelNumberErrorCode.INVALID)
    return personnel_number


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
    personnel_number: str | None = None


@dataclass(frozen=True, slots=True)
class AuthRecord:
    """A user paired with its stored password hash for verification only."""

    user: User
    password_hash: str
