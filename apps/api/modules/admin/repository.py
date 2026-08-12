"""Repository queries for the super admin module."""

from __future__ import annotations

from collections import defaultdict

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from apps.api.modules.organizations.models import (
    InvitationStatus,
    Organization,
    OrganizationInvitation,
    OrganizationMember,
)
from apps.api.modules.projects.models import Project


class AdminRepository:
    """Repository for app-wide admin reads."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_total_organizations(self) -> int:
        return int((await self.session.execute(select(func.count(Organization.id)))).scalar() or 0)

    async def get_total_projects(self) -> int:
        return int((await self.session.execute(select(func.count(Project.id)))).scalar() or 0)

    async def get_total_memberships(self) -> int:
        return int((await self.session.execute(select(func.count(OrganizationMember.id)))).scalar() or 0)

    async def get_total_pending_invitations(self) -> int:
        query = select(func.count(OrganizationInvitation.id)).where(
            OrganizationInvitation.status == InvitationStatus.PENDING
        )
        return int((await self.session.execute(query)).scalar() or 0)

    async def get_total_known_user_emails(self) -> int:
        member_emails = await self.session.execute(select(OrganizationMember.email))
        invitation_emails = await self.session.execute(
            select(OrganizationInvitation.email).where(
                OrganizationInvitation.status == InvitationStatus.PENDING
            )
        )
        unique_emails = {
            *(email.lower() for email in member_emails.scalars().all()),
            *(email.lower() for email in invitation_emails.scalars().all()),
        }
        return len(unique_emails)

    async def list_recent_organizations(self, limit: int = 8) -> list[Organization]:
        result = await self.session.execute(
            select(Organization)
            .options(
                selectinload(Organization.members),
                selectinload(Organization.invitations),
                selectinload(Organization.projects),
            )
            .order_by(Organization.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def list_recent_projects(self, limit: int = 8) -> list[Project]:
        result = await self.session.execute(
            select(Project)
            .options(selectinload(Project.organization))
            .order_by(Project.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def list_recent_user_summaries(self, limit: int = 12) -> list[dict]:
        member_rows = await self.session.execute(select(OrganizationMember))
        invitation_rows = await self.session.execute(
            select(OrganizationInvitation).where(OrganizationInvitation.status == InvitationStatus.PENDING)
        )

        users: dict[str, dict] = defaultdict(
            lambda: {
                "email": "",
                "organization_ids": set(),
                "membership_count": 0,
                "pending_invitation_count": 0,
                "roles": set(),
            }
        )

        for member in member_rows.scalars().all():
            email = member.email.lower()
            row = users[email]
            row["email"] = email
            row["organization_ids"].add(member.organization_id)
            row["membership_count"] += 1
            row["roles"].add(member.role.value)

        for invitation in invitation_rows.scalars().all():
            email = invitation.email.lower()
            row = users[email]
            row["email"] = email
            row["organization_ids"].add(invitation.organization_id)
            row["pending_invitation_count"] += 1
            row["roles"].add(invitation.role.value)

        ordered = sorted(
            users.values(),
            key=lambda item: (
                item["membership_count"] + item["pending_invitation_count"],
                item["email"],
            ),
            reverse=True,
        )
        return [
            {
                "email": row["email"],
                "organization_count": len(row["organization_ids"]),
                "membership_count": row["membership_count"],
                "pending_invitation_count": row["pending_invitation_count"],
                "roles": sorted(row["roles"]),
            }
            for row in ordered[:limit]
        ]
