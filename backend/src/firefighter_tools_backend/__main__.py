"""Run the backend on the loopback interface or manage local accounts."""

import argparse
import getpass
import sys
from pathlib import Path

from firefighter_tools_backend.adapters import user_repository
from firefighter_tools_backend.db import create_session, init_db
from firefighter_tools_backend.domain.user import Role
from firefighter_tools_backend.server import run
from firefighter_tools_backend.services import auth

_PROFILE_ARGUMENTS = ("name", "surname", "rank", "zug", "gruppe")


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="firefighter_tools_backend",
        description="Run Feuerwehr Tools locally or manage local accounts.",
    )
    parser.add_argument(
        "--frontend-dist",
        type=Path,
        help="Serve a built Vite frontend from this directory.",
    )
    subcommands = parser.add_subparsers(dest="command")

    create_user = subcommands.add_parser(
        "create-user",
        help="Create a local application account.",
    )
    create_user.add_argument("--username", required=True)
    create_user.add_argument(
        "--role",
        choices=[role.value for role in Role],
        default=Role.USER.value,
    )
    for field in _PROFILE_ARGUMENTS:
        create_user.add_argument(f"--{field}")

    return parser


def _prompt_new_password() -> str | None:
    password = getpass.getpass("Password: ")
    if not password:
        print("A password is required.", file=sys.stderr)
        return None
    if password != getpass.getpass("Confirm password: "):
        print("Passwords did not match.", file=sys.stderr)
        return None
    return password


def _create_user(arguments: argparse.Namespace) -> int:
    password = _prompt_new_password()
    if password is None:
        return 2

    init_db()
    session = create_session()
    try:
        if user_repository.get_auth_record(session, arguments.username):
            print(
                f"User {arguments.username!r} already exists.",
                file=sys.stderr,
            )
            return 1
        profile = {
            field: getattr(arguments, field) for field in _PROFILE_ARGUMENTS
        }
        user = auth.create_user(
            session,
            username=arguments.username,
            password=password,
            role=Role(arguments.role),
            profile=profile,
        )
    finally:
        session.close()

    print(f"Created {user.role.value} account {user.username!r}.")
    return 0


def main() -> None:
    """Dispatch to a management subcommand or start the local server."""
    arguments = _build_parser().parse_args()
    if arguments.command == "create-user":
        raise SystemExit(_create_user(arguments))
    run(frontend_dist=arguments.frontend_dist)


if __name__ == "__main__":
    main()
