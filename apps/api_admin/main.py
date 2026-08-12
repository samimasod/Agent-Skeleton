"""Standalone SuperAdmin Monitoring & Telemetry Microservice Entrypoint."""

import logging
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

from apps.api_admin.config import admin_settings
from apps.api_admin.security import verify_admin_auth
from apps.api_admin.routers import (
    agent_evaluations,
    cloud_monitor,
    governance,
    marketing_telemetry,
    agent_telemetry,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("superadmin-api")

app = FastAPI(
    title="Skeleton SuperAdmin Monitoring API",
    description="Standalone SuperAdmin microservice for cloud monitoring, agent evaluations, marketing telemetry, and platform governance.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=admin_settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from apps.api.modules.llm.router import router as llm_router
from apps.api.modules.agents.router import router as agents_router, admin_tools_router
from apps.api.modules.agents.websocket import router as agents_ws_router

# Include Routers with SuperAdmin authentication verification
app.include_router(cloud_monitor.router, prefix="/api/admin", dependencies=[Depends(verify_admin_auth)])
app.include_router(agent_evaluations.router, prefix="/api/admin", dependencies=[Depends(verify_admin_auth)])
app.include_router(marketing_telemetry.router, prefix="/api/admin", dependencies=[Depends(verify_admin_auth)])
app.include_router(governance.router, prefix="/api/admin", dependencies=[Depends(verify_admin_auth)])
app.include_router(agent_telemetry.router, prefix="/api/admin", dependencies=[Depends(verify_admin_auth)])

# Include Agent & Tools Management Routers in Admin Microservice
app.include_router(admin_tools_router, prefix="/api/admin/tools", tags=["Admin Agent Tools"])
app.include_router(agents_router, prefix="/api/agents", tags=["Agents"])
app.include_router(agents_ws_router, prefix="/api/agents", tags=["Agents WebSocket"])
app.include_router(llm_router, prefix="/api/llm", tags=["LLM Provider Models"])


@app.get("/api/admin/auth/status", tags=["Authentication"])
async def get_admin_auth_status():
    """Public endpoint returning SuperAdmin authentication requirements."""
    return {
        "admin_auth_enabled": admin_settings.admin_auth_enabled,
        "environment": admin_settings.environment,
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint for container orchestrators."""
    return {
        "status": "healthy",
        "service": "api_admin",
        "environment": admin_settings.environment,
        "version": "1.0.0",
        "admin_auth_enabled": admin_settings.admin_auth_enabled,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "apps.api_admin.main:app",
        host=admin_settings.api_host,
        port=admin_settings.api_port,
        reload=admin_settings.debug,
    )
