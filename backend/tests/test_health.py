"""Health endpoint tests."""

from fastapi.testclient import TestClient

from firefighter_tools_backend import create_app


def test_health_check_reports_api_is_available() -> None:
    with TestClient(create_app()) as client:
        response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

