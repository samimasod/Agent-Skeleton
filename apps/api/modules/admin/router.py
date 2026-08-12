"""Super admin API routes."""

from fastapi import APIRouter, Depends

from apps.api.core.cache import get_cache_service
from apps.api.core.database import get_db
from apps.api.core.security.firebase_auth import FirebaseUser, get_current_super_admin
from apps.api.modules.admin.repository import AdminRepository
from apps.api.modules.admin.schemas import AdminOverviewResponse, CacheInvalidateResponse
from apps.api.modules.admin.service import AdminService

router = APIRouter()


async def get_admin_service(session=Depends(get_db)) -> AdminService:
    repository = AdminRepository(session)
    return AdminService(repository, cache=get_cache_service())


@router.get("/overview", response_model=AdminOverviewResponse)
async def get_admin_overview(
    _: FirebaseUser = Depends(get_current_super_admin),
    service: AdminService = Depends(get_admin_service),
):
    return await service.get_overview()


@router.post("/cache/invalidate-org-roles", response_model=CacheInvalidateResponse)
async def invalidate_org_role_cache(
    _: FirebaseUser = Depends(get_current_super_admin),
    service: AdminService = Depends(get_admin_service),
):
    invalidated = await service.invalidate_org_role_cache()
    return CacheInvalidateResponse(invalidated=invalidated, namespace="org_role")
