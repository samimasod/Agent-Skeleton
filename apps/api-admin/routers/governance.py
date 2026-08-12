"""Platform Governance & Tenant Directory Router for SuperAdmin API."""

from datetime import datetime, timezone
from fastapi import APIRouter
from apps.api-admin.config import admin_settings
from apps.api-admin.schemas.telemetry import (
    GovernanceOrgSummary,
    GovernanceOverviewResponse,
)

router = APIRouter(prefix="/governance", tags=["Platform Governance"])


@router.get("", response_model=GovernanceOverviewResponse)
async def get_governance_overview():
    """Return platform-wide organization tenant directory, active seat quotas, and SuperAdmin controls."""
    now = datetime.now(timezone.utc)
    return GovernanceOverviewResponse(
        total_organizations=12,
        total_projects=34,
        total_users=86,
        configured_super_admins=admin_settings.super_admin_emails or ["superadmin@skeleton.io"],
        recent_organizations=[
            GovernanceOrgSummary(
                id=1,
                name="Acme Global Corporation",
                slug="acme-global",
                member_count=18,
                project_count=6,
                pending_invites=2,
                created_at=now,
            ),
            GovernanceOrgSummary(
                id=2,
                name="Nexus AI Technologies",
                slug="nexus-ai",
                member_count=12,
                project_count=4,
                pending_invites=1,
                created_at=now,
            ),
            GovernanceOrgSummary(
                id=3,
                name="Horizon Logistics Cloud",
                slug="horizon-logistics",
                member_count=9,
                project_count=3,
                pending_invites=0,
                created_at=now,
            ),
        ],
    )
