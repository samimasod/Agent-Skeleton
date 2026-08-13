"""
Integration tests for Projects CRUD and Multi-Tenant Isolation boundaries.
"""
import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


async def test_create_project_integration(async_client: AsyncClient, seed_data: dict):
    headers = {"Authorization": "Bearer test-owner-token"}
    payload = {
        "organization_id": seed_data["org1_id"],
        "name": "Mobile Application",
        "description": "Cross-platform client",
        "base_url": "http://localhost:5173",
    }

    response = await async_client.post("/api/projects", json=payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Mobile Application"
    assert data["organization_id"] == seed_data["org1_id"]
    assert "id" in data


async def test_list_projects_multi_tenant_isolation(async_client: AsyncClient, seed_data: dict):
    org1_id = seed_data["org1_id"]
    org2_id = seed_data["org2_id"]

    # 1. Org 1 user lists Org 1 projects
    headers_org1 = {"Authorization": "Bearer test-owner-token"}
    resp1 = await async_client.get(f"/api/projects?organization_id={org1_id}", headers=headers_org1)
    assert resp1.status_code == 200
    data1 = resp1.json()
    assert len(data1["projects"]) >= 1
    assert data1["projects"][0]["name"] == "Acme Web Portal"
    assert "total" in data1
    assert "page" in data1

    # 2. Org 1 user attempts to list Org 2 projects -> 403 Forbidden
    resp2 = await async_client.get(f"/api/projects?organization_id={org2_id}", headers=headers_org1)
    assert resp2.status_code == 403


async def test_get_project_details_tenant_boundary(async_client: AsyncClient, seed_data: dict):
    p1_id = seed_data["project1_id"]  # Belongs to Org 1
    p2_id = seed_data["project2_id"]  # Belongs to Org 2

    headers_org1_member = {"Authorization": "Bearer test-member-token"}

    # Can read Org 1 project
    resp1 = await async_client.get(f"/api/projects/{p1_id}", headers=headers_org1_member)
    assert resp1.status_code == 200
    assert resp1.json()["name"] == "Acme Web Portal"

    # Cannot read Org 2 project
    resp2 = await async_client.get(f"/api/projects/{p2_id}", headers=headers_org1_member)
    assert resp2.status_code == 403


async def test_update_and_delete_project_rbac(async_client: AsyncClient, seed_data: dict):
    p1_id = seed_data["project1_id"]

    # 1. Viewer attempts to update -> 403 Forbidden
    headers_viewer = {"Authorization": "Bearer test-viewer-token"}
    resp_viewer = await async_client.patch(f"/api/projects/{p1_id}", json={"name": "Hacked Portal"}, headers=headers_viewer)
    assert resp_viewer.status_code == 403

    # 2. Member attempts to delete -> 403 Forbidden (Only Owner and Admin have PROJECT_DELETE)
    headers_member = {"Authorization": "Bearer test-member-token"}
    resp_member_del = await async_client.delete(f"/api/projects/{p1_id}", headers=headers_member)
    assert resp_member_del.status_code == 403

    # 3. Admin updates project -> 200 OK
    headers_admin = {"Authorization": "Bearer test-admin-token"}
    resp_admin_update = await async_client.patch(f"/api/projects/{p1_id}", json={"name": "Acme Web Portal v2"}, headers=headers_admin)
    assert resp_admin_update.status_code == 200
    assert resp_admin_update.json()["name"] == "Acme Web Portal v2"

    # 4. Admin deletes project -> 204 No Content
    resp_admin_del = await async_client.delete(f"/api/projects/{p1_id}", headers=headers_admin)
    assert resp_admin_del.status_code == 204
