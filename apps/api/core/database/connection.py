"""
Database connection management.
Supports SQLite (local) and PostgreSQL (production) with environment-based switching.
"""
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from apps.api.config import settings
from apps.api.core.database.base import Base


def create_engine_for_env():
    """Create the appropriate database engine based on environment."""
    database_url = settings.get_database_url()

    if "sqlite" in database_url:
        return create_async_engine(
            database_url,
            echo=settings.sql_echo,
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )

    connect_args = {}
    # Workaround for Supabase transaction pooler and asyncpg prepared statements
    if "pooler.supabase.com" in database_url or ":6543" in database_url:
        import uuid
        connect_args["prepared_statement_cache_size"] = 0
        connect_args["prepared_statement_name_func"] = lambda: f"__asyncpg_{uuid.uuid4().hex}__"

    return create_async_engine(
        database_url,
        echo=settings.sql_echo,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10,
        connect_args=connect_args,
    )


engine = create_engine_for_env()

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def init_db() -> None:
    """Initialize the database by creating all registered tables."""
    from apps.api.modules.organizations.models import (
        Organization,
        OrganizationInvitation,
        OrganizationMember,
    )
    from apps.api.modules.projects.models import Project
    from apps.api.modules.agents.models import (
        Agent,
        AgentTool,
        AgentToolRun,
        AgentSession,
        AgentMessage,
    )

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    print(f"Database initialized: {settings.database_env}")


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency to get database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
