"""
Custom exception classes for the application.
"""
from typing import Any, Optional


class AppException(Exception):
    """Base exception for all application exceptions."""
    
    def __init__(
        self,
        message: str,
        status_code: int = 500,
        details: Optional[dict[str, Any]] = None,
    ):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class NotFoundError(AppException):
    """Resource not found exception."""
    
    def __init__(self, resource: str, identifier: Any = None):
        message = f"{resource} not found"
        if identifier:
            message = f"{resource} with id '{identifier}' not found"
        super().__init__(message=message, status_code=404)


class ValidationError(AppException):
    """Validation error exception."""
    
    def __init__(self, message: str, details: Optional[dict[str, Any]] = None):
        super().__init__(message=message, status_code=422, details=details)


class AuthenticationError(AppException):
    """Authentication error exception."""
    
    def __init__(self, message: str = "Authentication required"):
        super().__init__(message=message, status_code=401)


class AuthorizationError(AppException):
    """Authorization error exception."""
    
    def __init__(self, message: str = "Permission denied"):
        super().__init__(message=message, status_code=403)


class ConflictError(AppException):
    """Conflict error exception (e.g., duplicate resource)."""
    
    def __init__(self, message: str):
        super().__init__(message=message, status_code=409)


class RateLimitError(AppException):
    """Rate limit exceeded exception."""
    
    def __init__(self, message: str = "Rate limit exceeded"):
        super().__init__(message=message, status_code=429)


class ExternalServiceError(AppException):
    """External service error exception."""
    
    def __init__(self, service: str, message: str):
        super().__init__(
            message=f"External service error ({service}): {message}",
            status_code=502,
        )
