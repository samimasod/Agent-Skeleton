"""
Alembic migration environment configuration.
"""
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from alembic import context

# Import Base and all remaining models
from apps.api.core.database.base import Base
from apps.api.modules.organizations.models import Organization, OrganizationMember, OrganizationInvitation
from apps.api.modules.projects.models import Project
from apps.api.modules.llm.models import LLMModel
from apps.api.modules.agents.models import (
    Agent,
    AgentTool,
    AgentToolRun,
    AgentSession,
    AgentMessage,
    AgentUsageLog,
    OrganizationUsageQuota,
)

# Import settings
from apps.api.config import settings

# Alembic Config object
config = context.config

# Set the SQLAlchemy URL from settings
config.set_main_option("sqlalchemy.url", settings.get_sync_database_url())

# Interpret the config file for Python logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Model metadata for autogenerate
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL and not an Engine.
    Calls to context.execute() emit the given string to the script output.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        render_as_batch=True,  # Required for SQLite ALTER TABLE support
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine and associate a connection
    with the context.
    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            render_as_batch=True,  # Required for SQLite ALTER TABLE support
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
