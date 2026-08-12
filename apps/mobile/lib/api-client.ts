import { getIdToken } from "@/lib/firebase"
import type {
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
  AgentListResponse,
  AgentSessionListResponse,
  AgentSessionDetailResponse,
  AgentMessage,
} from "@skeleton/shared-types"

export type {
  LLMModel,
  Organization,
  OrganizationDetail,
  OrganizationInvitation,
  OrganizationMember,
  OrganizationMemberInput,
  OrganizationCreate,
  OrganizationUpdate,
  Project,
  ProjectListResponse,
  Agent,
  AgentListResponse,
  AgentSessionListResponse,
  AgentSessionDetailResponse,
  AgentMessage,
}

const API_URL = process.env.EXPO_PUBLIC_API_URL || ""

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

// ─── Request Helper ─────────────────────────────────────────────────────────

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = await getIdToken().catch(() => null)
  if (!token) {
    throw new Error("Authentication token is not available yet. Please retry after sign-in finishes.")
  }

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

// ─── APIs ──────────────────────────────────────────────────────────────────

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

export const hsCodesApi = {
  summary: () => request<HSCodeSummary>("/api/hs-codes/summary"),
  search: (query: string, limit = 50) =>
    request<HSCodeListItem[]>(`/api/hs-codes/search?q=${encodeURIComponent(query)}&limit=${limit}`),
  detail: (hscode: string) => request<HSCodeDetail>(`/api/hs-codes/${encodeURIComponent(hscode)}`),
}

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

export const llmApi = {
  models: () => request<LLMModel[]>("/api/llm/models"),
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
  listSessions: (agentId: number, page = 1, pageSize = 20) =>
    request<AgentSessionListResponse>(`/api/agents/${agentId}/sessions?page=${page}&page_size=${pageSize}`),
  getSessionMessages: (sessionId: string, page = 1, pageSize = 20) =>
    request<AgentSessionDetailResponse>(`/api/agents/sessions/${sessionId}/messages?page=${page}&page_size=${pageSize}`),
}
