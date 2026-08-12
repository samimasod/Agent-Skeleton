"""
Organization schemas for request/response validation.
"""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from apps.api.core.security.permissions import Role
from apps.api.modules.organizations.models import InvitationStatus


class OrganizationBase(BaseModel):
    """Base schema for organization data."""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    logo_url: Optional[str] = None


class OrganizationCreate(OrganizationBase):
    """Schema for creating an organization."""
    slug: Optional[str] = Field(None, min_length=1, max_length=255)


class OrganizationUpdate(BaseModel):
    """Schema for updating an organization."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    logo_url: Optional[str] = None


class OrganizationMemberResponse(BaseModel):
    """Response schema for organization member."""
    id: int
    firebase_uid: str
    email: str
    role: Role
    created_at: datetime

    class Config:
        from_attributes = True


class OrganizationResponse(BaseModel):
    """Response schema for organization."""
    id: int
    name: str
    slug: str
    description: Optional[str] = None
    logo_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class OrganizationInvitationResponse(BaseModel):
    """Response schema for a pending or accepted invitation."""

    id: int
    organization_id: int
    email: str
    role: Role
    status: InvitationStatus
    invited_by_uid: Optional[str] = None
    organization: Optional[OrganizationResponse] = None
    created_at: datetime

    class Config:
        from_attributes = True


class OrganizationDetailResponse(OrganizationResponse):
    """Response schema for organization with members."""
    members: List[OrganizationMemberResponse] = []
    invitations: List[OrganizationInvitationResponse] = []


class OrganizationListResponse(BaseModel):
    """Response schema for list of organizations with pagination metadata."""
    organizations: List[OrganizationResponse]
    total: int
    page: int = 1
    page_size: int = 20
    total_pages: int = 1
    has_more: bool = False


class AddMemberRequest(BaseModel):
    """Request schema for adding a member to an organization."""
    email: str = Field(..., min_length=1)
    role: Role = Field(default=Role.MEMBER)


class UpdateMemberRoleRequest(BaseModel):
    """Request schema for updating a member's role."""
    role: Role


class PendingInvitationsResponse(BaseModel):
    """Response schema for a user's pending invitations."""

    invitations: List[OrganizationInvitationResponse]
