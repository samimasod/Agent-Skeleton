"""Platform Governance & Tenant Directory Router for SuperAdmin API."""

from datetime import timezone
from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.core.database.connection import get_db
from apps.api.modules.organizations.models import Organization, OrganizationMember, OrganizationInvitation, InvitationStatus
from apps.api.modules.projects.models import Project
from apps.api_admin.config import admin_settings
from apps.api_admin.schemas.telemetry import (
    GovernanceOrgSummary,
    GovernanceOverviewResponse,
)

router = APIRouter(prefix="/governance", tags=["Platform Governance"])


@router.get("", response_model=GovernanceOverviewResponse)
async def get_governance_overview(db: AsyncSession = Depends(get_db)):
    """Return platform-wide organization tenant directory, active seat counts, and SuperAdmin controls."""
    # 1. Total counts
    total_orgs_res = await db.execute(select(func.count(Organization.id)))
    total_orgs = total_orgs_res.scalar() or 0

    total_projects_res = await db.execute(select(func.count(Project.id)))
    total_projects = total_projects_res.scalar() or 0

    total_members_res = await db.execute(select(func.count(OrganizationMember.id)))
    total_users = total_members_res.scalar() or 0

    # 2. Fetch all organizations with details
    stmt = (
        select(
            Organization.id,
            Organization.name,
            Organization.slug,
            Organization.created_at,
            func.count(func.distinct(OrganizationMember.id)).label("member_count"),
            func.count(func.distinct(Project.id)).label("project_count"),
        )
        .outerjoin(OrganizationMember, Organization.id == OrganizationMember.organization_id)
        .outerjoin(Project, Organization.id == Project.organization_id)
        .group_by(Organization.id, Organization.name, Organization.slug, Organization.created_at)
        .order_by(Organization.id.asc())
    )
    res = await db.execute(stmt)
    org_rows = res.all()

    # 3. Pending invitations per org
    invites_stmt = (
        select(
            OrganizationInvitation.organization_id,
            func.count(OrganizationInvitation.id).label("pending_count")
        )
        .where(OrganizationInvitation.status == InvitationStatus.PENDING)
        .group_by(OrganizationInvitation.organization_id)
    )
    invites_res = await db.execute(invites_stmt)
    invites_map = {row.organization_id: row.pending_count for row in invites_res.all()}

    recent_orgs = []
    for org_id, name, slug, created_at, member_cnt, project_cnt in org_rows:
        pending_cnt = invites_map.get(org_id, 0)
        
        # Ensure created_at timezone
        created_dt = created_at
        if created_dt and created_dt.tzinfo is None:
            created_dt = created_dt.replace(tzinfo=timezone.utc)

        recent_orgs.append(
            GovernanceOrgSummary(
                id=org_id,
                name=name,
                slug=slug,
                member_count=member_cnt,
                project_count=project_cnt,
                pending_invites=pending_cnt,
                created_at=created_dt,
            )
        )

    super_admins = admin_settings.super_admin_emails or ["owner@example.com", "admin@skeleton.io"]

    return GovernanceOverviewResponse(
        total_organizations=total_orgs,
        total_projects=total_projects,
        total_users=total_users,
        configured_super_admins=super_admins,
        recent_organizations=recent_orgs,
    )
