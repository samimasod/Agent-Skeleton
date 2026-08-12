from apps.api.core.security.permissions import Permission, Role, has_permission
from apps.api.modules.organizations.service import OrganizationService
from apps.api.modules.projects.service import ProjectService


def test_core_services_import() -> None:
    assert OrganizationService is not None
    assert ProjectService is not None


def test_owner_has_project_permissions() -> None:
    assert has_permission(Role.OWNER, Permission.PROJECT_READ)
    assert has_permission(Role.OWNER, Permission.PROJECT_UPDATE)
