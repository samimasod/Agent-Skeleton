"""
Integration tests for AI Agent CRUD, available tools, and sessions history.
"""
import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


async def test_create_agent_integration(async_client: AsyncClient, seed_data: dict):
    headers = {"Authorization": "Bearer test-owner-token"}
    payload = {
        "organization_id": seed_data["org1_id"],
        "name": "Customer Support Agent",
        "description": "Handles FAQ inquiries",
        "system_prompt": "You are a customer support agent.",
        "model_id": "google/gemini-3.1-flash",
        "temperature": 0.5,
        "tool_ids": [],
    }

    response = await async_client.post("/api/agents", json=payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Customer Support Agent"
    assert data["model_id"] == "google/gemini-3.1-flash"
    assert "id" in data


async def test_list_agents_multi_tenant_isolation(async_client: AsyncClient, seed_data: dict):
    org1_id = seed_data["org1_id"]
    org2_id = seed_data["org2_id"]

    headers_org1 = {"Authorization": "Bearer test-owner-token"}

    # 1. Org 1 user lists agents in Org 1
    resp1 = await async_client.get(f"/api/agents?organization_id={org1_id}", headers=headers_org1)
    assert resp1.status_code == 200
    data1 = resp1.json()
    assert "agents" in data1
    assert len(data1["agents"]) >= 1
    assert data1["agents"][0]["name"] == "Support Bot"

    # 2. Org 1 user lists agents in Org 2 -> 403 Forbidden
    resp2 = await async_client.get(f"/api/agents?organization_id={org2_id}", headers=headers_org1)
    assert resp2.status_code == 403


async def test_get_and_update_agent_rbac(async_client: AsyncClient, seed_data: dict):
    agent_id = seed_data["agent1_id"]

    # 1. Member gets agent details
    headers_member = {"Authorization": "Bearer test-member-token"}
    resp_get = await async_client.get(f"/api/agents/{agent_id}", headers=headers_member)
    assert resp_get.status_code == 200
    assert resp_get.json()["name"] == "Support Bot"

    # 2. Viewer attempts to update agent -> 403 Forbidden
    headers_viewer = {"Authorization": "Bearer test-viewer-token"}
    resp_update_fail = await async_client.patch(f"/api/agents/{agent_id}", json={"name": "Hacked Bot"}, headers=headers_viewer)
    assert resp_update_fail.status_code == 403

    # 3. Admin updates agent details -> 200 OK
    headers_admin = {"Authorization": "Bearer test-admin-token"}
    resp_update_ok = await async_client.patch(f"/api/agents/{agent_id}", json={"name": "Advanced Support Bot"}, headers=headers_admin)
    assert resp_update_ok.status_code == 200
    assert resp_update_ok.json()["name"] == "Advanced Support Bot"


async def test_list_available_tools(async_client: AsyncClient):
    headers = {"Authorization": "Bearer test-owner-token"}
    response = await async_client.get("/api/agents/tools/available", headers=headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)
