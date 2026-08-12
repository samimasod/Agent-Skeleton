"""
Organization repository - data access layer.
"""
from typing import List, Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from apps.api.modules.organizations.models import (
    InvitationStatus,
    Organization,
    OrganizationInvitation,
    OrganizationMember,
)
from apps.api.core.security.permissions import Role


class OrganizationRepository:
    """Repository for organization data access."""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def create(self, **kwargs) -> Organization:
        """Create a new organization."""
        organization = Organization(**kwargs)
        self.session.add(organization)
        await self.session.flush()
        return organization
    
    async def get_by_id(self, org_id: int) -> Optional[Organization]:
        """Get an organization by ID."""
        result = await self.session.execute(
            select(Organization)
            .options(
                selectinload(Organization.members),
                selectinload(Organization.invitations),
            )
            .where(Organization.id == org_id)
        )
        return result.scalar_one_or_none()
    
    async def get_by_slug(self, slug: str) -> Optional[Organization]:
        """Get an organization by slug."""
        result = await self.session.execute(
            select(Organization)
            .options(
                selectinload(Organization.members),
                selectinload(Organization.invitations),
            )
            .where(Organization.slug == slug)
        )
        return result.scalar_one_or_none()
    
    async def get_user_organizations(
        self, firebase_uid: str
    ) -> List[Organization]:
        """Get all organizations for a user."""
        result = await self.session.execute(
            select(Organization)
            .join(OrganizationMember)
            .where(OrganizationMember.firebase_uid == firebase_uid)
        )
        return list(result.scalars().all())
    
    async def update(self, org_id: int, **kwargs) -> Optional[Organization]:
        """Update an organization."""
        org = await self.get_by_id(org_id)
        if org:
            for key, value in kwargs.items():
                if value is not None:
                    setattr(org, key, value)
            await self.session.flush()
        return org
    
    async def delete(self, org_id: int) -> bool:
        """Delete an organization."""
        org = await self.get_by_id(org_id)
        if org:
            await self.session.delete(org)
            await self.session.flush()
            return True
        return False
    
    async def add_member(
        self,
        org_id: int,
        firebase_uid: str,
        email: str,
        role: Role = Role.MEMBER,
    ) -> OrganizationMember:
        """Add a member to an organization."""
        member = OrganizationMember(
            organization_id=org_id,
            firebase_uid=firebase_uid,
            email=email,
            role=role,
        )
        self.session.add(member)
        await self.session.flush()
        return member
    
    async def get_member(
        self, org_id: int, firebase_uid: str
    ) -> Optional[OrganizationMember]:
        """Get a member from an organization."""
        result = await self.session.execute(
            select(OrganizationMember)
            .where(OrganizationMember.organization_id == org_id)
            .where(OrganizationMember.firebase_uid == firebase_uid)
        )
        return result.scalar_one_or_none()

    async def get_member_by_email(
        self, org_id: int, email: str
    ) -> Optional[OrganizationMember]:
        """Get a member from an organization by email."""
        result = await self.session.execute(
            select(OrganizationMember)
            .where(OrganizationMember.organization_id == org_id)
            .where(func.lower(OrganizationMember.email) == email.lower())
        )
        return result.scalar_one_or_none()
    
    async def update_member_role(
        self, org_id: int, firebase_uid: str, role: Role
    ) -> Optional[OrganizationMember]:
        """Update a member's role."""
        member = await self.get_member(org_id, firebase_uid)
        if member:
            member.role = role
            await self.session.flush()
        return member
    
    async def remove_member(self, org_id: int, firebase_uid: str) -> bool:
        """Remove a member from an organization."""
        member = await self.get_member(org_id, firebase_uid)
        if member:
            await self.session.delete(member)
            await self.session.flush()
            return True
        return False

    async def create_invitation(
        self,
        org_id: int,
        email: str,
        role: Role = Role.MEMBER,
        invited_by_uid: Optional[str] = None,
    ) -> OrganizationInvitation:
        """Create a new organization invitation."""
        invitation = OrganizationInvitation(
            organization_id=org_id,
            email=email,
            role=role,
            status=InvitationStatus.PENDING,
            invited_by_uid=invited_by_uid,
        )
        self.session.add(invitation)
        await self.session.flush()
        return invitation

    async def get_pending_invitation(
        self, org_id: int, email: str
    ) -> Optional[OrganizationInvitation]:
        """Get a pending invitation for an org/email pair."""
        result = await self.session.execute(
            select(OrganizationInvitation)
            .where(OrganizationInvitation.organization_id == org_id)
            .where(func.lower(OrganizationInvitation.email) == email.lower())
            .where(OrganizationInvitation.status == InvitationStatus.PENDING)
        )
        return result.scalar_one_or_none()

    async def list_pending_invitations_by_email(
        self, email: str
    ) -> List[OrganizationInvitation]:
        """List pending invitations for a user email."""
        result = await self.session.execute(
            select(OrganizationInvitation)
            .options(selectinload(OrganizationInvitation.organization))
            .where(func.lower(OrganizationInvitation.email) == email.lower())
            .where(OrganizationInvitation.status == InvitationStatus.PENDING)
        )
        return list(result.scalars().all())

    async def get_invitation_by_id(self, invitation_id: int) -> Optional[OrganizationInvitation]:
        """Get an invitation by ID."""
        result = await self.session.execute(
            select(OrganizationInvitation)
            .options(selectinload(OrganizationInvitation.organization))
            .where(OrganizationInvitation.id == invitation_id)
        )
        return result.scalar_one_or_none()

    async def mark_invitation_accepted(
        self, invitation: OrganizationInvitation
    ) -> OrganizationInvitation:
        """Mark an invitation as accepted."""
        invitation.status = InvitationStatus.ACCEPTED
        await self.session.flush()
        return invitation
    
    async def slug_exists(self, slug: str) -> bool:
        """Check if a slug already exists."""
        result = await self.session.execute(
            select(func.count()).where(Organization.slug == slug)
        )
        return result.scalar() > 0
