"""
Authentication service - business logic for auth operations.
"""
import uuid
from typing import Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.core.security.firebase_auth import FirebaseAuthService, FirebaseUser
from apps.api.core.security.jwt_auth import hash_password, verify_password, create_access_token
from apps.api.modules.auth.models import User
from apps.api.modules.auth.schemas import LoginRequest, RegisterRequest, UserResponse


class AuthService:
    """Service for authentication operations."""
    
    def __init__(self, firebase_auth: FirebaseAuthService):
        self.firebase_auth = firebase_auth
    
    def verify_token(self, token: str) -> Optional[FirebaseUser]:
        """Verify a JWT or Firebase ID token."""
        return self.firebase_auth.verify_token(token)

    async def register_local_user(
        self, db: AsyncSession, request: RegisterRequest
    ) -> Tuple[str, UserResponse]:
        """Register a new user account in local database."""
        email_clean = request.email.strip().lower()
        stmt = select(User).where(User.email == email_clean)
        res = await db.execute(stmt)
        if res.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists",
            )

        uid = f"usr_{uuid.uuid4().hex[:12]}"
        hashed = hash_password(request.password)
        user = User(
            uid=uid,
            email=email_clean,
            hashed_password=hashed,
            name=request.name or email_clean.split("@")[0].capitalize(),
            is_active=True,
            is_verified=True,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

        user_resp = UserResponse(
            uid=user.uid,
            email=user.email,
            email_verified=user.is_verified,
            name=user.name,
            picture=user.picture,
        )
        token = create_access_token({"uid": user.uid, "email": user.email, "name": user.name})
        return token, user_resp

    async def login_local_user(
        self, db: AsyncSession, request: LoginRequest
    ) -> Tuple[str, UserResponse]:
        """Authenticate user credentials against local database."""
        email_clean = request.email.strip().lower()
        stmt = select(User).where(User.email == email_clean)
        res = await db.execute(stmt)
        user = res.scalar_one_or_none()

        if not user or not verify_password(request.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        user_resp = UserResponse(
            uid=user.uid,
            email=user.email,
            email_verified=user.is_verified,
            name=user.name,
            picture=user.picture,
        )
        token = create_access_token({"uid": user.uid, "email": user.email, "name": user.name})
        return token, user_resp
