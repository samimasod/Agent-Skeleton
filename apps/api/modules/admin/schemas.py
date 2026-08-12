"""Schemas for the super admin module."""

from datetime import datetime

from pydantic import BaseModel


class AdminOrgSummary(BaseModel):
    id: int
    name: str
    slug: str
    member_count: int
    pending_invitation_count: int
    project_count: int
    created_at: datetime


class AdminProjectSummary(BaseModel):
    id: int
    organization_id: int
    organization_name: str
    name: str
    base_url: str
    is_active: bool
    created_at: datetime


class AdminUserSummary(BaseModel):
    email: str
    organization_count: int
    membership_count: int
    pending_invitation_count: int
    roles: list[str]


class AdminOverviewResponse(BaseModel):
    environment: str
    cache_enabled: bool
    llm_provider: str
    storage_provider: str
    total_organizations: int
    total_projects: int
    total_memberships: int
    total_pending_invitations: int
    total_known_user_emails: int
    configured_super_admin_count: int
    recent_organizations: list[AdminOrgSummary]
    recent_projects: list[AdminProjectSummary]
    recent_users: list[AdminUserSummary]


class CacheInvalidateResponse(BaseModel):
    invalidated: bool
    namespace: str
