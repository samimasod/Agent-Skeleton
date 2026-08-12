"""Standalone SuperAdmin Monitoring & Telemetry Microservice Entrypoint."""

import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from apps.api-admin.config import admin_settings
from apps.api-admin.routers import (
    agent_evaluations,
    cloud_monitor,
    governance,
    marketing_telemetry,
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

# Include Routers
app.include_router(cloud_monitor.router, prefix="/api/admin")
app.include_router(agent_evaluations.router, prefix="/api/admin")
app.include_router(marketing_telemetry.router, prefix="/api/admin")
app.include_router(governance.router, prefix="/api/admin")


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint for container orchestrators."""
    return {
        "status": "healthy",
        "service": "api-admin",
        "environment": admin_settings.environment,
        "version": "1.0.0",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "apps.api-admin.main:app",
        host=admin_settings.api_host,
        port=admin_settings.api_port,
        reload=admin_settings.debug,
    )
