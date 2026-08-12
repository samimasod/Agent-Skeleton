"""
Authentication API routes.
"""
from fastapi import APIRouter, Depends

from apps.api.core.security.firebase_auth import FirebaseUser, get_current_user, is_super_admin_email
from apps.api.modules.auth.schemas import (
    AuthStatusResponse,
    UserProfileResponse,
    UserResponse,
)

router = APIRouter()


@router.get("/status", response_model=AuthStatusResponse)
async def get_auth_status(
    user: FirebaseUser = Depends(get_current_user),
):
    """Check authentication status and return user info if authenticated."""
    return AuthStatusResponse(
        authenticated=True,
        is_super_admin=is_super_admin_email(user.email),
        user=UserResponse(
            uid=user.uid,
            email=user.email,
            email_verified=user.email_verified,
            name=user.name,
            picture=user.picture,
        ),
    )


@router.get("/me", response_model=UserProfileResponse)
async def get_current_user_profile(
    user: FirebaseUser = Depends(get_current_user),
):
    """Get the current user's profile."""
    # TODO: Fetch user's organizations from database
    return UserProfileResponse(
        uid=user.uid,
        email=user.email,
        email_verified=user.email_verified,
        name=user.name,
        picture=user.picture,
        is_super_admin=is_super_admin_email(user.email),
        organizations=[],
    )
