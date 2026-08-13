"""
Shared pytest fixtures for API integration tests.
Provides in-memory database sessions, test FastAPI client, and multi-tenant RBAC auth overrides.
"""
import os
import pytest
import pytest_asyncio
from typing import AsyncGenerator, Optional
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials

# Set test environment before importing app
os.environ["DATABASE_ENV"] = "test"
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"
os.environ["SUPER_ADMIN_EMAILS"] = "superadmin@test.com"

from apps.api.main import app
from apps.api.core.database.base import Base
from apps.api.core.database import get_db
from apps.api.core.security.firebase_auth import FirebaseUser, get_current_user, security
from apps.api.core.security.permissions import Role
from apps.api.modules.organizations.models import Organization, OrganizationMember
from apps.api.modules.projects.models import Project
from apps.api.modules.agents.models import Agent

# Define test user credentials
TEST_USERS = {
    "test-owner-token": FirebaseUser(uid="uid-owner", email="owner@test.com", name="Owner User"),
    "test-admin-token": FirebaseUser(uid="uid-admin", email="admin@test.com", name="Admin User"),
    "test-member-token": FirebaseUser(uid="uid-member", email="member@test.com", name="Member User"),
    "test-viewer-token": FirebaseUser(uid="uid-viewer", email="viewer@test.com", name="Viewer User"),
    "test-superadmin-token": FirebaseUser(uid="uid-superadmin", email="superadmin@test.com", name="SuperAdmin User"),
    "test-org2-owner-token": FirebaseUser(uid="uid-org2-owner", email="org2owner@test.com", name="Org2 Owner User"),
}


async def mock_get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> FirebaseUser:
    if credentials is None or not credentials.credentials:
        raise pytest.importorskip("fastapi").HTTPException(
            status_code=401,
            detail="Missing authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    if token in TEST_USERS:
        return TEST_USERS[token]
    
    # Return user with custom UID if passed in format token-<uid>
    if token.startswith("token-"):
        uid = token.replace("token-", "")
        return FirebaseUser(uid=uid, email=f"{uid}@test.com", name=f"User {uid}")
        
    # Default fallback for testing unknown valid token strings
    return FirebaseUser(uid=f"uid-{token}", email=f"{token}@test.com", name=f"User {token}")


@pytest_asyncio.fixture(scope="function")
async def test_db_engine():
    """Create an isolated in-memory database engine per test."""
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield engine
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture(scope="function")
async def session_factory(test_db_engine):
    """Yield async session factory bound to the isolated in-memory database."""
    return async_sessionmaker(
        test_db_engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )


@pytest_asyncio.fixture(scope="function")
async def db_session(session_factory) -> AsyncGenerator[AsyncSession, None]:
    """Yield a database session bound to the isolated in-memory database."""
    async with session_factory() as session:
        yield session


@pytest_asyncio.fixture(scope="function")
async def async_client(session_factory) -> AsyncGenerator[AsyncClient, None]:
    """Yield an HTTPX AsyncClient for FastAPI endpoint testing with DB and Auth overrides."""
    async def override_get_db():
        async with session_factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = mock_get_current_user

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
    ) as client:
        yield client

    app.dependency_overrides.clear()


@pytest_asyncio.fixture(scope="function")
async def seed_data(db_session: AsyncSession):
    """Seed test data for multi-tenant integration testing."""
    # 1. Primary Organization
    org1 = Organization(id=1, name="Acme Corp", slug="acme-corp")
    db_session.add(org1)
    
    # 2. Memberships in Org 1
    m1 = OrganizationMember(organization_id=1, firebase_uid="uid-owner", email="owner@test.com", role=Role.OWNER)
    m2 = OrganizationMember(organization_id=1, firebase_uid="uid-admin", email="admin@test.com", role=Role.ADMIN)
    m3 = OrganizationMember(organization_id=1, firebase_uid="uid-member", email="member@test.com", role=Role.MEMBER)
    m4 = OrganizationMember(organization_id=1, firebase_uid="uid-viewer", email="viewer@test.com", role=Role.VIEWER)
    db_session.add_all([m1, m2, m3, m4])

    # 3. Secondary Organization (Tenant 2 isolation test)
    org2 = Organization(id=2, name="Beta Inc", slug="beta-inc")
    db_session.add(org2)
    m5 = OrganizationMember(organization_id=2, firebase_uid="uid-org2-owner", email="org2owner@test.com", role=Role.OWNER)
    db_session.add(m5)

    # 4. Projects
    p1 = Project(id=1, organization_id=1, name="Acme Web Portal", description="Main portal", base_url="http://localhost:5173")
    p2 = Project(id=2, organization_id=2, name="Beta Secret Project", description="Confidential", base_url="http://localhost:5173")
    db_session.add_all([p1, p2])

    # 5. Agent
    agent1 = Agent(
        id=1,
        organization_id=1,
        name="Support Bot",
        description="Helpdesk Assistant",
        system_prompt="You are helpful.",
        model_id="google/gemini-3.1-flash",
        temperature=0.7,
        created_by_uid="uid-owner",
    )
    db_session.add(agent1)

    await db_session.commit()
    return {
        "org1_id": 1,
        "org2_id": 2,
        "project1_id": 1,
        "project2_id": 2,
        "agent1_id": 1,
    }
