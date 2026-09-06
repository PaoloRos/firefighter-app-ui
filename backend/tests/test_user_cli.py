"""Tests for the ``create-user`` management subcommand."""

import argparse

import pytest
from sqlalchemy import select
from sqlalchemy.orm import Session

import firefighter_tools_backend.__main__ as cli
from firefighter_tools_backend.db.models import UserRecord
from firefighter_tools_backend.domain.user import Role


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
