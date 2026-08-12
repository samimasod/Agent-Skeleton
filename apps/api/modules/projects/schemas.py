"""
Project schemas for request/response validation.
"""
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, HttpUrl


class AuthConfigSchema(BaseModel):
    """Schema for project authentication configuration."""
    type: str = Field(..., description="Auth type: cookie, session, oauth, basic")
    credentials: Optional[Dict[str, Any]] = None
    login_url: Optional[str] = None
    login_steps: Optional[List[Dict[str, Any]]] = None


class ProjectSettingsSchema(BaseModel):
    """Schema for project settings."""
    default_timeout: int = Field(default=30000, description="Default timeout in ms")
    viewport_width: int = Field(default=1920)
    viewport_height: int = Field(default=1080)
    headless: bool = Field(default=True)
    record_video: bool = Field(default=True)
    record_screenshots: bool = Field(default=True)


class ProjectBase(BaseModel):
    """Base schema for project data."""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    base_url: str = Field(..., description="Base URL of the application to test")


class ProjectCreate(ProjectBase):
    """Schema for creating a project."""
    organization_id: int
    auth_config: Optional[AuthConfigSchema] = None
    settings: Optional[ProjectSettingsSchema] = None


class ProjectUpdate(BaseModel):
    """Schema for updating a project."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    base_url: Optional[str] = None
    auth_config: Optional[AuthConfigSchema] = None
    settings: Optional[ProjectSettingsSchema] = None
    is_active: Optional[bool] = None


class ProjectResponse(BaseModel):
    """Response schema for project."""
    id: int
    organization_id: int
    name: str
    description: Optional[str] = None
    base_url: str
    auth_config: Optional[Dict[str, Any]] = None
    settings: Optional[Dict[str, Any]] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProjectListResponse(BaseModel):
    """Response schema for list of projects with pagination metadata."""
    projects: List[ProjectResponse]
    total: int
    page: int = 1
    page_size: int = 20
    total_pages: int = 1
    has_more: bool = False
