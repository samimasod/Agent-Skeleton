import { getIdToken } from "./firebase"
import type {
  AdminOverview,
  LLMModel,
  Organization,
  OrganizationDetail,
  OrganizationInvitation,
  OrganizationMember,
  OrganizationMemberInput,
  OrganizationCreate,
  OrganizationUpdate,
  Project,
  ProjectCreateInput,
  ProjectUpdateInput,
  ProjectListResponse,
  Agent,
  AgentCreateInput,
  AgentUpdateInput,
  AgentListResponse,
  AgentTool,
  AgentToolDetail,
  AgentToolCreateInput,
  AgentToolUpdateInput,
  AgentToolListResponse,
  AgentToolRun,
  AgentToolRunList,
  AgentSession,
  AgentSessionDetailResponse,
  AgentSessionListResponse,
  AgentMessage,
  UsageOverview,
  UsageTimeSeriesPoint,
  UsageModelBreakdown,
  UsageAgentBreakdown,
  UsageToolBreakdown,
  OrganizationQuota,
} from "@skeleton/shared-types"

export type {
  AdminOverview,
  LLMModel,
  Organization,
  OrganizationDetail,
  OrganizationInvitation,
  OrganizationMember,
  OrganizationMemberInput,
  OrganizationCreate,
  OrganizationUpdate,
  Project,
  ProjectCreateInput,
  ProjectUpdateInput,
  ProjectListResponse,
  Agent,
  AgentCreateInput,
  AgentUpdateInput,
  AgentListResponse,
  AgentTool,
  AgentToolDetail,
  AgentToolCreateInput,
  AgentToolUpdateInput,
  AgentToolListResponse,
  AgentToolRun,
  AgentToolRunList,
  AgentSession,
  AgentSessionDetailResponse,
  AgentSessionListResponse,
  AgentMessage,
  UsageOverview,
  UsageTimeSeriesPoint,
  UsageModelBreakdown,
  UsageAgentBreakdown,
  UsageToolBreakdown,
  OrganizationQuota,
}

const API_URL = import.meta.env.VITE_API_URL || ""

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  body?: unknown
  headers?: Record<string, string>
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = await getIdToken().catch(() => null)
  const response = await fetch(`${API_URL}${path}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  if (!response.ok) {
    const text = await response.text()
    let parsedMessage: string | null = null
    try {
      const parsed = JSON.parse(text) as { message?: string; detail?: string }
      parsedMessage = parsed.message || parsed.detail || null
    } catch {
      parsedMessage = null
    }
    throw new Error(parsedMessage || text || `Request failed with status ${response.status}`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json()
}

export const authApi = {
  status: () =>
    request<{ authenticated: boolean; is_super_admin: boolean; user: unknown }>("/api/auth/status"),
  me: () => request("/api/auth/me"),
}

export const organizationsApi = {
  list: () => request<{ organizations: Organization[]; total: number }>("/api/organizations"),
  get: (id: number) => request<Organization>(`/api/organizations/${id}`),
  getDetail: (id: number) => request<OrganizationDetail>(`/api/organizations/${id}`),
  listPendingInvitations: () =>
    request<{ invitations: OrganizationInvitation[] }>("/api/organizations/invitations/pending"),
  acceptInvitation: (invitationId: number) =>
    request<Organization>(`/api/organizations/invitations/${invitationId}/accept`, { method: "POST" }),
  create: (data: OrganizationCreate) => request<Organization>("/api/organizations", { method: "POST", body: data }),
  update: (id: number, data: OrganizationUpdate) =>
    request<Organization>(`/api/organizations/${id}`, { method: "PATCH", body: data }),
  delete: (id: number) => request<void>(`/api/organizations/${id}`, { method: "DELETE" }),
  inviteMember: (orgId: number, data: OrganizationMemberInput) =>
    request(`/api/organizations/${orgId}/members`, { method: "POST", body: data }),
}

export const projectsApi = {
  list: (organizationId: number, page = 1, pageSize = 20) =>
    request<ProjectListResponse>(`/api/projects?organization_id=${organizationId}&page=${page}&page_size=${pageSize}`),
  get: (id: number) => request<Project>(`/api/projects/${id}`),
  create: (data: ProjectCreateInput) =>
    request<Project>("/api/projects", { method: "POST", body: data }),
  update: (id: number, data: ProjectUpdateInput) =>
    request<Project>(`/api/projects/${id}`, { method: "PATCH", body: data }),
  delete: (id: number) => request<void>(`/api/projects/${id}`, { method: "DELETE" }),
}

export const adminApi = {
  overview: () => request<AdminOverview>("/api/admin/overview"),
  invalidateOrgRoleCache: () =>
    request<{ invalidated: boolean; namespace: string }>("/api/admin/cache/invalidate-org-roles", {
      method: "POST",
    }),
}

// LLM API
export const llmApi = {
  models: () => request<LLMModel[]>("/api/llm/models"),
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
    return request<AgentToolRunList>(`/api/admin/tools/runs${query}`);
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
    request<import("@skeleton/shared-types").OrganizationQuota>(`/api/agents/usage/quota?organization_id=${organizationId}`, {
      method: "PATCH",
      body,
    }),
}
