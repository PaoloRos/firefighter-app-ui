"""Public request and response contract for authentication."""

from enum import StrEnum

from pydantic import Field

from firefighter_tools_backend.domain.user import Role
from firefighter_tools_backend.models.base import ContractModel


class AuthErrorCode(StrEnum):
    """Stable frontend-facing code for an auth request-level failure."""

    INVALID_CREDENTIALS = "invalid_credentials"
    NOT_AUTHENTICATED = "not_authenticated"
    FORBIDDEN = "forbidden"


class LoginRequest(ContractModel):
    """Credentials submitted to start a session."""

    username: str = Field(min_length=1)
    password: str = Field(min_length=1)


class SessionUser(ContractModel):
    """The signed-in account as exposed to the frontend, without secrets."""

    username: str
    role: Role
    name: str | None = None
    surname: str | None = None
    rank: str | None = None
    zug: str | None = None
    gruppe: str | None = None
    personnel_number: str | None = None


class AuthErrorResponse(ContractModel):
    """Safe response body for an authentication or authorization failure."""

    code: AuthErrorCode
    message: str = Field(min_length=1)
