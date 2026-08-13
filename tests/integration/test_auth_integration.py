"""
Integration tests for Authentication & User profile endpoints.
"""
import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


async def test_auth_status_endpoint(async_client: AsyncClient):
    headers = {"Authorization": "Bearer test-owner-token"}

    response = await async_client.get("/api/auth/status", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["authenticated"] is True
    assert data["user"]["uid"] == "uid-owner"
    assert data["user"]["email"] == "owner@test.com"
    assert data["is_super_admin"] is False


async def test_super_admin_status_endpoint(async_client: AsyncClient):
    headers = {"Authorization": "Bearer test-superadmin-token"}

    response = await async_client.get("/api/auth/status", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["authenticated"] is True
    assert data["user"]["email"] == "superadmin@test.com"
    assert data["is_super_admin"] is True


async def test_user_me_profile_endpoint(async_client: AsyncClient):
    headers = {"Authorization": "Bearer test-member-token"}

    response = await async_client.get("/api/auth/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["uid"] == "uid-member"
    assert data["email"] == "member@test.com"


async def test_unauthenticated_request_fails(async_client: AsyncClient):
    response = await async_client.get("/api/auth/status")
    assert response.status_code == 401


async def test_local_registration_and_login_flow(async_client: AsyncClient):
    # 1. Register new local user
    reg_payload = {
        "email": "localuser@test.com",
        "password": "SecurePassword123!",
        "name": "Local User Test",
    }
    resp_reg = await async_client.post("/api/auth/register", json=reg_payload)
    assert resp_reg.status_code == 201
    data_reg = resp_reg.json()
    assert "access_token" in data_reg
    assert data_reg["user"]["email"] == "localuser@test.com"

    # 2. Login with credentials
    login_payload = {
        "email": "localuser@test.com",
        "password": "SecurePassword123!",
    }
    resp_login = await async_client.post("/api/auth/login", json=login_payload)
    assert resp_login.status_code == 200
    data_login = resp_login.json()
    assert "access_token" in data_login
    assert data_login["user"]["email"] == "localuser@test.com"
