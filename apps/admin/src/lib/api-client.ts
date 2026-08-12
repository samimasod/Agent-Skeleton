import { getIdToken } from "./firebase"
import type {
  Agent,
  AgentTool,
  AgentToolDetail,
  AgentToolRun,
  AgentSession,
  LLMModel,
  AgentListResponse,
  AgentToolListResponse,
  AgentToolRunListResponse,
  AgentSessionListResponse,
  AgentSessionDetailResponse,
  AgentCreateInput,
  AgentUpdateInput,
  AgentToolCreateInput,
  AgentToolUpdateInput,
  UsageOverview,
  UsageTimeSeriesPoint,
  UsageModelBreakdown,
  UsageAgentBreakdown,
  UsageToolBreakdown,
  OrganizationQuota,
} from "@skeleton/shared-types"

export type {
  Agent,
  AgentTool,
  AgentToolDetail,
  AgentToolRun,
  AgentSession,
  LLMModel,
  AgentListResponse,
  AgentToolListResponse,
  AgentToolRunListResponse,
  AgentSessionListResponse,
  AgentSessionDetailResponse,
  AgentCreateInput,
  AgentUpdateInput,
  AgentToolCreateInput,
  AgentToolUpdateInput,
  UsageOverview,
  UsageTimeSeriesPoint,
  UsageModelBreakdown,
  UsageAgentBreakdown,
  UsageToolBreakdown,
  OrganizationQuota,
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8001"

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const token = await getIdToken().catch(() => null)
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
    headers["X-Admin-Api-Key"] = token
  }

  const { body, ...restOptions } = options
  const config: RequestInit = {
    ...restOptions,
    headers,
  }

  if (body !== undefined) {
    config.body = typeof body === "string" ? body : JSON.stringify(body)
  }

  const response = await fetch(`${API_URL}${endpoint}`, config)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || errorData.message || `API Error ${response.status}: ${response.statusText}`)
  }

  if (response.status === 204) {
    return undefined as unknown as T
  }

  return response.json()
}

export const agentsApi = {
  list: (organizationId: number, page = 1, pageSize = 20) =>
    request<AgentListResponse>(`/api/agents?organization_id=${organizationId}&page=${page}&page_size=${pageSize}`),
  get: (id: number) => request<Agent>(`/api/agents/${id}`),
  create: (data: AgentCreateInput) =>
    request<Agent>("/api/agents", { method: "POST", body: data }),
  update: (id: number, data: AgentUpdateInput) =>
    request<Agent>(`/api/agents/${id}`, { method: "PATCH", body: data }),
  delete: (id: number) => request<void>(`/api/agents/${id}`, { method: "DELETE" }),
  listAvailableTools: () => request<AgentTool[]>("/api/agents/tools/available"),
  listSessions: (agentId: number, page = 1, pageSize = 20) =>
    request<AgentSessionListResponse>(`/api/agents/${agentId}/sessions?page=${page}&page_size=${pageSize}`),
  getSessionMessages: (sessionId: string, page = 1, pageSize = 20) =>
    request<AgentSessionDetailResponse>(`/api/agents/sessions/${sessionId}/messages?page=${page}&page_size=${pageSize}`),
}

export const adminToolsApi = {
  list: (page = 1, pageSize = 20) => request<AgentToolListResponse>(`/api/admin/tools?page=${page}&page_size=${pageSize}`),
  create: (data: AgentToolCreateInput) =>
    request<AgentTool>("/api/admin/tools", { method: "POST", body: data }),
  update: (name: string, data: AgentToolUpdateInput) =>
    request<AgentTool>(`/api/admin/tools/${encodeURIComponent(name)}`, {
      method: "PATCH",
      body: data,
    }),
  delete: (name: string) =>
    request<void>(`/api/admin/tools/${encodeURIComponent(name)}`, { method: "DELETE" }),
  listRuns: (toolName?: string, limit = 100) => {
    const query = toolName ? `?tool_name=${encodeURIComponent(toolName)}&limit=${limit}` : `?limit=${limit}`;
    return request<AgentToolRunListResponse>(`/api/admin/tools/runs${query}`);
  },
  test: (name: string, argumentsData: Record<string, any>) =>
    request<{ success: boolean; output: string | null; error: string | null; duration_ms: number }>(
      `/api/admin/tools/${encodeURIComponent(name)}/test`,
      {
        method: "POST",
        body: { arguments: argumentsData },
      }
    ),
}

