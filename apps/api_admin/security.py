"""Security and Firebase authentication middleware dependency for SuperAdmin Monitoring API."""

from typing import Optional
from fastapi import Depends, Header, HTTPException, status
from apps.api_admin.config import admin_settings

# Attempt to import firebase_admin for ID token verification
try:
    import firebase_admin
    from firebase_admin import auth as firebase_auth
    FIREBASE_AVAILABLE = True
except ImportError:
    FIREBASE_AVAILABLE = False


async def verify_admin_auth(
    x_admin_api_key: Optional[str] = Header(None, alias="X-Admin-Api-Key"),
    authorization: Optional[str] = Header(None, alias="Authorization"),
):
    """Verify SuperAdmin authentication using Firebase ID Token or Secret API Key header.

    When ADMIN_AUTH_ENABLED is true:
    1. Checks 'X-Admin-Api-Key' or 'Authorization: Bearer <token>'.
    2. Accepts matching SUPER_ADMIN_API_KEY.
    3. Accepts mock dev tokens ('mock_firebase_admin_token_*').
    4. Verifies Firebase ID tokens if firebase_admin SDK is initialized.
    """
    if not admin_settings.admin_auth_enabled:
        # Authentication disabled in config/admin.yaml or env
        return True

    # Normalize token candidate from header
    token_candidate = (x_admin_api_key or "").strip()
    if not token_candidate and authorization and authorization.startswith("Bearer "):
        token_candidate = authorization.split("Bearer ")[1].strip()

    if not token_candidate:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid SuperAdmin authentication. Provide a valid Firebase Bearer token or X-Admin-Api-Key header.",
            headers={"WWW-Authenticate": "Bearer, ApiKey"},
        )

    # 1. Check if token matches configured SUPER_ADMIN_API_KEY
    if token_candidate == admin_settings.super_admin_api_key:
        return True

    # 2. Check local development mock admin token
    if token_candidate.startswith("mock_firebase_admin_token_"):
        return True

    # 3. Check real Firebase Bearer Token if available
    if FIREBASE_AVAILABLE:
        try:
            decoded = firebase_auth.verify_id_token(token_candidate)
            email = decoded.get("email", "").lower()
            
            # Verify email is in configured super_admin_emails list if configured
            if admin_settings.super_admin_emails and email not in admin_settings.super_admin_emails:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"User email '{email}' is not configured in SUPER_ADMIN_EMAILS.",
                )
            return True
        except HTTPException:
            raise
        except Exception as e:
            print(f"Firebase token verification failed: {e}")
    else:
        # Dev fallback when firebase_admin is not initialized
        return True

    # If verification failed
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid SuperAdmin authentication credentials.",
        headers={"WWW-Authenticate": "Bearer, ApiKey"},
    )
