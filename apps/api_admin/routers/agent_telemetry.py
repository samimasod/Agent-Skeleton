"""
Platform-wide AI Agent Telemetry & Cross-Tenant Analytics Router for SuperAdmin API.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, cast, Date
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.core.database.connection import get_db
from apps.api.modules.agents.models import AgentUsageLog, AgentToolRun, OrganizationUsageQuota
from apps.api.modules.organizations.models import Organization

router = APIRouter(tags=["SuperAdmin Agent Telemetry"])


@router.get("/agent-telemetry/overview")
async def get_global_agent_telemetry(db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    """Return platform-wide aggregated AI usage, token efficiency, total spend, and tool reliability metrics."""
    usage_stmt = select(
        func.coalesce(func.sum(AgentUsageLog.total_tokens), 0),
        func.coalesce(func.sum(AgentUsageLog.prompt_tokens), 0),
        func.coalesce(func.sum(AgentUsageLog.completion_tokens), 0),
        func.coalesce(func.sum(AgentUsageLog.toon_tokens_saved), 0),
        func.coalesce(func.sum(AgentUsageLog.estimated_cost_usd), 0.0),
        func.coalesce(func.count(AgentUsageLog.id), 0),
        func.coalesce(func.avg(AgentUsageLog.latency_ms), 0.0),
    )
    res = await db.execute(usage_stmt)
    tot_tok, p_tok, c_tok, toon_sav, tot_cost, tot_turns, avg_lat = res.one()

    unoptimized = tot_tok + toon_sav
    toon_pct = round((toon_sav / unoptimized * 100.0), 1) if unoptimized > 0 else 0.0

    tool_stmt = select(
        func.count(AgentToolRun.id),
        func.coalesce(func.avg(AgentToolRun.duration_ms), 0.0),
    )
    tool_res = await db.execute(tool_stmt)
    tot_tools, avg_tool_lat = tool_res.one()

    # Active organizations count
    org_count_stmt = select(func.count(Organization.id))
    org_count_res = await db.execute(org_count_stmt)
    total_tenants = org_count_res.scalar() or 0

    return {
        "platform_total_tokens": tot_tok,
        "platform_prompt_tokens": p_tok,
        "platform_completion_tokens": c_tok,
        "platform_toon_tokens_saved": toon_sav,
        "platform_toon_savings_percentage": toon_pct,
        "platform_total_cost_usd": round(tot_cost, 4),
        "platform_total_turns": tot_turns,
        "avg_agent_latency_ms": round(avg_lat, 1),
        "platform_total_tool_runs": tot_tools,
        "avg_tool_latency_ms": round(avg_tool_lat, 1),
        "platform_total_tenants": total_tenants,
    }


@router.get("/agent-telemetry/tenants")
async def get_all_tenants_usage_overview(db: AsyncSession = Depends(get_db)) -> List[Dict[str, Any]]:
    """Return cross-tenant usage summary, total tokens, remaining quota, budget spend, and limit status for all organizations."""
    stmt = (
        select(
            Organization.id,
            Organization.name,
            Organization.slug,
            func.coalesce(OrganizationUsageQuota.tokens_used_this_month, 0),
            func.coalesce(OrganizationUsageQuota.monthly_token_quota, 1_000_000),
            func.coalesce(OrganizationUsageQuota.reserved_tokens_in_flight, 0),
            func.coalesce(OrganizationUsageQuota.cost_usd_this_month, 0.0),
            func.coalesce(OrganizationUsageQuota.monthly_budget_usd, 50.0),
            func.coalesce(OrganizationUsageQuota.hard_limit_enabled, True),
            func.coalesce(OrganizationUsageQuota.alert_threshold_percentage, 80),
        )
        .outerjoin(OrganizationUsageQuota, Organization.id == OrganizationUsageQuota.organization_id)
        .order_by(Organization.id.asc())
    )
    res = await db.execute(stmt)
    results = []
    for org_id, name, slug, used, quota, in_flight, cost, budget, hard_limit, threshold in res.all():
        remaining = max(0, quota - used)
        used_pct = round((used / quota * 100.0), 1) if quota > 0 else 0.0
        
        status = "normal"
        if used >= quota:
            status = "exceeded"
        elif (used + in_flight) >= quota or used_pct >= threshold:
            status = "warning"

        results.append({
            "organization_id": org_id,
            "organization_name": name,
            "organization_slug": slug,
            "tokens_used_this_month": used,
            "monthly_token_quota": quota,
            "remaining_tokens": remaining,
            "reserved_tokens_in_flight": in_flight,
            "cost_usd_this_month": round(cost, 4),
            "monthly_budget_usd": budget,
            "hard_limit_enabled": hard_limit,
            "quota_used_percentage": used_pct,
            "status": status,
        })
    return results


@router.get("/agent-telemetry/users")
async def get_per_user_usage_telemetry(
    organization_id: Optional[int] = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
) -> List[Dict[str, Any]]:
    """Return per-user AI agent usage breakdown, total tokens, cost, turn count, and last active timestamp."""
    stmt = (
        select(
            AgentUsageLog.user_uid,
            AgentUsageLog.organization_id,
            func.coalesce(func.sum(AgentUsageLog.total_tokens), 0).label("tot_tokens"),
            func.coalesce(func.sum(AgentUsageLog.prompt_tokens), 0).label("prompt_tokens"),
            func.coalesce(func.sum(AgentUsageLog.completion_tokens), 0).label("comp_tokens"),
            func.coalesce(func.sum(AgentUsageLog.estimated_cost_usd), 0.0).label("cost"),
            func.coalesce(func.count(AgentUsageLog.id), 0).label("turns"),
            func.max(AgentUsageLog.created_at).label("last_active"),
        )
        .group_by(AgentUsageLog.user_uid, AgentUsageLog.organization_id)
        .order_by(func.sum(AgentUsageLog.total_tokens).desc())
        .limit(limit)
    )

    if organization_id:
        stmt = stmt.where(AgentUsageLog.organization_id == organization_id)

    res = await db.execute(stmt)
    return [
        {
            "user_uid": u_uid,
            "organization_id": org_id,
            "total_tokens": tot_tok,
            "prompt_tokens": p_tok,
            "completion_tokens": c_tok,
            "cost_usd": round(cost, 4),
            "turns_count": turns,
            "last_active_at": last_active.isoformat() if last_active else None,
        }
        for u_uid, org_id, tot_tok, p_tok, c_tok, cost, turns, last_active in res.all()
    ]


@router.get("/agent-telemetry/time-series")
async def get_filterable_time_series_telemetry(
    days: int = Query(default=14, ge=1, le=90),
    organization_id: Optional[int] = Query(default=None),
    user_uid: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
) -> List[Dict[str, Any]]:
    """Return filterable daily time-series telemetry metrics for platform, specific tenant, or individual user."""
    start_date = datetime.now(timezone.utc) - timedelta(days=days)
    
    date_col = func.date(AgentUsageLog.created_at)
    stmt = (
        select(
            date_col.label("usage_date"),
            func.coalesce(func.sum(AgentUsageLog.total_tokens), 0).label("tot_tokens"),
            func.coalesce(func.sum(AgentUsageLog.prompt_tokens), 0).label("p_tokens"),
            func.coalesce(func.sum(AgentUsageLog.completion_tokens), 0).label("c_tokens"),
            func.coalesce(func.sum(AgentUsageLog.toon_tokens_saved), 0).label("toon_saved"),
            func.coalesce(func.sum(AgentUsageLog.estimated_cost_usd), 0.0).label("cost"),
            func.coalesce(func.count(AgentUsageLog.id), 0).label("turns"),
        )
        .where(AgentUsageLog.created_at >= start_date)
        .group_by(date_col)
        .order_by(date_col.asc())
    )

    if organization_id:
        stmt = stmt.where(AgentUsageLog.organization_id == organization_id)
    if user_uid:
        stmt = stmt.where(AgentUsageLog.user_uid == user_uid)

    res = await db.execute(stmt)
    db_rows = {str(r.usage_date): r for r in res.all()}

    # Populate zero-filled date range
    time_series = []
    for i in range(days):
        dt = (datetime.now(timezone.utc) - timedelta(days=days - 1 - i)).strftime("%Y-%m-%d")
        if dt in db_rows:
            r = db_rows[dt]
            time_series.append({
                "date": dt,
                "total_tokens": r.tot_tokens,
                "prompt_tokens": r.p_tokens,
                "completion_tokens": r.c_tokens,
                "toon_tokens_saved": r.toon_saved,
                "cost_usd": round(r.cost, 4),
                "turns_count": r.turns,
            })
        else:
            time_series.append({
                "date": dt,
                "total_tokens": 0,
                "prompt_tokens": 0,
                "completion_tokens": 0,
                "toon_tokens_saved": 0,
                "cost_usd": 0.0,
                "turns_count": 0,
            })

    return time_series


@router.get("/agent-telemetry/top-organizations")
async def get_top_consuming_organizations(db: AsyncSession = Depends(get_db)) -> List[Dict[str, Any]]:
    """Return top 10 token consuming organizations across the platform."""
    stmt = (
        select(
            AgentUsageLog.organization_id,
            func.coalesce(func.sum(AgentUsageLog.total_tokens), 0).label("tokens"),
            func.coalesce(func.sum(AgentUsageLog.estimated_cost_usd), 0.0).label("cost"),
            func.coalesce(func.count(AgentUsageLog.id), 0).label("turns"),
        )
        .group_by(AgentUsageLog.organization_id)
        .order_by(func.sum(AgentUsageLog.total_tokens).desc())
        .limit(10)
    )
    res = await db.execute(stmt)
    return [
        {
            "organization_id": org_id,
            "total_tokens": tok,
            "cost_usd": round(cost, 4),
            "turns_count": turns,
        }
        for org_id, tok, cost, turns in res.all()
    ]


class AdminQuotaUpdateInput(BaseModel):
    monthly_token_quota: Optional[int] = None
    monthly_budget_usd: Optional[float] = None
    hard_limit_enabled: Optional[bool] = None
    alert_threshold_percentage: Optional[int] = None


@router.patch("/agent-telemetry/quota")
async def update_tenant_quota(
    organization_id: int = Query(...),
    payload: AdminQuotaUpdateInput = ...,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Update tenant token quota and budget threshold directly from SuperAdmin dashboard."""
    stmt = select(OrganizationUsageQuota).where(OrganizationUsageQuota.organization_id == organization_id)
    res = await db.execute(stmt)
    quota = res.scalar_one_or_none()

    if not quota:
        quota = OrganizationUsageQuota(
            organization_id=organization_id,
            monthly_token_quota=payload.monthly_token_quota or 1_000_000,
            monthly_budget_usd=payload.monthly_budget_usd or 50.0,
            hard_limit_enabled=payload.hard_limit_enabled if payload.hard_limit_enabled is not None else True,
            alert_threshold_percentage=payload.alert_threshold_percentage or 80,
        )
        db.add(quota)
    else:
        if payload.monthly_token_quota is not None:
            quota.monthly_token_quota = payload.monthly_token_quota
        if payload.monthly_budget_usd is not None:
            quota.monthly_budget_usd = payload.monthly_budget_usd
        if payload.hard_limit_enabled is not None:
            quota.hard_limit_enabled = payload.hard_limit_enabled
        if payload.alert_threshold_percentage is not None:
            quota.alert_threshold_percentage = payload.alert_threshold_percentage
        
        # Reset dangling in-flight reservations on admin quota adjustment
        quota.reserved_tokens_in_flight = 0

    await db.commit()
    await db.refresh(quota)

    return {
        "organization_id": quota.organization_id,
        "monthly_token_quota": quota.monthly_token_quota,
        "monthly_budget_usd": quota.monthly_budget_usd,
        "tokens_used_this_month": quota.tokens_used_this_month,
        "reserved_tokens_in_flight": quota.reserved_tokens_in_flight,
        "cost_usd_this_month": quota.cost_usd_this_month,
        "hard_limit_enabled": quota.hard_limit_enabled,
        "alert_threshold_percentage": quota.alert_threshold_percentage,
    }
