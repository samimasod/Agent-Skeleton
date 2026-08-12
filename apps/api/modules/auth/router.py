"""
Authentication API routes for both Local JWT & Firebase Auth.
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.core.database.connection import get_db
from apps.api.core.security.firebase_auth import (
    FirebaseUser,
    get_current_user,
    get_auth_service,
    is_super_admin_email,
)
from apps.api.modules.auth.schemas import (
    AuthStatusResponse,
    UserProfileResponse,
    UserResponse,
    LoginRequest,
    RegisterRequest,
    TokenResponse,
)
from apps.api.modules.auth.service import AuthService

router = APIRouter()


def get_service() -> AuthService:
    return AuthService(firebase_auth=get_auth_service())


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    payload: RegisterRequest,
    db: AsyncSession = Depends(get_db),
    service: AuthService = Depends(get_service),
):
    """Register a new user using local database authentication."""
    token, user = await service.register_local_user(db, payload)
    return TokenResponse(access_token=token, user=user)


@router.post("/login", response_model=TokenResponse)
async def login(
    payload: LoginRequest,
    db: AsyncSession = Depends(get_db),
    service: AuthService = Depends(get_service),
):
    """Sign in using local database credentials."""
    token, user = await service.login_local_user(db, payload)
    return TokenResponse(access_token=token, user=user)


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
    """Get the current user's profile information."""
    return UserProfileResponse(
        uid=user.uid,
        email=user.email,
        email_verified=user.email_verified,
        name=user.name,
        picture=user.picture,
        is_super_admin=is_super_admin_email(user.email),
        organizations=[],
    )
