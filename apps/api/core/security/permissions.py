"""
Role-Based Access Control (RBAC) and permission management.
"""
from enum import Enum
from typing import List, Optional

from fastapi import HTTPException, status


class Role(str, Enum):
    """User roles within an organization."""

    OWNER = "owner"
    ADMIN = "admin"
    MEMBER = "member"
    VIEWER = "viewer"


class Permission(str, Enum):
    """Available permissions in the reusable skeleton."""

    ORG_READ = "org:read"
    ORG_UPDATE = "org:update"
    ORG_DELETE = "org:delete"
    ORG_MANAGE_MEMBERS = "org:manage_members"
    PROJECT_CREATE = "project:create"
    PROJECT_READ = "project:read"
    PROJECT_UPDATE = "project:update"
    PROJECT_DELETE = "project:delete"
    # Agent tool execution approval (roles with this permission can bypass the approval gate
    # when the tool's approval_required_for_roles list does NOT include their role)
    AGENT_TOOL_APPROVE = "agent:tool_approve"


ROLE_PERMISSIONS: dict[Role, List[Permission]] = {
    Role.OWNER: list(Permission),
    Role.ADMIN: [
        Permission.ORG_READ,
        Permission.ORG_UPDATE,
        Permission.ORG_MANAGE_MEMBERS,
        Permission.PROJECT_CREATE,
        Permission.PROJECT_READ,
        Permission.PROJECT_UPDATE,
        Permission.PROJECT_DELETE,
    ],
    Role.MEMBER: [
        Permission.ORG_READ,
        Permission.PROJECT_READ,
        Permission.PROJECT_UPDATE,
    ],
    Role.VIEWER: [
        Permission.ORG_READ,
        Permission.PROJECT_READ,
    ],
}


def get_role_permissions(role: Role) -> List[Permission]:
    return ROLE_PERMISSIONS.get(role, [])


def has_permission(role: Role, permission: Permission) -> bool:
    return permission in get_role_permissions(role)


def check_permission(
    user_role: Optional[Role],
    required_permission: Permission,
    raise_exception: bool = True,
) -> bool:
    if user_role is None:
        if raise_exception:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User has no role in this organization",
            )
        return False

    if not has_permission(user_role, required_permission):
        if raise_exception:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied: {required_permission.value}",
            )
        return False

    return True
