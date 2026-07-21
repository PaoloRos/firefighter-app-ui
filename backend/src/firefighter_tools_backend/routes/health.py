"""Backend health route."""

from fastapi import APIRouter

from firefighter_tools_backend.models.health import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
def health_check() -> HealthResponse:
    """Report that the local API is ready to accept requests."""
    return HealthResponse()

