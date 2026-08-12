import math
from fastapi import APIRouter, Depends, Query, status

from apps.api.core.cache import get_cache_service
from apps.api.core.database import get_db
from apps.api.core.security.firebase_auth import FirebaseUser, get_current_user
from apps.api.core.security.permissions import Permission, check_permission
from apps.api.modules.organizations.repository import OrganizationRepository
from apps.api.modules.organizations.service import OrganizationService
from apps.api.modules.projects.repository import ProjectRepository
from apps.api.modules.projects.service import ProjectService
from apps.api.modules.projects.schemas import (
    ProjectCreate,
    ProjectListResponse,
    ProjectResponse,
    ProjectUpdate,
)

router = APIRouter()


async def get_project_service(session=Depends(get_db)) -> ProjectService:
    """Dependency to get project service."""
    repository = ProjectRepository(session)
    return ProjectService(repository)


async def get_org_service(session=Depends(get_db)) -> OrganizationService:
    """Dependency to get organization service."""
    repository = OrganizationRepository(session)
    return OrganizationService(repository, cache=get_cache_service())


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    data: ProjectCreate,
    user: FirebaseUser = Depends(get_current_user),
    project_service: ProjectService = Depends(get_project_service),
    org_service: OrganizationService = Depends(get_org_service),
):
    """Create a new project."""
    # Check user has permission in the organization
    role = await org_service.get_user_role(data.organization_id, user.uid)
    check_permission(role, Permission.PROJECT_CREATE)
    
    project = await project_service.create_project(data)
    return ProjectResponse.model_validate(project)


from apps.api.core.pagination import PaginationParams, build_paginated_response

@router.get("", response_model=ProjectListResponse)
async def list_projects(
    organization_id: int,
    pagination: PaginationParams = Depends(),
    user: FirebaseUser = Depends(get_current_user),
    project_service: ProjectService = Depends(get_project_service),
    org_service: OrganizationService = Depends(get_org_service),
):
    """List projects in an organization with pagination."""
    # Check user has permission
    role = await org_service.get_user_role(organization_id, user.uid)
    check_permission(role, Permission.PROJECT_READ)
    
    projects, total = await project_service.get_paginated_projects_by_organization(
        organization_id, page=pagination.page, page_size=pagination.page_size
    )

    return ProjectListResponse(
        projects=[ProjectResponse.model_validate(p) for p in projects],
        **build_paginated_response(total, pagination),
    )


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: int,
    user: FirebaseUser = Depends(get_current_user),
    project_service: ProjectService = Depends(get_project_service),
    org_service: OrganizationService = Depends(get_org_service),
):
    """Get a project by ID."""
    project = await project_service.get_project(project_id)
    
    # Check user has permission in the organization
    role = await org_service.get_user_role(project.organization_id, user.uid)
    check_permission(role, Permission.PROJECT_READ)
    
    return ProjectResponse.model_validate(project)


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: int,
    data: ProjectUpdate,
    user: FirebaseUser = Depends(get_current_user),
    project_service: ProjectService = Depends(get_project_service),
    org_service: OrganizationService = Depends(get_org_service),
):
    """Update a project."""
    # Get project to check organization
    project = await project_service.get_project(project_id)
    
    # Check user has permission
    role = await org_service.get_user_role(project.organization_id, user.uid)
    check_permission(role, Permission.PROJECT_UPDATE)
    
    updated_project = await project_service.update_project(project_id, data)
    return ProjectResponse.model_validate(updated_project)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: int,
    user: FirebaseUser = Depends(get_current_user),
    project_service: ProjectService = Depends(get_project_service),
    org_service: OrganizationService = Depends(get_org_service),
):
    """Delete a project."""
    # Get project to check organization
    project = await project_service.get_project(project_id)
    
    # Check user has permission
    role = await org_service.get_user_role(project.organization_id, user.uid)
    check_permission(role, Permission.PROJECT_DELETE)
    
    await project_service.delete_project(project_id)
