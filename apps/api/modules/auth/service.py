"""
Authentication service - business logic for auth operations.
"""
from typing import Optional

from apps.api.core.security.firebase_auth import FirebaseAuthService, FirebaseUser


class AuthService:
    """Service for authentication operations."""
    
    def __init__(self, firebase_auth: FirebaseAuthService):
        self.firebase_auth = firebase_auth
    
    def verify_token(self, token: str) -> Optional[FirebaseUser]:
        """Verify a Firebase ID token."""
        return self.firebase_auth.verify_token(token)
    
    def get_user_by_uid(self, uid: str) -> Optional[dict]:
        """Get user information by UID."""
        return self.firebase_auth.get_user_by_uid(uid)
