"""
Organization API routes.
"""
from typing import List

from fastapi import APIRouter, Depends, status

from apps.api.core.cache import get_cache_service
from apps.api.core.database import get_db
from apps.api.core.security.firebase_auth import FirebaseUser, get_current_user
from apps.api.core.security.permissions import Permission, check_permission
from apps.api.modules.organizations.repository import OrganizationRepository
from apps.api.modules.organizations.service import OrganizationService
from apps.api.modules.organizations.schemas import (
    AddMemberRequest,
    PendingInvitationsResponse,
    OrganizationCreate,
    OrganizationDetailResponse,
    OrganizationInvitationResponse,
    OrganizationListResponse,
    OrganizationResponse,
    OrganizationUpdate,
    UpdateMemberRoleRequest,
)

router = APIRouter()


async def get_org_service(session=Depends(get_db)) -> OrganizationService:
    """Dependency to get organization service."""
    repository = OrganizationRepository(session)
    return OrganizationService(repository, cache=get_cache_service())


@router.post("", response_model=OrganizationResponse, status_code=status.HTTP_201_CREATED)
async def create_organization(
    data: OrganizationCreate,
    user: FirebaseUser = Depends(get_current_user),
    service: OrganizationService = Depends(get_org_service),
):
    """Create a new organization."""
    org = await service.create_organization(
        data=data,
        owner_uid=user.uid,
        owner_email=user.email or "",
    )
    return OrganizationResponse.model_validate(org)


@router.get("/invitations/pending", response_model=PendingInvitationsResponse)
async def list_pending_invitations(
    user: FirebaseUser = Depends(get_current_user),
    service: OrganizationService = Depends(get_org_service),
):
    """List pending invitations for the authenticated user."""
    invitations = await service.list_pending_invitations(user.email or "")
    return PendingInvitationsResponse(
        invitations=[OrganizationInvitationResponse.model_validate(invitation) for invitation in invitations]
    )


@router.post("/invitations/{invitation_id}/accept", response_model=OrganizationResponse)
async def accept_invitation(
    invitation_id: int,
    user: FirebaseUser = Depends(get_current_user),
    service: OrganizationService = Depends(get_org_service),
):
    """Accept a pending invitation and join the organization."""
    org = await service.accept_invitation(
        invitation_id=invitation_id,
        firebase_uid=user.uid,
        email=user.email or "",
    )
    return OrganizationResponse.model_validate(org)


from apps.api.core.pagination import PaginationParams, build_paginated_response


@router.get("", response_model=OrganizationListResponse)
async def list_organizations(
    pagination: PaginationParams = Depends(),
    user: FirebaseUser = Depends(get_current_user),
    service: OrganizationService = Depends(get_org_service),
):
    """List all organizations the current user belongs to with pagination."""
    orgs = await service.get_user_organizations(user.uid)
    total = len(orgs)
    paginated_orgs = orgs[pagination.offset : pagination.offset + pagination.limit]
    return OrganizationListResponse(
        organizations=[OrganizationResponse.model_validate(org) for org in paginated_orgs],
        **build_paginated_response(total, pagination),
    )


@router.get("/{org_id}", response_model=OrganizationDetailResponse)
async def get_organization(
    org_id: int,
    user: FirebaseUser = Depends(get_current_user),
    service: OrganizationService = Depends(get_org_service),
):
    """Get an organization by ID."""
    # Check user has access
    role = await service.get_user_role(org_id, user.uid)
    check_permission(role, Permission.ORG_READ)
    
    org = await service.get_organization(org_id)
    return OrganizationDetailResponse.model_validate(org)


@router.patch("/{org_id}", response_model=OrganizationResponse)
async def update_organization(
    org_id: int,
    data: OrganizationUpdate,
    user: FirebaseUser = Depends(get_current_user),
    service: OrganizationService = Depends(get_org_service),
):
    """Update an organization."""
    # Check user has permission
    role = await service.get_user_role(org_id, user.uid)
    check_permission(role, Permission.ORG_UPDATE)
    
    org = await service.update_organization(org_id, data)
    return org


@router.delete("/{org_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_organization(
    org_id: int,
    user: FirebaseUser = Depends(get_current_user),
    service: OrganizationService = Depends(get_org_service),
):
    """Delete an organization."""
    # Check user has permission
    role = await service.get_user_role(org_id, user.uid)
    check_permission(role, Permission.ORG_DELETE)
    
    await service.delete_organization(org_id)


@router.post("/{org_id}/members", status_code=status.HTTP_201_CREATED)
async def add_member(
    org_id: int,
    data: AddMemberRequest,
    user: FirebaseUser = Depends(get_current_user),
    service: OrganizationService = Depends(get_org_service),
):
    """Create an invitation for a member to join an organization."""
    # Check user has permission
    role = await service.get_user_role(org_id, user.uid)
    check_permission(role, Permission.ORG_MANAGE_MEMBERS)

    invitation = await service.invite_member(
        org_id=org_id,
        email=data.email,
        role=data.role,
        invited_by_uid=user.uid,
    )
    return {"message": "Invitation created successfully", "invitation_id": invitation.id}


@router.patch("/{org_id}/members/{member_uid}/role")
async def update_member_role(
    org_id: int,
    member_uid: str,
    data: UpdateMemberRoleRequest,
    user: FirebaseUser = Depends(get_current_user),
    service: OrganizationService = Depends(get_org_service),
):
    """Update a member's role."""
    # Check user has permission
    role = await service.get_user_role(org_id, user.uid)
    check_permission(role, Permission.ORG_MANAGE_MEMBERS)
    
    member = await service.update_member_role(org_id, member_uid, data.role)
    return {"message": "Role updated successfully", "new_role": member.role.value}


@router.delete("/{org_id}/members/{member_uid}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(
    org_id: int,
    member_uid: str,
    user: FirebaseUser = Depends(get_current_user),
    service: OrganizationService = Depends(get_org_service),
):
    """Remove a member from an organization."""
    # Check user has permission
    role = await service.get_user_role(org_id, user.uid)
    check_permission(role, Permission.ORG_MANAGE_MEMBERS)
    
    await service.remove_member(org_id, member_uid)
