"""
Pydantic schemas for the Agent module.
"""
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


# --- AGENT TOOLS ---
class AgentToolBase(BaseModel):
    name: str = Field(..., max_length=64, description="Unique alphanumeric identifier for the tool")
    description: str = Field(..., description="Semantic explanation of what the tool does, used by LLMs")
    parameter_schema: Dict[str, Any] = Field(default_factory=dict, description="JSON Schema for tool arguments")
    is_active: bool = True
    ui_mode: str = Field("inline", description="Display mode: 'collapsible', 'inline', or 'both'")
    display_label_running: Optional[str] = Field(None, description="Custom label shown while executing e.g. 'Finding weather...'")
    display_label_completed: Optional[str] = Field(None, description="Custom label shown when complete e.g. 'Found weather'")
    # Human-in-the-Loop Approval Gate
    require_approval: bool = Field(False, description="When True, LLM tool calls are paused for user approval before execution")
    approval_required_for_roles: Optional[List[str]] = Field(
        None,
        description="Roles gated by approval (e.g. ['member', 'viewer']). If null/empty, all roles require approval when require_approval=True."
    )


class AgentToolCreate(AgentToolBase):
    code: str = Field(..., description="Python script implementing the run(**kwargs) function")


class AgentToolUpdate(BaseModel):
    description: Optional[str] = None
    parameter_schema: Optional[Dict[str, Any]] = None
    code: Optional[str] = None
    is_active: Optional[bool] = None
    ui_mode: Optional[str] = None
    display_label_running: Optional[str] = None
    display_label_completed: Optional[str] = None
    require_approval: Optional[bool] = None
    approval_required_for_roles: Optional[List[str]] = None


class AgentToolResponse(AgentToolBase):
    class Config:
        from_attributes = True


class AgentToolDetailResponse(AgentToolResponse):
    code: str

    class Config:
        from_attributes = True


# --- AGENT TOOL RUNS ---
class AgentToolRunResponse(BaseModel):
    id: int
    tool_name: str
    triggered_by: str
    arguments: Dict[str, Any]
    output: Optional[str] = None
    error: Optional[str] = None
    duration_ms: int
    created_at: datetime
    approval_status: Optional[str] = None
    approved_by: Optional[str] = None

    class Config:
        from_attributes = True


class AgentToolListResponse(BaseModel):
    tools: List[AgentToolDetailResponse]
    total: int
    page: int = 1
    page_size: int = 20
    total_pages: int = 1
    has_more: bool = False


class AgentToolRunListResponse(BaseModel):
    runs: List[AgentToolRunResponse]
    total: int


class AdminToolTestRequest(BaseModel):
    arguments: Dict[str, Any] = Field(default_factory=dict)


class AdminToolTestResponse(BaseModel):
    success: bool
    output: Optional[str] = None
    error: Optional[str] = None
    duration_ms: int


# --- AGENTS ---
class AgentBase(BaseModel):
    name: str = Field(..., max_length=128)
    description: Optional[str] = None
    system_prompt: str
    model_id: str
    summary_model_id: Optional[str] = Field("openai/gpt-4o-mini", description="Model slug used for background thread summarization")
    tool_pruning_turns: int = Field(3, description="Number of recent tool turns to keep unpruned")
    summarization_threshold: int = Field(10, description="Message count limit before triggering session summarization & pagination")
    temperature: float = 0.7
    is_active: bool = True


class AgentCreate(AgentBase):
    organization_id: int
    tool_names: Optional[List[str]] = Field(default_factory=list, description="Names of tools to link to the agent")


class AgentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    system_prompt: Optional[str] = None
    model_id: Optional[str] = None
    summary_model_id: Optional[str] = None
    tool_pruning_turns: Optional[int] = None
    summarization_threshold: Optional[int] = None
    temperature: Optional[float] = None
    is_active: Optional[bool] = None
    tool_names: Optional[List[str]] = None


class AgentResponse(AgentBase):
    id: int
    organization_id: int
    created_by_uid: str
    created_at: datetime
    updated_at: datetime
    tools: List[AgentToolResponse] = []

    class Config:
        from_attributes = True


class AgentListResponse(BaseModel):
    agents: List[AgentResponse]
    total: int
    page: int = 1
    page_size: int = 20
    total_pages: int = 1
    has_more: bool = False


# --- SESSIONS AND MESSAGES ---
class AgentMessageResponse(BaseModel):
    id: int
    session_id: str
    role: str
    content: Optional[str] = None
    tool_calls: Optional[List[Dict[str, Any]]] = None
    tool_call_id: Optional[str] = None
    name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AgentSessionResponse(BaseModel):
    id: str
    agent_id: int
    user_uid: str
    created_at: datetime
    agent_name: Optional[str] = None

    class Config:
        from_attributes = True


class AgentSessionDetailResponse(AgentSessionResponse):
    messages: List[AgentMessageResponse] = []
    total: int = 0
    page: int = 1
    page_size: int = 20
    total_pages: int = 1
    has_more: bool = False

    class Config:
        from_attributes = True


class AgentSessionListResponse(BaseModel):
    sessions: List[AgentSessionResponse]
    total: int
    page: int = 1
    page_size: int = 20
    total_pages: int = 1
    has_more: bool = False


# --- TELEMETRY & QUOTA SCHEMAS ---
class UsageOverviewResponse(BaseModel):
    organization_id: int
    total_tokens: int
    prompt_tokens: int
    completion_tokens: int
    toon_tokens_saved: int
    toon_savings_percentage: float
    total_cost_usd: float
    total_turns: int
    avg_latency_ms: float
    monthly_token_quota: int
    tokens_used_this_month: int
    reserved_tokens_in_flight: int
    quota_used_percentage: float
    hard_limit_enabled: bool


class UsageTimeSeriesDataPoint(BaseModel):
    date: str
    total_tokens: int
    prompt_tokens: int
    completion_tokens: int
    cost_usd: float
    turns_count: int


class UsageModelBreakdownItem(BaseModel):
    model_id: str
    provider: str
    total_tokens: int
    cost_usd: float
    turns_count: int
    avg_latency_ms: float


class UsageAgentBreakdownItem(BaseModel):
    agent_id: int
    agent_name: str
    total_tokens: int
    cost_usd: float
    turns_count: int


class UsageToolBreakdownItem(BaseModel):
    tool_name: str
    total_runs: int
    successful_runs: int
    failed_runs: int
    approved_runs: int
    rejected_runs: int
    avg_duration_ms: float


class QuotaUpdateInput(BaseModel):
    monthly_token_quota: Optional[int] = Field(None, ge=1_000)
    monthly_budget_usd: Optional[float] = Field(None, ge=0.0)
    hard_limit_enabled: Optional[bool] = None
    alert_threshold_percentage: Optional[int] = Field(None, ge=1, le=100)


class OrganizationQuotaResponse(BaseModel):
    organization_id: int
    monthly_token_quota: int
    monthly_budget_usd: float
    tokens_used_this_month: int
    reserved_tokens_in_flight: int
    cost_usd_this_month: float
    hard_limit_enabled: bool
    alert_threshold_percentage: int
    quota_used_percentage: float

    class Config:
        from_attributes = True

