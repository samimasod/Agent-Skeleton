"""
Skeleton backend application entry point.
"""
from contextlib import asynccontextmanager
import logging
from logging.config import dictConfig
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from apps.api.config import settings
from apps.api.core.database.connection import init_db
from apps.api.core.exceptions.handlers import register_exception_handlers
from apps.api.dependencies import Container
from apps.api.modules.admin.router import router as admin_router
from apps.api.modules.auth.router import router as auth_router
from apps.api.modules.organizations.router import router as organizations_router
from apps.api.modules.projects.router import router as projects_router
from apps.api.modules.llm.router import router as llm_router
from apps.api.modules.agents.router import router as agents_router, admin_tools_router
from apps.api.modules.agents.websocket import router as agents_ws_router


def configure_logging() -> None:
    log_level = settings.api_log_level.upper()
    dictConfig(
        {
            "version": 1,
            "disable_existing_loggers": False,
            "formatters": {
                "default": {
                    "format": "%(asctime)s %(levelname)s %(name)s %(message)s",
                }
            },
            "handlers": {
                "default": {
                    "class": "logging.StreamHandler",
                    "formatter": "default",
                    "level": log_level,
                }
            },
            "loggers": {
                "apps": {"handlers": ["default"], "level": log_level, "propagate": False},
                "uvicorn.error": {"handlers": ["default"], "level": log_level, "propagate": False},
                "uvicorn.access": {"handlers": ["default"], "level": log_level, "propagate": False},
            },
            "root": {"handlers": ["default"], "level": log_level},
        }
    )


configure_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Skeleton API in %s mode", settings.environment)

    await init_db()

    # Seed LLM model pricing table on first boot
    from apps.api.core.database import get_db
    from apps.api.modules.llm.seed_models import seed_llm_models
    async for session in get_db():
        inserted = await seed_llm_models(session)
        if inserted:
            logger.info("LLM model seed: %d models inserted.", inserted)
        break

    container = Container()
    container.config.from_dict(settings.model_dump())
    app.state.container = container

    yield

    logger.info("Shutting down Skeleton API")


def create_app() -> FastAPI:
    app = FastAPI(
        title="Skeleton API",
        description="Generic multi-tenant backend skeleton.",
        version="0.1.0",
        docs_url="/api/docs" if settings.debug else None,
        redoc_url="/api/redoc" if settings.debug else None,
        openapi_url="/api/openapi.json" if settings.debug else None,
        lifespan=lifespan,
    )

    # ── CORS CONFIGURATION ────────────────────────────────────────
    # We combine settings.cors_origins with a regex for local development
    allowed_origins = list(settings.cors_origins)
    
    # Explicitly allow the production web URLs (Users can update these)
    # prod_urls = [
    #     "https://your-app-web.onrender.com",
    # ]
    # for url in prod_urls:
    #     if url not in allowed_origins:
    #         allowed_origins.append(url)
    
    # Ensure localhost is always allowed in debug mode, or if not provided
    if settings.debug and "http://localhost:5173" not in allowed_origins:
        allowed_origins.append("http://localhost:5173")
    
    logger.info("Configuring CORS with origins: %s", allowed_origins)

    # Define regex for local development
    cors_regex = r"(https://.*\.onrender\.com)|(https://.*\.web\.app)"
    if settings.debug:
        cors_regex = r"(https?://(localhost|127\.0\.0\.1)(:\d+)?)|(" + cors_regex + r")"

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_origin_regex=cors_regex,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["Content-Type", "Authorization"],
    )

    register_exception_handlers(app)

    artifacts_dir = Path(settings.storage_local_path) / settings.storage_gcs_prefix
    artifacts_dir.mkdir(parents=True, exist_ok=True)
    app.mount("/artifacts", StaticFiles(directory=artifacts_dir), name="artifacts")

    app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
    app.include_router(admin_router, prefix="/api/admin", tags=["Admin"])
    
    app.include_router(organizations_router, prefix="/api/organizations", tags=["Organizations"])
    app.include_router(projects_router, prefix="/api/projects", tags=["Projects"])
    app.include_router(llm_router, prefix="/api/llm", tags=["LLM"])
    app.include_router(agents_router, prefix="/api/agents", tags=["Agents"])
    app.include_router(agents_ws_router, prefix="/api/agents", tags=["Agents WebSocket"])
    app.include_router(admin_tools_router, prefix="/api/admin/tools", tags=["Admin Tools"])

    @app.get("/")
    async def root():
        return {
            "name": "Skeleton API",
            "version": "0.1.0",
            "status": "running",
            "environment": settings.environment,
        }

    @app.get("/health")
    async def health_check():
        return {"status": "healthy"}

    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "apps.api.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.debug,
    )
