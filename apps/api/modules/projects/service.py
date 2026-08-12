"""
Project service - business logic layer.
"""
from typing import List, Tuple

from apps.api.core.exceptions.base import NotFoundError
from apps.api.modules.projects.models import Project
from apps.api.modules.projects.repository import ProjectRepository
from apps.api.modules.projects.schemas import ProjectCreate, ProjectUpdate


class ProjectService:
    """Service for project business logic."""
    
    def __init__(self, repository: ProjectRepository):
        self.repository = repository
    
    async def create_project(self, data: ProjectCreate) -> Project:
        """Create a new project."""
        auth_config = data.auth_config.model_dump() if data.auth_config else None
        settings = data.settings.model_dump() if data.settings else None
        
        return await self.repository.create(
            organization_id=data.organization_id,
            name=data.name,
            description=data.description,
            base_url=data.base_url,
            auth_config=auth_config,
            settings=settings,
        )
    
    async def get_project(self, project_id: int) -> Project:
        """Get a project by ID."""
        project = await self.repository.get_by_id(project_id)
        if not project:
            raise NotFoundError("Project", project_id)
        return project
    
    async def get_projects_by_organization(self, org_id: int) -> List[Project]:
        """Get all projects for an organization."""
        return await self.repository.get_by_organization(org_id)

    async def get_paginated_projects_by_organization(self, org_id: int, page: int = 1, page_size: int = 20) -> Tuple[List[Project], int]:
        """Get paginated projects for an organization and total count."""
        offset = (page - 1) * page_size
        return await self.repository.get_paginated_by_organization(org_id, offset=offset, limit=page_size)
    
    async def update_project(self, project_id: int, data: ProjectUpdate) -> Project:
        """Update a project."""
        update_data = {}
        
        if data.name is not None:
            update_data["name"] = data.name
        if data.description is not None:
            update_data["description"] = data.description
        if data.base_url is not None:
            update_data["base_url"] = data.base_url
        if data.auth_config is not None:
            update_data["auth_config"] = data.auth_config.model_dump()
        if data.settings is not None:
            update_data["settings"] = data.settings.model_dump()
        if data.is_active is not None:
            update_data["is_active"] = data.is_active
        
        project = await self.repository.update(project_id, **update_data)
        if not project:
            raise NotFoundError("Project", project_id)
        return project
    
    async def delete_project(self, project_id: int) -> bool:
        """Delete a project."""
        deleted = await self.repository.delete(project_id)
        if not deleted:
            raise NotFoundError("Project", project_id)
        return True
