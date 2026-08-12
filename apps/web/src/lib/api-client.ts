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

export interface HSCodeSummary {
  total_codes: number
  section_count: number
  active_chapter_count: number
  chapter_count_including_reserved_77: number
  heading_count: number
  subheading_count: number
  deepest_level: number
}

export interface HSCodeListItem {
  id: number
  section: string
  hscode: string
  description: string
  level: number
  parent_hscode?: string | null
}

export interface HSCodeDetail extends HSCodeListItem {
  parent?: HSCodeListItem | null
  children: HSCodeListItem[]
}

export interface ClassifiedMatch {
  hscode: string
  description: string
  section: string
  level: number
  confidence: number
  reasoning: string
  is_winner: boolean
}

export interface ClassificationRequest {
  description: string
  parent_id?: string | null
  image_base64?: string | null
  feedback?: string | null
  previous_results?: ClassifiedMatch[] | null
  strategy_name?: string | null
  model_id?: string | null
}

export interface ClassifyStrategy {
  name: string
  description: string
  supports_vision: boolean
  is_default: boolean
}

export interface ClassificationResponse {
  id?: string | null
  summary: string
  top_matches: ClassifiedMatch[]
  search_terms_used: string[]
  passes: number
  disclaimer: string
}

export interface ClassificationRun {
  id: string
  user_uid: string
  parent_id: string | null
  description: string
  feedback: string | null
  image_url: string | null
  results: ClassificationResponse | null
  status: "pending" | "completed" | "error"
  created_at: string
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
  hsCodeSummary: () => request<HSCodeSummary>("/api/admin/hs-codes/summary"),
  searchHsCodes: (query: string, limit = 50) =>
    request<HSCodeListItem[]>(`/api/admin/hs-codes/search?q=${encodeURIComponent(query)}&limit=${limit}`),
  hsCodeDetail: (hscode: string) => request<HSCodeDetail>(`/api/admin/hs-codes/${encodeURIComponent(hscode)}`),
}

// HS Codes API — available to all authenticated users (read-only)
export const hsCodesApi = {
  summary: () => request<HSCodeSummary>("/api/hs-codes/summary"),
  search: (query: string, limit = 50) =>
    request<HSCodeListItem[]>(`/api/hs-codes/search?q=${encodeURIComponent(query)}&limit=${limit}`),
  detail: (hscode: string) => request<HSCodeDetail>(`/api/hs-codes/${encodeURIComponent(hscode)}`),
}

// Classification API — POST streams NDJSON; caller owns the ReadableStream
export const classifyApi = {
  stream: async (body: ClassificationRequest): Promise<Response> => {
    const token = await getIdToken().catch(() => null)
    return fetch(`${API_URL}/api/hs-codes/classify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    })
  },
  history: (limit = 20) => request<ClassificationRun[]>(`/api/hs-codes/classify/history?limit=${limit}`),
  getRun: (id: string) => request<ClassificationRun>(`/api/hs-codes/classify/history/${id}`),
  strategies: () => request<ClassifyStrategy[]>("/api/hs-codes/classify/strategies"),
}

// LLM API
export const llmApi = {
  models: () => request<LLMModel[]>("/api/llm/models"),
}

// Eval API (Admin Only)
export interface EvalStrategyLeaderboard {
  strategy_name: string
  model_id: string
  top1_accuracy: number
  top3_accuracy: number
  avg_confidence: number
  avg_latency_ms: number
  avg_cost_usd: number | null
  total_input_tokens: number
  total_output_tokens: number
  samples_run: number
  errors: number
}

export interface EvalSampleResult {
  sample_id: number
  description: string
  correct_hscode: string
  strategy_name: string
  top1_hscode: string | null
  top1_hit: boolean
  top3_hit: boolean
  top1_confidence: number
  latency_ms: number
  input_tokens: number
  output_tokens: number
  estimated_cost_usd: number | null
  error: string | null
}

export interface EvalRunResponse {
  id?: number
  dataset_id: number
  dataset_name: string
  total_samples: number
  leaderboard: EvalStrategyLeaderboard[]
  sample_results: EvalSampleResult[]
  created_at?: string
}

export interface EvalDataset {
  id: number
  name: string
  description: string | null
  created_by: string | null
  created_at: string
  sample_count: number
}

export interface EvalRunHistorySummary {
  id: number
  dataset_id: number
  model_id: string | null
  strategies: string
  total_samples: number
  leaderboard: EvalStrategyLeaderboard[]
  created_by: string | null
  created_at: string
}

export const evalApi = {
  listDatasets: () => request<EvalDataset[]>("/api/admin/eval/datasets"),
  run: (dataset_id: number, strategy_names: string[], model_id?: string) =>
    request<EvalRunResponse>("/api/admin/eval/run", {
      method: "POST",
      body: { dataset_id, strategy_names, model_id },
    }),
  listRuns: () => request<EvalRunHistorySummary[]>("/api/admin/eval/runs"),
  getRun: (id: number) => request<EvalRunResponse>(`/api/admin/eval/runs/${id}`),
  deleteRun: (id: number) => request<void>(`/api/admin/eval/runs/${id}`, { method: "DELETE" }),
}

export interface TariffCalculationRequest {
  hscode: string
  jurisdiction_code: string
  cif_value: number
  origin_country_code?: string | null
  as_of_date?: string | null
}

export interface TariffMeasure {
  measure_type: string
  rate_type: string
  rate_value: number
  currency: string | null
  unit: string | null
  agreement_code: string | null
  origin_country_code: string | null
  condition_text: string | null
  is_preferential: boolean
  calculated_amount: number | null
  calculation_base: string | null
}

export interface TariffCalculationResult {
  hscode: string
  jurisdiction_code: string
  origin_country_code: string | null
  as_of_date: string
  measures: TariffMeasure[]
  total_ad_valorem_rate: number
  total_calculated_amount: number
  disclaimer: string | null
}

export const tariffsApi = {
  calculate: (body: TariffCalculationRequest) =>
    request<TariffCalculationResult>("/api/tariffs/calculate", {
      method: "POST",
      body,
    }),
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
