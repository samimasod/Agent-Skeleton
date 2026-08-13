"""
Integration tests for Organization management and RBAC access controls.
"""
import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


async def test_create_organization_integration(async_client: AsyncClient):
    headers = {"Authorization": "Bearer test-owner-token"}
    payload = {"name": "New Tech Corp", "slug": "new-tech-corp"}

    response = await async_client.post("/api/organizations", json=payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "New Tech Corp"
    assert data["slug"] == "new-tech-corp"
    assert "id" in data


async def test_list_user_organizations_integration(async_client: AsyncClient, seed_data: dict):
    headers = {"Authorization": "Bearer test-owner-token"}

    response = await async_client.get("/api/organizations", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "organizations" in data
    assert len(data["organizations"]) >= 1
    assert data["organizations"][0]["name"] == "Acme Corp"


async def test_get_organization_details_rbac(async_client: AsyncClient, seed_data: dict):
    org_id = seed_data["org1_id"]

    # 1. Allowed for member in Org 1
    headers_owner = {"Authorization": "Bearer test-owner-token"}
    resp_owner = await async_client.get(f"/api/organizations/{org_id}", headers=headers_owner)
    assert resp_owner.status_code == 200
    assert resp_owner.json()["name"] == "Acme Corp"

    # 2. Forbidden for user outside Org 1 (e.g. Org 2 owner)
    headers_outsider = {"Authorization": "Bearer test-org2-owner-token"}
    resp_outsider = await async_client.get(f"/api/organizations/{org_id}", headers=headers_outsider)
    assert resp_outsider.status_code == 403


async def test_update_organization_rbac(async_client: AsyncClient, seed_data: dict):
    org_id = seed_data["org1_id"]
    payload = {"name": "Acme Corp Updated"}

    # 1. Owner can update
    headers_owner = {"Authorization": "Bearer test-owner-token"}
    resp_owner = await async_client.patch(f"/api/organizations/{org_id}", json=payload, headers=headers_owner)
    assert resp_owner.status_code == 200
    assert resp_owner.json()["name"] == "Acme Corp Updated"

    # 2. Viewer cannot update (403 Forbidden)
    headers_viewer = {"Authorization": "Bearer test-viewer-token"}
    resp_viewer = await async_client.patch(f"/api/organizations/{org_id}", json={"name": "Hacked"}, headers=headers_viewer)
    assert resp_viewer.status_code == 403


async def test_member_invitation_and_role_management(async_client: AsyncClient, seed_data: dict):
    org_id = seed_data["org1_id"]

    # 1. Admin invites new user
    headers_admin = {"Authorization": "Bearer test-admin-token"}
    invite_payload = {"email": "newinvitee@test.com", "role": "member"}
    resp_invite = await async_client.post(f"/api/organizations/{org_id}/members", json=invite_payload, headers=headers_admin)
    assert resp_invite.status_code == 201
    assert "invitation_id" in resp_invite.json()

    # 2. Member tries to invite (403 Forbidden)
    headers_member = {"Authorization": "Bearer test-member-token"}
    resp_member_invite = await async_client.post(f"/api/organizations/{org_id}/members", json=invite_payload, headers=headers_member)
    assert resp_member_invite.status_code == 403


async def test_delete_organization_rbac(async_client: AsyncClient, seed_data: dict):
    org_id = seed_data["org1_id"]

    # 1. Non-owner (Admin) tries to delete org (403 Forbidden)
    headers_admin = {"Authorization": "Bearer test-admin-token"}
    resp_admin = await async_client.delete(f"/api/organizations/{org_id}", headers=headers_admin)
    assert resp_admin.status_code == 403

    # 2. Owner deletes org (204 No Content)
    headers_owner = {"Authorization": "Bearer test-owner-token"}
    resp_owner = await async_client.delete(f"/api/organizations/{org_id}", headers=headers_owner)
    assert resp_owner.status_code == 204
