"""Marketing & Growth Telemetry Router for SuperAdmin API."""

from fastapi import APIRouter
from apps.api-admin.schemas.telemetry import MarketingTelemetryResponse

router = APIRouter(prefix="/marketing-telemetry", tags=["Marketing Telemetry"])


@router.get("", response_model=MarketingTelemetryResponse)
async def get_marketing_telemetry():
    """Return marketing growth funnels, monthly active organizations (MAO), and feature adoption metrics."""
    return MarketingTelemetryResponse(
        monthly_active_organizations=48,
        new_signups_this_month=14,
        organization_conversion_rate=78.5,
        workspace_creation_velocity=3.2,
        total_active_user_seats=186,
        seat_utilization_rate=88.0,
        top_used_features=[
            "Agent Builder & WebSocket Streaming",
            "Multi-Tenant Isolation",
            "Sandboxed Python Tools",
            "Centralized Pagination",
        ],
        retention_cohort_percentage=92.4,
    )
