"""
Agent database models.
"""
from typing import List, Optional
from datetime import datetime

from sqlalchemy import Column, Integer, String, Text, Boolean, Float, ForeignKey, DateTime, JSON, Table
from sqlalchemy.orm import Mapped, mapped_column, relationship

from apps.api.core.database.base import Base


# Many-to-many association table between Agents and AgentTools
agent_tool_association = Table(
    "agent_tool_association",
    Base.metadata,
    Column("agent_id", Integer, ForeignKey("agents.id", ondelete="CASCADE"), primary_key=True),
    Column("tool_name", String(64), ForeignKey("agent_tools.name", ondelete="CASCADE"), primary_key=True),
)


class AgentTool(Base):
    """Represents a capability/tool that can be invoked by conversational agents."""

    __tablename__ = "agent_tools"

    name: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    parameter_schema: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    code: Mapped[str] = mapped_column(Text, nullable=False)  # Python script with run(**kwargs) function
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # UI Display Configuration
    ui_mode: Mapped[str] = mapped_column(String(32), default="inline", nullable=False)  # 'collapsible' | 'inline' | 'both'
    display_label_running: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    display_label_completed: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)

    # Human-in-the-Loop Approval Gate
    # When True, the LLM's tool call is paused and surfaced to the chat UI before execution.
    require_approval: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    # Optional list of role strings that are gated (e.g. ["member", "viewer"]).
    # If empty or null, ALL roles require approval when require_approval=True.
    approval_required_for_roles: Mapped[Optional[list]] = mapped_column(JSON, nullable=True, default=None)

    agents: Mapped[List["Agent"]] = relationship(
        "Agent",
        secondary=agent_tool_association,
        back_populates="tools",
    )


class AgentToolRun(Base):
    """Audit log of tool execution runs."""

    __tablename__ = "agent_tool_runs"

    tool_name: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("agent_tools.name", ondelete="CASCADE"),
        nullable=False,
    )
    triggered_by: Mapped[str] = mapped_column(String(128), nullable=False)  # User Firebase UID
    organization_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    agent_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("agents.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    arguments: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    output: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    duration_ms: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    # Approval audit trail (populated when require_approval=True)
    approval_status: Mapped[Optional[str]] = mapped_column(String(16), nullable=True)  # 'approved' | 'rejected' | None
    approved_by: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)     # Firebase UID of approver


class AgentUsageLog(Base):
    """Fine-grained telemetry log recorded after every LLM completion turn."""

    __tablename__ = "agent_usage_logs"

    organization_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    agent_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("agents.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    session_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("agent_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_uid: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    provider: Mapped[str] = mapped_column(String(64), nullable=False, default="openrouter")
    model_id: Mapped[str] = mapped_column(String(128), nullable=False)
    prompt_tokens: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    completion_tokens: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_tokens: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    toon_tokens_saved: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    estimated_cost_usd: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    latency_ms: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    tool_calls_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)


class OrganizationUsageQuota(Base):
    """Tenant token quota & pre-flight reservation budget configuration."""

    __tablename__ = "organization_usage_quotas"

    organization_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("organizations.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    monthly_token_quota: Mapped[int] = mapped_column(Integer, default=1_000_000, nullable=False)
    monthly_budget_usd: Mapped[float] = mapped_column(Float, default=50.0, nullable=False)
    tokens_used_this_month: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    reserved_tokens_in_flight: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    cost_usd_this_month: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    hard_limit_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    alert_threshold_percentage: Mapped[int] = mapped_column(Integer, default=80, nullable=False)



class Agent(Base):
    """Conversational Agent configuration scoped to an organization."""

    __tablename__ = "agents"

    organization_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    system_prompt: Mapped[str] = mapped_column(Text, nullable=False)
    model_id: Mapped[str] = mapped_column(String(128), nullable=False)  # OpenRouter/OpenAI model slug
    summary_model_id: Mapped[Optional[str]] = mapped_column(String(128), default="openai/gpt-4o-mini", nullable=True)
    tool_pruning_turns: Mapped[int] = mapped_column(Integer, default=3, nullable=False)
    summarization_threshold: Mapped[int] = mapped_column(Integer, default=10, nullable=False)
    temperature: Mapped[float] = mapped_column(Float, default=0.7, nullable=False)
    created_by_uid: Mapped[str] = mapped_column(String(128), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    tools: Mapped[List[AgentTool]] = relationship(
        "AgentTool",
        secondary=agent_tool_association,
        back_populates="agents",
    )

    sessions: Mapped[List["AgentSession"]] = relationship(
        "AgentSession",
        back_populates="agent",
        cascade="all, delete-orphan",
    )


class AgentSession(Base):
    """A conversational thread/session between a user and an agent."""

    __tablename__ = "agent_sessions"

    # Override Base's auto-integer PK - this table uses string (UUID) PK
    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    
    agent_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("agents.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_uid: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    agent: Mapped[Agent] = relationship("Agent", back_populates="sessions")
    messages: Mapped[List["AgentMessage"]] = relationship(
        "AgentMessage",
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="AgentMessage.id.asc()",
    )


class AgentMessage(Base):
    """Individual messages within an agent chat session."""

    __tablename__ = "agent_messages"

    session_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("agent_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    role: Mapped[str] = mapped_column(String(32), nullable=False)  # user, assistant, system, tool
    content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    tool_calls: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # JSON-serialized list of tool calls
    tool_call_id: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)  # matching tool call ID
    name: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)  # name of the tool or user if applicable

    session: Mapped[AgentSession] = relationship("AgentSession", back_populates="messages")
