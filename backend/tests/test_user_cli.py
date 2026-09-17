"""Tests for the account-management subcommands."""

import argparse
import io

import pytest
from sqlalchemy import select
from sqlalchemy.orm import Session

import firefighter_tools_backend.__main__ as cli
from firefighter_tools_backend.db.models import UserRecord
from firefighter_tools_backend.domain.user import AuthError, Role
from firefighter_tools_backend.services import auth


def _run_create_user(
    monkeypatch: pytest.MonkeyPatch,
    *,
    username: str = "chief",
    role: str = Role.SUPER_USER.value,
    passwords: list[str],
) -> int:
    entered = iter(passwords)
    monkeypatch.setattr(cli.getpass, "getpass", lambda _prompt="": next(entered))
    arguments = argparse.Namespace(
        command="create-user",
        username=username,
        role=role,
        name="Chief",
        surname=None,
        rank=None,
        zug="1",
        gruppe=None,
    )
    return cli._create_user(arguments)


def test_create_user_persists_a_hashed_super_user(
    monkeypatch: pytest.MonkeyPatch,
    db_session: Session,
) -> None:
    exit_code = _run_create_user(
        monkeypatch,
        passwords=["s3cret-pass", "s3cret-pass"],
    )

    assert exit_code == 0
    record = db_session.scalars(select(UserRecord)).one()
    assert record.username == "chief"
    assert record.role == "super_user"
    assert record.name == "Chief"
    assert record.zug == "1"
    assert record.password_hash.startswith("scrypt$")
    assert "s3cret-pass" not in record.password_hash


