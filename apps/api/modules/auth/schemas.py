"""
Authentication schemas for request/response validation.
"""
from typing import Optional

from pydantic import BaseModel, EmailStr


class TokenVerifyRequest(BaseModel):
    """Request schema for token verification."""
    token: str


class UserResponse(BaseModel):
    """Response schema for user information."""
    uid: str
    email: Optional[str] = None
    email_verified: bool = False
    name: Optional[str] = None
    picture: Optional[str] = None


class AuthStatusResponse(BaseModel):
    """Response schema for authentication status."""
    authenticated: bool
    is_super_admin: bool = False
    user: Optional[UserResponse] = None


class UserProfileResponse(BaseModel):
    """Response schema for user profile."""
    uid: str
    email: Optional[str] = None
    email_verified: bool = False
    name: Optional[str] = None
    picture: Optional[str] = None
    is_super_admin: bool = False
    organizations: list = []
