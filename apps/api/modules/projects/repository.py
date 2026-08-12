"""
Project repository - data access layer.
"""
from typing import List, Optional, Tuple

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.modules.projects.models import Project


class ProjectRepository:
    """Repository for project data access."""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def create(self, **kwargs) -> Project:
        """Create a new project."""
        project = Project(**kwargs)
        self.session.add(project)
        await self.session.flush()
        return project
    
    async def get_by_id(self, project_id: int) -> Optional[Project]:
        """Get a project by ID."""
        result = await self.session.execute(
            select(Project).where(Project.id == project_id)
        )
        return result.scalar_one_or_none()
    
    async def get_by_organization(self, org_id: int) -> List[Project]:
        """Get all projects for an organization."""
        result = await self.session.execute(
            select(Project)
            .where(Project.organization_id == org_id)
            .order_by(Project.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_paginated_by_organization(self, org_id: int, offset: int = 0, limit: int = 20) -> Tuple[List[Project], int]:
        """Get paginated projects for an organization and total count."""
        count_result = await self.session.execute(
            select(func.count(Project.id)).where(Project.organization_id == org_id)
        )
        total = count_result.scalar() or 0

        result = await self.session.execute(
            select(Project)
            .where(Project.organization_id == org_id)
            .order_by(Project.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        return list(result.scalars().all()), total
    
    async def update(self, project_id: int, **kwargs) -> Optional[Project]:
        """Update a project."""
        project = await self.get_by_id(project_id)
        if project:
            for key, value in kwargs.items():
                if value is not None:
                    setattr(project, key, value)
            await self.session.flush()
        return project
    
    async def delete(self, project_id: int) -> bool:
        """Delete a project."""
        project = await self.get_by_id(project_id)
        if project:
            await self.session.delete(project)
            await self.session.flush()
            return True
        return False
