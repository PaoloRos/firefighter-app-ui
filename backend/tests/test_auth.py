"""Authentication, session, and role-authorization tests."""

from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from firefighter_tools_backend.db.models import UserRecord
from firefighter_tools_backend.domain.user import Role
from firefighter_tools_backend.services import auth

CONVERT_ENDPOINT = "/api/v1/tools/calendar-converter/convert"
EXAMPLE_ENDPOINT = "/api/v1/tools/calendar-converter/example"
CSV_HEADER = (
    "id,summary,all_date,start_date,start_time,end_date,end_time,"
    "location,description\n"
)


def _seed_user(
    session: Session,
    *,
    username: str = "chief",
    password: str = "correct horse",
    role: Role = Role.SUPER_USER,
) -> None:
    auth.create_user(
        session,
        username=username,
        password=password,
        role=role,
        profile={"name": "Chief", "surname": "Fireperson", "zug": "1"},
    )


def test_password_hash_is_scrypt_and_never_stores_plaintext(
    db_session: Session,
) -> None:
    _seed_user(db_session, password="super-secret-value")

    stored = db_session.scalars(select(UserRecord)).one()
    assert stored.password_hash.startswith("scrypt$")
    assert "super-secret-value" not in stored.password_hash
    assert auth.verify_password("super-secret-value", stored.password_hash)
    assert not auth.verify_password("wrong", stored.password_hash)


def test_login_starts_a_session_and_returns_the_safe_profile(
    anonymous_client: TestClient,
    db_session: Session,
) -> None:
    _seed_user(db_session, password="letmein-1234")

    response = anonymous_client.post(
        "/api/v1/auth/login",
        json={"username": "chief", "password": "letmein-1234"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body == {
        "username": "chief",
        "role": "super_user",
        "name": "Chief",
        "surname": "Fireperson",
        "rank": None,
        "zug": "1",
        "gruppe": None,
    }
    assert "password" not in body
    assert "firefighter_tools_session" in response.headers.get("set-cookie", "")


def test_login_rejects_a_wrong_password_without_leaking_detail(
    anonymous_client: TestClient,
    db_session: Session,
) -> None:
    _seed_user(db_session, password="the-right-one")

    response = anonymous_client.post(
        "/api/v1/auth/login",
        json={"username": "chief", "password": "the-wrong-one"},
    )

    assert response.status_code == 401
    assert response.json() == {
        "code": "invalid_credentials",
        "message": "Invalid username or password.",
    }
    assert "traceback" not in response.text.casefold()


def test_login_rejects_an_unknown_username(
    anonymous_client: TestClient,
) -> None:
    response = anonymous_client.post(
        "/api/v1/auth/login",
        json={"username": "ghost", "password": "whatever"},
    )

    assert response.status_code == 401
    assert response.json()["code"] == "invalid_credentials"


def test_me_requires_an_active_session(anonymous_client: TestClient) -> None:
    response = anonymous_client.get("/api/v1/auth/me")

    assert response.status_code == 401
    assert response.json() == {
        "code": "not_authenticated",
        "message": "Authentication is required.",
    }


def test_login_then_me_then_logout_round_trip(
    anonymous_client: TestClient,
    db_session: Session,
) -> None:
    _seed_user(db_session, username="member", password="pw", role=Role.USER)

    login = anonymous_client.post(
        "/api/v1/auth/login",
        json={"username": "member", "password": "pw"},
    )
    assert login.status_code == 200

    me = anonymous_client.get("/api/v1/auth/me")
    assert me.status_code == 200
    assert me.json()["username"] == "member"
    assert me.json()["role"] == "user"

    logout = anonymous_client.post("/api/v1/auth/logout")
    assert logout.status_code == 204

    assert anonymous_client.get("/api/v1/auth/me").status_code == 401


def test_logout_is_safe_without_a_session(
    anonymous_client: TestClient,
) -> None:
    assert anonymous_client.post("/api/v1/auth/logout").status_code == 204


def test_example_download_requires_authentication(
    anonymous_client: TestClient,
    db_session: Session,
) -> None:
    assert anonymous_client.get(EXAMPLE_ENDPOINT).status_code == 401

    _seed_user(db_session, username="member", password="pw", role=Role.USER)
    anonymous_client.post(
        "/api/v1/auth/login",
        json={"username": "member", "password": "pw"},
    )

    assert anonymous_client.get(EXAMPLE_ENDPOINT).status_code == 200


def test_normal_user_session_cannot_reach_the_upload_endpoint(
    anonymous_client: TestClient,
    db_session: Session,
) -> None:
    _seed_user(db_session, username="member", password="pw", role=Role.USER)
    anonymous_client.post(
        "/api/v1/auth/login",
        json={"username": "member", "password": "pw"},
    )

    response = anonymous_client.post(
        CONVERT_ENDPOINT,
        files={
            "file": (
                "schedule.csv",
                (CSV_HEADER + "e1,Ex,true,2026-07-22,,2026-07-22,,,\n").encode(),
                "text/csv",
            )
        },
    )

    assert response.status_code == 403
    assert response.json()["code"] == "forbidden"


def test_super_user_session_can_convert_a_schedule(
    anonymous_client: TestClient,
    db_session: Session,
) -> None:
    _seed_user(db_session, password="pw")
    anonymous_client.post(
        "/api/v1/auth/login",
        json={"username": "chief", "password": "pw"},
    )

    response = anonymous_client.post(
        CONVERT_ENDPOINT,
        files={
            "file": (
                "schedule.csv",
                (CSV_HEADER + "e1,Ex,true,2026-07-22,,2026-07-22,,,\n").encode(),
                "text/csv",
            )
        },
    )

    assert response.status_code == 200
    assert response.json()["status"] == "success"


def test_openapi_documents_the_auth_routes(anonymous_client: TestClient) -> None:
    paths = anonymous_client.get("/openapi.json").json()["paths"]

    assert "/api/v1/auth/login" in paths
    assert "/api/v1/auth/logout" in paths
    assert "/api/v1/auth/me" in paths
    convert = paths["/api/v1/tools/calendar-converter/convert"]["post"]
    assert set(convert["responses"]) >= {"401", "403"}
