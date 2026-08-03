"""Production frontend serving tests."""

from pathlib import Path

from fastapi.testclient import TestClient
import pytest

from firefighter_tools_backend.main import (
    FrontendBuildNotFoundError,
    create_app,
)


@pytest.fixture
def frontend_dist(tmp_path: Path) -> Path:
    """Create a minimal Vite-like production build."""
    distribution = tmp_path / "dist"
    assets = distribution / "assets"
    assets.mkdir(parents=True)
    (distribution / "index.html").write_text(
        '<!doctype html><div id="root">Production UI</div>',
        encoding="utf-8",
    )
    (assets / "application.js").write_text(
        'console.log("production");',
        encoding="utf-8",
    )
    return distribution


def test_serves_root_from_the_production_frontend(frontend_dist: Path) -> None:
    with TestClient(create_app(frontend_dist=frontend_dist)) as client:
        response = client.get("/")

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/html")
    assert "Production UI" in response.text


def test_serves_index_for_a_nested_react_route(frontend_dist: Path) -> None:
    with TestClient(create_app(frontend_dist=frontend_dist)) as client:
        response = client.get("/tools/calendar-converter")

    assert response.status_code == 200
    assert "Production UI" in response.text


def test_serves_static_assets_with_their_content_type(
    frontend_dist: Path,
) -> None:
    with TestClient(create_app(frontend_dist=frontend_dist)) as client:
        response = client.get("/assets/application.js")

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/javascript")
    assert response.text == 'console.log("production");'


def test_api_routes_take_precedence_over_the_spa(frontend_dist: Path) -> None:
    with TestClient(create_app(frontend_dist=frontend_dist)) as client:
        health_response = client.get("/api/v1/health")
        missing_response = client.get("/api/v1/missing")

    assert health_response.status_code == 200
    assert health_response.json() == {"status": "ok"}
    assert missing_response.status_code == 404
    assert missing_response.json() == {"detail": "Not Found"}


def test_rejects_production_serving_without_a_frontend_build(
    tmp_path: Path,
) -> None:
    with pytest.raises(
        FrontendBuildNotFoundError,
        match="Run `pnpm --dir frontend build` first",
    ):
        create_app(frontend_dist=tmp_path / "missing")