def test_server_port_defaults_to_8000_and_accepts_an_override(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    calls: list[dict[str, object]] = []
    monkeypatch.setattr(cli, "run", lambda **kwargs: calls.append(kwargs))

    monkeypatch.setattr(cli.sys, "argv", ["firefighter_tools_backend"])
    cli.main()
    monkeypatch.setattr(
        cli.sys, "argv", ["firefighter_tools_backend", "--port", "8765"]
    )
    cli.main()

    assert calls == [
        {"frontend_dist": None, "port": 8000},
        {"frontend_dist": None, "port": 8765},
    ]


def test_create_user_rejects_mismatched_confirmation(
    monkeypatch: pytest.MonkeyPatch,
    db_session: Session,
) -> None:
    exit_code = _run_create_user(
        monkeypatch,
        passwords=["one-value", "other-value"],
    )

    assert exit_code == 2
    assert db_session.scalars(select(UserRecord)).all() == []


def test_create_user_refuses_a_duplicate_username(
    monkeypatch: pytest.MonkeyPatch,
    db_session: Session,
) -> None:
    assert _run_create_user(monkeypatch, passwords=["pw-one", "pw-one"]) == 0
    assert _run_create_user(monkeypatch, passwords=["pw-two", "pw-two"]) == 1
    assert len(db_session.scalars(select(UserRecord)).all()) == 1


def _seed_account(
    monkeypatch: pytest.MonkeyPatch,
    *,
    username: str,
    role: str = Role.USER.value,
    password: str = "start-pass",
) -> None:
    assert (
        _run_create_user(
            monkeypatch,
            username=username,
            role=role,
            passwords=[password, password],
        )
        == 0
    )


def _run_set_password(
    monkeypatch: pytest.MonkeyPatch,
    *,
    username: str,
    passwords: list[str],
) -> int:
    entered = iter(passwords)
    monkeypatch.setattr(cli.getpass, "getpass", lambda _prompt="": next(entered))
    return cli._set_password(
        argparse.Namespace(command="set-password", username=username)
    )


def test_create_user_reads_the_password_from_stdin_without_prompting(
    monkeypatch: pytest.MonkeyPatch,
    db_session: Session,
) -> None:
    def fail_prompt(_prompt: str = "") -> str:
        raise AssertionError("--password-stdin must not prompt")

    monkeypatch.setattr(cli.getpass, "getpass", fail_prompt)
    monkeypatch.setattr(cli.sys, "stdin", io.StringIO("piped-pass\n"))
    arguments = argparse.Namespace(
        command="create-user",
        username="chief",
        role=Role.SUPER_USER.value,
        password_stdin=True,
        name=None,
        surname=None,
        rank=None,
        zug=None,
        gruppe=None,
    )

    assert cli._create_user(arguments) == 0
    assert auth.authenticate(db_session, "chief", "piped-pass").username == "chief"


def test_create_user_rejects_an_empty_stdin_password(
    monkeypatch: pytest.MonkeyPatch,
    db_session: Session,
) -> None:
    monkeypatch.setattr(cli.sys, "stdin", io.StringIO(""))
    arguments = argparse.Namespace(
        command="create-user",
        username="chief",
        role=Role.USER.value,
        password_stdin=True,
        name=None,
        surname=None,
        rank=None,
        zug=None,
        gruppe=None,
    )

    assert cli._create_user(arguments) == 2
    assert db_session.scalars(select(UserRecord)).first() is None


def test_list_users_prints_accounts_and_roles_without_hashes(
    monkeypatch: pytest.MonkeyPatch,
    db_session: Session,
    capsys: pytest.CaptureFixture[str],
) -> None:
    _seed_account(
        monkeypatch, username="chief", role=Role.SUPER_USER.value
    )
    _seed_account(monkeypatch, username="member", role=Role.USER.value)
    capsys.readouterr()

    exit_code = cli._list_users()

    assert exit_code == 0
    output = capsys.readouterr().out
    assert "chief\tsuper_user" in output
    assert "member\tuser" in output
    assert "scrypt" not in output
    for record in db_session.scalars(select(UserRecord)).all():
        assert record.password_hash not in output


def test_list_users_reports_an_empty_database(
    capsys: pytest.CaptureFixture[str],
) -> None:
    exit_code = cli._list_users()

    assert exit_code == 0
    assert capsys.readouterr().out.strip() == "No accounts found."


def test_set_password_replaces_the_stored_credential(
    monkeypatch: pytest.MonkeyPatch,
    db_session: Session,
) -> None:
    _seed_account(monkeypatch, username="member", password="old-pass")

    exit_code = _run_set_password(
        monkeypatch,
        username="member",
        passwords=["new-pass", "new-pass"],
    )

    assert exit_code == 0
    assert auth.authenticate(db_session, "member", "new-pass").username == "member"
    with pytest.raises(AuthError):
        auth.authenticate(db_session, "member", "old-pass")


def test_set_password_rejects_an_unknown_account(
    monkeypatch: pytest.MonkeyPatch,
    db_session: Session,
) -> None:
    exit_code = _run_set_password(
        monkeypatch,
        username="ghost",
        passwords=["whatever", "whatever"],
    )

    assert exit_code == 1


def test_set_password_rejects_mismatched_confirmation(
    monkeypatch: pytest.MonkeyPatch,
    db_session: Session,
) -> None:
    _seed_account(monkeypatch, username="member", password="old-pass")

    exit_code = _run_set_password(
        monkeypatch,
        username="member",
        passwords=["one-value", "other-value"],
    )

    assert exit_code == 2
    assert auth.authenticate(db_session, "member", "old-pass").username == "member"


def test_delete_user_removes_an_existing_account(
    monkeypatch: pytest.MonkeyPatch,
    db_session: Session,
) -> None:
    _seed_account(monkeypatch, username="member", password="pass")

    exit_code = cli._delete_user(
        argparse.Namespace(command="delete-user", username="member")
    )

    assert exit_code == 0
    assert db_session.scalars(select(UserRecord)).all() == []
    with pytest.raises(AuthError):
        auth.authenticate(db_session, "member", "pass")


def test_delete_user_reports_an_unknown_account() -> None:
    exit_code = cli._delete_user(
        argparse.Namespace(command="delete-user", username="ghost")
    )

    assert exit_code == 1
