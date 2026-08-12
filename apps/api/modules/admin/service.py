"""Service layer for super admin operations."""

from __future__ import annotations

from apps.api.config import settings
from apps.api.core.cache import CacheService
from apps.api.modules.admin.repository import AdminRepository
from apps.api.modules.admin.schemas import (
    AdminOrgSummary,
    AdminOverviewResponse,
    AdminProjectSummary,
    AdminUserSummary,
)
from apps.api.modules.organizations.models import InvitationStatus


class AdminService:
    """Service for platform-wide admin operations."""

    def __init__(self, repository: AdminRepository, cache: CacheService | None = None):
        self.repository = repository
        self.cache = cache

    async def get_overview(self) -> AdminOverviewResponse:
        total_organizations = await self.repository.get_total_organizations()
        total_projects = await self.repository.get_total_projects()
        total_memberships = await self.repository.get_total_memberships()
        total_pending_invitations = await self.repository.get_total_pending_invitations()
        total_known_user_emails = await self.repository.get_total_known_user_emails()

        recent_orgs = await self.repository.list_recent_organizations()
        recent_projects = await self.repository.list_recent_projects()
        recent_users = await self.repository.list_recent_user_summaries()

        return AdminOverviewResponse(
            environment=settings.environment,
            cache_enabled=self.cache.is_enabled() if self.cache else False,
            llm_provider=settings.llm_provider,
            storage_provider=settings.storage_provider,
            total_organizations=total_organizations,
            total_projects=total_projects,
            total_memberships=total_memberships,
            total_pending_invitations=total_pending_invitations,
            total_known_user_emails=total_known_user_emails,
            configured_super_admin_count=len(settings.super_admin_emails),
            recent_organizations=[
                AdminOrgSummary(
                    id=org.id,
                    name=org.name,
                    slug=org.slug,
                    member_count=len(org.members),
                    pending_invitation_count=sum(
                        1 for invitation in org.invitations if invitation.status == InvitationStatus.PENDING
                    ),
                    project_count=len(org.projects),
                    created_at=org.created_at,
                )
                for org in recent_orgs
            ],
            recent_projects=[
                AdminProjectSummary(
                    id=project.id,
                    organization_id=project.organization_id,
                    organization_name=project.organization.name if project.organization else "Unknown",
                    name=project.name,
                    base_url=project.base_url,
                    is_active=project.is_active,
                    created_at=project.created_at,
                )
                for project in recent_projects
            ],
            recent_users=[AdminUserSummary(**user) for user in recent_users],
        )

    async def invalidate_org_role_cache(self) -> bool:
        if not self.cache:
            return False
        await self.cache.delete_prefix("org_role:")
        return True
