"""Runtime configuration resolved from the local environment."""

import os
from dataclasses import dataclass
from pathlib import Path

_REPOSITORY_ROOT = Path(__file__).resolve().parents[3]
_DEFAULT_DATABASE_PATH = _REPOSITORY_ROOT / "data" / "firefighter.db"
_DEVELOPMENT_SECRET_KEY = "development-only-insecure-session-secret"

DATABASE_URL_ENV_VAR = "FIREFIGHTER_TOOLS_DATABASE_URL"
SECRET_KEY_ENV_VAR = "FIREFIGHTER_TOOLS_SECRET_KEY"

SESSION_COOKIE_NAME = "firefighter_tools_session"
SESSION_MAX_AGE_SECONDS = 60 * 60 * 12


@dataclass(frozen=True, slots=True)
class Settings:
    """Values that differ between a developer machine and a deployment."""

    database_url: str
    secret_key: str
    session_cookie_name: str = SESSION_COOKIE_NAME
    session_max_age: int = SESSION_MAX_AGE_SECONDS

    @property
    def uses_development_secret_key(self) -> bool:
        """Report whether the process fell back to the insecure default key."""
        return self.secret_key == _DEVELOPMENT_SECRET_KEY


def load_settings() -> Settings:
    """Read settings from the environment, applying local-friendly defaults."""
    database_url = os.environ.get(DATABASE_URL_ENV_VAR) or (
        f"sqlite:///{_DEFAULT_DATABASE_PATH}"
    )
    secret_key = os.environ.get(SECRET_KEY_ENV_VAR) or _DEVELOPMENT_SECRET_KEY
    return Settings(database_url=database_url, secret_key=secret_key)


settings = load_settings()
