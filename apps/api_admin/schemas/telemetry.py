"""Telemetry schemas for SuperAdmin Monitoring API."""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class CloudMonitorResponse(BaseModel):
    environment: str
    database_provider: str
    database_status: str
    active_connections: int
    pool_size: int
    storage_provider: str
    storage_status: str
    storage_bucket: str
    cache_backend: str
    cache_status: str
    cache_hit_ratio: float
    redis_memory_used_mb: float
    api_uptime_seconds: float
    requests_per_minute: int
    average_latency_ms: float
    error_rate_percentage: float


class AgentEvaluationMetricsResponse(BaseModel):
    total_agent_runs: int
    openrouter_token_count: int
    openai_token_count: int
    total_tokens_consumed: int
    toon_tokens_saved: int
    toon_savings_percentage: float
    average_llm_latency_ms: float
    tool_execution_count: int
    tool_failure_rate_percentage: float
    benchmark_pass_rate_percentage: float


class AgentEvaluationRunRequest(BaseModel):
    agent_id: Optional[int] = None
    suite_name: str = Field(default="standard_benchmark", description="Benchmark test suite name")


class AgentEvaluationRunResponse(BaseModel):
    run_id: str
    suite_name: str
    total_tests: int
    passed_tests: int
    failed_tests: int
    accuracy_score: float
    average_response_time_ms: float
    status: str
    executed_at: datetime


class MarketingTelemetryResponse(BaseModel):
    monthly_active_organizations: int
    new_signups_this_month: int
    organization_conversion_rate: float
    workspace_creation_velocity: float
    total_active_user_seats: int
    seat_utilization_rate: float
    top_used_features: List[str]
    retention_cohort_percentage: float


class GovernanceOrgSummary(BaseModel):
    id: int
    name: str
    slug: str
    member_count: int
    project_count: int
    pending_invites: int
    created_at: datetime


class GovernanceOverviewResponse(BaseModel):
    total_organizations: int
    total_projects: int
    total_users: int
    configured_super_admins: List[str]
    recent_organizations: List[GovernanceOrgSummary]
