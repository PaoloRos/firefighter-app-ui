"""HTTP endpoints for session login, logout, and identity."""

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from firefighter_tools_backend.dependencies import (
    SESSION_USER_ID_KEY,
    get_current_user,
    get_db,
)
from firefighter_tools_backend.domain.user import User
from firefighter_tools_backend.models.auth import (
    AuthErrorResponse,
    LoginRequest,
    SessionUser,
)
from firefighter_tools_backend.services import auth

router = APIRouter(prefix="/auth", tags=["authentication"])

_UNAUTHENTICATED_RESPONSE = {"model": AuthErrorResponse}


def _session_user(user: User) -> SessionUser:
    return SessionUser(
        username=user.username,
        role=user.role,
        name=user.name,
        surname=user.surname,
        rank=user.rank,
        zug=user.zug,
        gruppe=user.gruppe,
    )


@router.post(
    "/login",
    response_model=SessionUser,
    responses={401: _UNAUTHENTICATED_RESPONSE},
)
def login(
    credentials: LoginRequest,
    request: Request,
    session: Session = Depends(get_db),
) -> SessionUser:
    """Verify credentials and start a signed session cookie."""
    user = auth.authenticate(
        session,
        credentials.username,
        credentials.password,
    )
    request.session[SESSION_USER_ID_KEY] = user.id
    return _session_user(user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(request: Request) -> None:
    """Clear the current session; safe to call when already signed out."""
    request.session.clear()


@router.get(
    "/me",
    response_model=SessionUser,
    responses={401: _UNAUTHENTICATED_RESPONSE},
)
def read_current_user(
    current_user: User = Depends(get_current_user),
) -> SessionUser:
    """Return the signed-in account for the current session."""
    return _session_user(current_user)