export const usageApi = {
  overview: (organizationId: number) =>
    request<import("@skeleton/shared-types").UsageOverview>(`/api/agents/usage/overview?organization_id=${organizationId}`),
  timeSeries: (organizationId: number, days = 14) =>
    request<import("@skeleton/shared-types").UsageTimeSeriesPoint[]>(`/api/agents/usage/time-series?organization_id=${organizationId}&days=${days}`),
  models: (organizationId: number) =>
    request<import("@skeleton/shared-types").UsageModelBreakdown[]>(`/api/agents/usage/breakdown/models?organization_id=${organizationId}`),
  agents: (organizationId: number) =>
    request<import("@skeleton/shared-types").UsageAgentBreakdown[]>(`/api/agents/usage/breakdown/agents?organization_id=${organizationId}`),
  tools: (organizationId: number) =>
    request<import("@skeleton/shared-types").UsageToolBreakdown[]>(`/api/agents/usage/breakdown/tools?organization_id=${organizationId}`),
  getQuota: (organizationId: number) =>
    request<import("@skeleton/shared-types").OrganizationQuota>(`/api/agents/usage/quota?organization_id=${organizationId}`),
  updateQuota: (organizationId: number, body: { monthly_token_quota?: number; monthly_budget_usd?: number; hard_limit_enabled?: boolean; alert_threshold_percentage?: number }) =>
    request<import("@skeleton/shared-types").OrganizationQuota>(`/api/admin/agent-telemetry/quota?organization_id=${organizationId}`, {
      method: "PATCH",
      body,
    }),
}

export const adminTelemetryApi = {
  overview: () =>
    request<{
      platform_total_tokens: number
      platform_prompt_tokens: number
      platform_completion_tokens: number
      platform_toon_tokens_saved: number
      platform_toon_savings_percentage: number
      platform_total_cost_usd: number
      platform_total_turns: number
      avg_agent_latency_ms: number
      platform_total_tool_runs: number
      avg_tool_latency_ms: number
      platform_total_tenants: number
    }>("/api/admin/agent-telemetry/overview"),

  tenants: () =>
    request<
      {
        organization_id: number
        organization_name: string
        organization_slug: string
        tokens_used_this_month: number
        monthly_token_quota: number
        remaining_tokens: number
        reserved_tokens_in_flight: number
        cost_usd_this_month: number
        monthly_budget_usd: number
        hard_limit_enabled: boolean
        quota_used_percentage: number
        status: "normal" | "warning" | "exceeded"
      }[]
    >("/api/admin/agent-telemetry/tenants"),

  users: (organizationId?: number) => {
    const query = organizationId ? `?organization_id=${organizationId}` : ""
    return request<
      {
        user_uid: string
        organization_id: number
        total_tokens: number
        prompt_tokens: number
        completion_tokens: number
        cost_usd: number
        turns_count: number
        last_active_at: string | null
      }[]
    >(`/api/admin/agent-telemetry/users${query}`)
  },

  timeSeries: (days = 14, organizationId?: number, userUid?: string) => {
    const params = new URLSearchParams({ days: String(days) })
    if (organizationId) params.append("organization_id", String(organizationId))
    if (userUid) params.append("user_uid", userUid)
    return request<
      {
        date: string
        total_tokens: number
        prompt_tokens: number
        completion_tokens: number
        toon_tokens_saved: number
        cost_usd: number
        turns_count: number
      }[]
    >(`/api/admin/agent-telemetry/time-series?${params.toString()}`)
  },

  topOrganizations: () =>
    request<
      {
        organization_id: number
        total_tokens: number
        cost_usd: number
        turns_count: number
      }[]
    >("/api/admin/agent-telemetry/top-organizations"),
}

export const llmApi = {
  models: () => request<LLMModel[]>("/api/llm/models"),
}
