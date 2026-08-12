"""
Unit tests for AI Agent Usage Monitoring, Token Extractor, Cost Estimation, and Quota Reservation.
"""

import pytest
from apps.api.modules.agents.pricing import TokenExtractor, calculate_turn_cost, normalize_model_slug


def test_normalize_model_slug():
    assert normalize_model_slug("openai/gpt-4o") == "gpt-4o"
    assert normalize_model_slug("google/gemini-2.0-flash") == "gemini-2.0-flash"
    assert normalize_model_slug("anthropic/claude-3.5-sonnet") == "claude-3-5-sonnet"
    assert normalize_model_slug("unknown-custom-model") == "default"


def test_calculate_turn_cost():
    # 100,000 prompt tokens, 50,000 completion tokens on gpt-4o ($2.50 / $10.00 per 1M)
    # prompt: (100k / 1M) * 2.50 = $0.25
    # comp: (50k / 1M) * 10.00 = $0.50
    # total = $0.75
    cost = calculate_turn_cost("gpt-4o", prompt_tokens=100_000, completion_tokens=50_000)
    assert cost == 0.75


def test_token_extractor_dict_payload():
    payload = {"prompt_tokens": 120, "completion_tokens": 80}
    p, c, t = TokenExtractor.extract("openrouter", payload)
    assert p == 120
    assert c == 80
    assert t == 200


def test_token_extractor_heuristic_fallback():
    # When payload is missing/none, fallback estimates ~4 chars per token
    p, c, t = TokenExtractor.extract("openai", None, input_text="Hello world test prompt", output_text="Hi there!")
    assert p == max(1, len("Hello world test prompt") // 4)
    assert c == max(1, len("Hi there!") // 4)
    assert t == p + c


class FakeUsageQuota:
    def __init__(self, organization_id: int, monthly_token_quota: int = 1_000_000, hard_limit_enabled: bool = True):
        self.organization_id = organization_id
        self.monthly_token_quota = monthly_token_quota
        self.tokens_used_this_month = 0
        self.reserved_tokens_in_flight = 0
        self.cost_usd_this_month = 0.0
        self.hard_limit_enabled = hard_limit_enabled


class FakeAgentUsageRepository:
    def __init__(self):
        self.quotas = {}

    async def get_or_create_quota(self, org_id: int):
        if org_id not in self.quotas:
            self.quotas[org_id] = FakeUsageQuota(org_id)
        return self.quotas[org_id]

    async def reserve_quota(self, org_id: int, estimated_tokens: int = 4000):
        quota = await self.get_or_create_quota(org_id)
        if quota.hard_limit_enabled and (quota.tokens_used_this_month + quota.reserved_tokens_in_flight + estimated_tokens > quota.monthly_token_quota):
            return False, quota
        quota.reserved_tokens_in_flight += estimated_tokens
        return True, quota

    async def settle_quota(self, org_id: int, actual_tokens: int, actual_cost_usd: float, reserved_estimate: int = 4000):
        quota = await self.get_or_create_quota(org_id)
        quota.reserved_tokens_in_flight = max(0, quota.reserved_tokens_in_flight - reserved_estimate)
        quota.tokens_used_this_month += actual_tokens
        quota.cost_usd_this_month += actual_cost_usd
        return quota


@pytest.mark.asyncio
async def test_quota_reservation_and_settlement():
    repo = FakeAgentUsageRepository()
    org_id = 9991

    # 1. Get default quota (1M tokens)
    quota = await repo.get_or_create_quota(org_id)
    assert quota.monthly_token_quota == 1_000_000
    assert quota.tokens_used_this_month == 0
    assert quota.reserved_tokens_in_flight == 0

    # 2. Reserve pre-flight tokens
    allowed, reserved_quota = await repo.reserve_quota(org_id, estimated_tokens=5000)
    assert allowed is True
    assert reserved_quota.reserved_tokens_in_flight == 5000

    # 3. Settle actual usage
    settled_quota = await repo.settle_quota(org_id, actual_tokens=1200, actual_cost_usd=0.005, reserved_estimate=5000)
    assert settled_quota.reserved_tokens_in_flight == 0
    assert settled_quota.tokens_used_this_month == 1200
    assert settled_quota.cost_usd_this_month == 0.005


@pytest.mark.asyncio
async def test_quota_hard_limit_enforcement():
    repo = FakeAgentUsageRepository()
    org_id = 9992
    repo.quotas[org_id] = FakeUsageQuota(org_id, monthly_token_quota=1000, hard_limit_enabled=True)

    # First reservation takes 800 tokens -> passes
    allowed1, _ = await repo.reserve_quota(org_id, estimated_tokens=800)
    assert allowed1 is True

    # Second reservation asks for 500 tokens (800 + 500 = 1300 > 1000) -> rejected!
    allowed2, _ = await repo.reserve_quota(org_id, estimated_tokens=500)
    assert allowed2 is False
