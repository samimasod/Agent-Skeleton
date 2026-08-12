"""
Dependency Injection Container for the reusable application skeleton.
"""
from dependency_injector import containers, providers

from apps.api.core.cache.service import CacheService
from apps.api.core.database.session import get_async_session
from apps.api.core.security.firebase_auth import FirebaseAuthService
from apps.api.modules.auth.service import AuthService
from apps.api.modules.organizations.repository import OrganizationRepository
from apps.api.modules.organizations.service import OrganizationService
from apps.api.modules.projects.repository import ProjectRepository
from apps.api.modules.projects.service import ProjectService


class Container(containers.DeclarativeContainer):
    """Main dependency injection container."""

    config = providers.Configuration()

    wiring_config = containers.WiringConfiguration(
        modules=[
            "apps.api.modules.auth.router",
            "apps.api.modules.organizations.router",
            "apps.api.modules.projects.router",
        ]
    )

    db_session = providers.Factory(get_async_session)

    firebase_auth = providers.Singleton(
        FirebaseAuthService,
        credentials_path=config.firebase_admin_credentials_path,
        credentials_json=config.firebase_admin_credentials_json,
    )

    cache_service = providers.Singleton(
        CacheService,
        enabled=config.cache_enabled,
        backend=config.cache_backend,
        default_ttl_seconds=config.cache_default_ttl_seconds,
        redis_url=config.redis_url,
    )

    organization_repository = providers.Factory(
        OrganizationRepository,
        session=db_session,
    )

    project_repository = providers.Factory(
        ProjectRepository,
        session=db_session,
    )

    auth_service = providers.Factory(
        AuthService,
        firebase_auth=firebase_auth,
    )

    organization_service = providers.Factory(
        OrganizationService,
        repository=organization_repository,
        cache=cache_service,
    )

    project_service = providers.Factory(
        ProjectService,
        repository=project_repository,
    )
