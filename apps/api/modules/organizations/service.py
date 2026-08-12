"""
Organization service - business logic layer.
"""
import re
from typing import List, Optional

from apps.api.core.cache.service import CacheKeys, CacheService
from apps.api.core.exceptions.base import ConflictError, NotFoundError
from apps.api.core.security.permissions import Role
from apps.api.modules.organizations.models import (
    InvitationStatus,
    Organization,
    OrganizationInvitation,
    OrganizationMember,
)
from apps.api.modules.organizations.repository import OrganizationRepository
from apps.api.modules.organizations.schemas import OrganizationCreate, OrganizationUpdate


class OrganizationService:
    """Service for organization business logic."""

    def __init__(
        self,
        repository: OrganizationRepository,
        cache: Optional[CacheService] = None,
    ) -> None:
        self.repository = repository
        self.cache = cache

    def _generate_slug(self, name: str) -> str:
        slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
        return slug

    async def _cache_role(self, org_id: int, firebase_uid: str, role: Optional[Role]) -> None:
        if not self.cache:
            return
        await self.cache.set_json(
            CacheKeys.org_role(org_id, firebase_uid),
            {"role": role.value if role else None},
        )

    async def _invalidate_role(self, org_id: int, firebase_uid: str) -> None:
        if not self.cache:
            return
        await self.cache.delete(CacheKeys.org_role(org_id, firebase_uid))

    async def _invalidate_org_roles(self, org_id: int) -> None:
        if not self.cache:
            return
        await self.cache.delete_prefix(CacheKeys.org_role_prefix(org_id))

    async def create_organization(
        self,
        data: OrganizationCreate,
        owner_uid: str,
        owner_email: str,
    ) -> Organization:
        slug = data.slug or self._generate_slug(data.name)

        if await self.repository.slug_exists(slug):
            base_slug = slug
            counter = 1
            while await self.repository.slug_exists(slug):
                slug = f"{base_slug}-{counter}"
                counter += 1

        org = await self.repository.create(
            name=data.name,
            slug=slug,
            description=data.description,
            logo_url=data.logo_url,
        )

        await self.repository.add_member(
            org_id=org.id,
            firebase_uid=owner_uid,
            email=owner_email,
            role=Role.OWNER,
        )
        await self._cache_role(org.id, owner_uid, Role.OWNER)

        return org

    async def get_organization(self, org_id: int) -> Organization:
        org = await self.repository.get_by_id(org_id)
        if not org:
            raise NotFoundError("Organization", org_id)
        return org

    async def get_organization_by_slug(self, slug: str) -> Organization:
        org = await self.repository.get_by_slug(slug)
        if not org:
            raise NotFoundError("Organization", slug)
        return org

    async def get_user_organizations(self, firebase_uid: str) -> List[Organization]:
        return await self.repository.get_user_organizations(firebase_uid)

    async def update_organization(
        self,
        org_id: int,
        data: OrganizationUpdate,
    ) -> Organization:
        org = await self.repository.update(
            org_id,
            name=data.name,
            description=data.description,
            logo_url=data.logo_url,
        )
        if not org:
            raise NotFoundError("Organization", org_id)
        return org

    async def delete_organization(self, org_id: int) -> bool:
        deleted = await self.repository.delete(org_id)
        if not deleted:
            raise NotFoundError("Organization", org_id)
        await self._invalidate_org_roles(org_id)
        return True

    async def add_member(
        self,
        org_id: int,
        firebase_uid: str,
        email: str,
        role: Role = Role.MEMBER,
    ) -> OrganizationMember:
        existing = await self.repository.get_member(org_id, firebase_uid)
        if existing:
            raise ConflictError(f"User {email} is already a member of this organization")

        member = await self.repository.add_member(
            org_id=org_id,
            firebase_uid=firebase_uid,
            email=email,
            role=role,
        )
        await self._invalidate_role(org_id, firebase_uid)
        return member

    async def invite_member(
        self,
        org_id: int,
        email: str,
        role: Role = Role.MEMBER,
        invited_by_uid: Optional[str] = None,
    ) -> OrganizationInvitation:
        normalized_email = email.strip().lower()

        existing_member = await self.repository.get_member_by_email(org_id, normalized_email)
        if existing_member:
            raise ConflictError(f"User {normalized_email} is already a member of this organization")

        existing_invitation = await self.repository.get_pending_invitation(org_id, normalized_email)
        if existing_invitation:
            raise ConflictError(f"User {normalized_email} already has a pending invitation")

        return await self.repository.create_invitation(
            org_id=org_id,
            email=normalized_email,
            role=role,
            invited_by_uid=invited_by_uid,
        )

    async def get_user_role(self, org_id: int, firebase_uid: str) -> Optional[Role]:
        if self.cache:
            cached = await self.cache.get_json(CacheKeys.org_role(org_id, firebase_uid))
            if cached is not None:
                role_value = cached.get("role")
                return Role(role_value) if role_value else None

        member = await self.repository.get_member(org_id, firebase_uid)
        role = member.role if member else None
        await self._cache_role(org_id, firebase_uid, role)
        return role

    async def update_member_role(
        self,
        org_id: int,
        firebase_uid: str,
        role: Role,
    ) -> OrganizationMember:
        member = await self.repository.update_member_role(org_id, firebase_uid, role)
        if not member:
            raise NotFoundError("Organization member", firebase_uid)
        await self._invalidate_role(org_id, firebase_uid)
        return member

    async def remove_member(self, org_id: int, firebase_uid: str) -> bool:
        removed = await self.repository.remove_member(org_id, firebase_uid)
        if not removed:
            raise NotFoundError("Organization member", firebase_uid)
        await self._invalidate_role(org_id, firebase_uid)
        return True

    async def list_pending_invitations(self, email: str) -> List[OrganizationInvitation]:
        return await self.repository.list_pending_invitations_by_email(email.strip().lower())

    async def accept_invitation(
        self,
        invitation_id: int,
        firebase_uid: str,
        email: str,
    ) -> Organization:
        normalized_email = email.strip().lower()
        invitation = await self.repository.get_invitation_by_id(invitation_id)
        if not invitation or invitation.status != InvitationStatus.PENDING:
            raise NotFoundError("Organization invitation", invitation_id)

        if invitation.email.lower() != normalized_email:
            raise ConflictError("This invitation does not belong to the authenticated user")

        existing_member = await self.repository.get_member(invitation.organization_id, firebase_uid)
        if existing_member is None:
            existing_member = await self.repository.get_member_by_email(invitation.organization_id, normalized_email)

        if existing_member:
            await self.repository.mark_invitation_accepted(invitation)
            await self._invalidate_role(invitation.organization_id, existing_member.firebase_uid)
            org = await self.repository.get_by_id(invitation.organization_id)
            if not org:
                raise NotFoundError("Organization", invitation.organization_id)
            return org

        await self.repository.add_member(
            org_id=invitation.organization_id,
            firebase_uid=firebase_uid,
            email=normalized_email,
            role=invitation.role,
        )
        await self.repository.mark_invitation_accepted(invitation)
        await self._cache_role(invitation.organization_id, firebase_uid, invitation.role)

        org = await self.repository.get_by_id(invitation.organization_id)
        if not org:
            raise NotFoundError("Organization", invitation.organization_id)
        return org
