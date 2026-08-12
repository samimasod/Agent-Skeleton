"""Exception handling utilities."""
from apps.api.core.exceptions.base import (
    AppException,
    NotFoundError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    ConflictError,
)
from apps.api.core.exceptions.handlers import register_exception_handlers

__all__ = [
    "AppException",
    "NotFoundError",
    "ValidationError",
    "AuthenticationError",
    "AuthorizationError",
    "ConflictError",
    "register_exception_handlers",
]
