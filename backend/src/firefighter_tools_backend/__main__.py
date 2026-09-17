"""Run the backend on the loopback interface or manage local accounts."""

import argparse
import getpass
import sys
from pathlib import Path

from firefighter_tools_backend.adapters import user_repository
from firefighter_tools_backend.db import create_session, init_db
from firefighter_tools_backend.domain.user import Role
from firefighter_tools_backend.server import PORT, run
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
    parser.add_argument(
        "--port",
        type=int,
        default=PORT,
        help=f"Listen on this loopback port (default: {PORT}).",
    )
    subcommands = parser.add_subparsers(dest="command")

    create_user = subcommands.add_parser(
        "create-user",
        help="Create a local application account.",
    )
    create_user.add_argument("--username", required=True)
    _add_password_stdin_argument(create_user)
    create_user.add_argument(
        "--role",
        choices=[role.value for role in Role],
        default=Role.USER.value,
    )
    for field in _PROFILE_ARGUMENTS:
        create_user.add_argument(f"--{field}")

    subcommands.add_parser(
        "list-users",
        help="List local accounts and roles without password hashes.",
    )

    set_password = subcommands.add_parser(
        "set-password",
        help="Replace the password of an existing local account.",
    )
    set_password.add_argument("--username", required=True)
    _add_password_stdin_argument(set_password)

    delete_user = subcommands.add_parser(
        "delete-user",
        help="Delete a local application account.",
    )
    delete_user.add_argument("--username", required=True)

    return parser


def _add_password_stdin_argument(subcommand: argparse.ArgumentParser) -> None:
    subcommand.add_argument(
        "--password-stdin",
        action="store_true",
        help="Read the password from the first line of standard input "
        "instead of prompting.",
    )


def _read_new_password(arguments: argparse.Namespace) -> str | None:
    # getpass reads from the controlling terminal whenever one exists, even
    # when stdin is a pipe, so scripts must opt into stdin explicitly.
    if getattr(arguments, "password_stdin", False):
        password = sys.stdin.readline().rstrip("\r\n")
        if not password:
            print("A password is required.", file=sys.stderr)
            return None
        return password
    return _prompt_new_password()


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
    password = _read_new_password(arguments)
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


def _list_users() -> int:
    init_db()
    session = create_session()
    try:
        users = user_repository.list_all(session)
    finally:
        session.close()

    if not users:
        print("No accounts found.")
        return 0

    for user in users:
        profile = ", ".join(
            f"{field}={getattr(user, field)}"
            for field in _PROFILE_ARGUMENTS
            if getattr(user, field)
        )
        details = f" ({profile})" if profile else ""
        print(f"{user.username}\t{user.role.value}{details}")
    return 0


def _set_password(arguments: argparse.Namespace) -> int:
    password = _read_new_password(arguments)
    if password is None:
        return 2

    init_db()
    session = create_session()
    try:
        changed = auth.set_password(session, arguments.username, password)
    finally:
        session.close()

    if not changed:
        print(
            f"User {arguments.username!r} does not exist.",
            file=sys.stderr,
        )
        return 1

    print(f"Updated the password for {arguments.username!r}.")
    return 0


def _delete_user(arguments: argparse.Namespace) -> int:
    init_db()
    session = create_session()
    try:
        deleted = user_repository.delete(session, arguments.username)
    finally:
        session.close()

    if not deleted:
        print(
            f"User {arguments.username!r} does not exist.",
            file=sys.stderr,
        )
        return 1

    print(f"Deleted account {arguments.username!r}.")
    return 0


def main() -> None:
    """Dispatch to a management subcommand or start the local server."""
    arguments = _build_parser().parse_args()
    if arguments.command == "create-user":
        raise SystemExit(_create_user(arguments))
    if arguments.command == "list-users":
        raise SystemExit(_list_users())
    if arguments.command == "set-password":
        raise SystemExit(_set_password(arguments))
    if arguments.command == "delete-user":
        raise SystemExit(_delete_user(arguments))
    run(frontend_dist=arguments.frontend_dist, port=arguments.port)


if __name__ == "__main__":
    main()
