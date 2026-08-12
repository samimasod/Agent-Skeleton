"""
Database session management utilities.
"""
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.core.database.connection import AsyncSessionLocal


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    """Get an async database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
