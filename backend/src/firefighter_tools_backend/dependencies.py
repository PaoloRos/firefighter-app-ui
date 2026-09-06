"""FastAPI dependencies for database access and session authentication."""

from collections.abc import Generator

from fastapi import Depends, Request
from sqlalchemy.orm import Session

from firefighter_tools_backend.db import create_session
from firefighter_tools_backend.domain.user import (
    AuthError,
    AuthErrorCode,
    Role,
    User,
)
from firefighter_tools_backend.services import auth

SESSION_USER_ID_KEY = "user_id"


def get_db() -> Generator[Session]:
    """Yield a request-scoped database session and always close it."""
    session = create_session()
    try:
        yield session
    finally:
        session.close()


def get_current_user(
    request: Request,
    session: Session = Depends(get_db),
) -> User:
    """Return the signed-in user or raise ``AuthError`` when unauthenticated."""
    raw_user_id = request.session.get(SESSION_USER_ID_KEY)
    if not isinstance(raw_user_id, int):
        raise AuthError(AuthErrorCode.NOT_AUTHENTICATED)

    user = auth.get_user(session, raw_user_id)
    if user is None:
        request.session.clear()
        raise AuthError(AuthErrorCode.NOT_AUTHENTICATED)
    return user


def require_super_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Return the current user only when it holds the super-user role."""
    if current_user.role is not Role.SUPER_USER:
        raise AuthError(AuthErrorCode.FORBIDDEN)
    return current_user
