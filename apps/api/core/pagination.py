"""
Centralized pagination dependencies and response builders for FastAPI routes.
"""
import math
from typing import Any, Dict, TypeVar
from fastapi import Query

T = TypeVar("T")


class PaginationParams:
    """FastAPI dependency for standard page and page_size query parameters."""

    def __init__(
        self,
        page: int = Query(1, ge=1, description="Page number (1-indexed)"),
        page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    ):
        self.page = page
        self.page_size = page_size
        self.offset = (page - 1) * page_size
        self.limit = page_size


def build_paginated_response(total: int, params: PaginationParams) -> Dict[str, Any]:
    """Calculate pagination metadata dictionary for Pydantic list responses."""
    total_pages = math.ceil(total / params.page_size) if total > 0 else 1
    return {
        "total": total,
        "page": params.page,
        "page_size": params.page_size,
        "total_pages": total_pages,
        "has_more": params.page < total_pages,
    }
