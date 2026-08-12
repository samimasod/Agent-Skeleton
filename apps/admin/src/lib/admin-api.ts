/** API Client for communicating with Standalone SuperAdmin Microservice (Port 8001). */

const ADMIN_API_BASE = "http://localhost:8001/api/admin"
const STORAGE_KEY = "skeleton_admin_api_key"

export interface AdminAuthStatus {
  admin_auth_enabled: boolean
  environment: string
}

export interface CloudMonitorData {
  environment: string
  database_provider: string
  database_status: string
  active_connections: number
  pool_size: number
  storage_provider: string
  storage_status: string
  storage_bucket: string
  cache_backend: string
  cache_status: string
  cache_hit_ratio: number
  redis_memory_used_mb: number
  api_uptime_seconds: number
  requests_per_minute: number
  average_latency_ms: number
  error_rate_percentage: number
}

export interface AgentPerformanceData {
  total_agent_runs: number
  openrouter_token_count: number
  openai_token_count: number
  total_tokens_consumed: number
  toon_tokens_saved: number
  toon_savings_percentage: number
  average_llm_latency_ms: number
  tool_execution_count: number
  tool_failure_rate_percentage: number
  benchmark_pass_rate_percentage: number
}

export interface AgentEvalRunResult {
  run_id: string
  suite_name: string
  total_tests: number
  passed_tests: number
  failed_tests: number
  accuracy_score: number
  average_response_time_ms: number
  status: string
  executed_at: string
}

export interface MarketingTelemetryData {
  monthly_active_organizations: number
  new_signups_this_month: number
  organization_conversion_rate: number
  workspace_creation_velocity: number
  total_active_user_seats: number
  seat_utilization_rate: number
  top_used_features: string[]
  retention_cohort_percentage: number
}

export interface GovernanceOrg {
  id: number
  name: string
  slug: string
  member_count: number
  project_count: number
  pending_invites: number
  created_at: string
}

export interface GovernanceOverviewData {
  total_organizations: number
  total_projects: number
  total_users: number
  configured_super_admins: string[]
  recent_organizations: GovernanceOrg[]
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }
  const key = localStorage.getItem(STORAGE_KEY)
  if (key) {
    headers["X-Admin-Api-Key"] = key
    headers["Authorization"] = `Bearer ${key}`
  }
  return headers
}

export const adminApiClient = {
  getStoredApiKey(): string {
    return localStorage.getItem(STORAGE_KEY) || ""
  },

  setStoredApiKey(key: string): void {
    localStorage.setItem(STORAGE_KEY, key.trim())
  },

  clearStoredApiKey(): void {
    localStorage.removeItem(STORAGE_KEY)
  },

  async getAuthStatus(): Promise<AdminAuthStatus> {
    const res = await fetch(`${ADMIN_API_BASE}/auth/status`)
    if (!res.ok) throw new Error("Failed to fetch SuperAdmin auth status")
    return res.json()
  },

  async getCloudMonitor(): Promise<CloudMonitorData> {
    const res = await fetch(`${ADMIN_API_BASE}/cloud-monitor`, {
      headers: getAuthHeaders(),
    })
    if (!res.ok) {
      if (res.status === 401) throw new Error("UNAUTHORIZED")
      throw new Error("Failed to fetch cloud monitor metrics")
    }
    return res.json()
  },

  async getAgentPerformance(): Promise<AgentPerformanceData> {
    const res = await fetch(`${ADMIN_API_BASE}/agent-performance`, {
      headers: getAuthHeaders(),
    })
    if (!res.ok) {
      if (res.status === 401) throw new Error("UNAUTHORIZED")
      throw new Error("Failed to fetch agent performance metrics")
    }
    return res.json()
  },

  async runAgentEvaluations(suiteName = "standard_benchmark"): Promise<AgentEvalRunResult> {
    const res = await fetch(`${ADMIN_API_BASE}/agent-performance/evaluations/run`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ suite_name: suiteName }),
    })
    if (!res.ok) {
      if (res.status === 401) throw new Error("UNAUTHORIZED")
      throw new Error("Failed to run agent evaluations benchmark")
    }
    return res.json()
  },

  async getMarketingTelemetry(): Promise<MarketingTelemetryData> {
    const res = await fetch(`${ADMIN_API_BASE}/marketing-telemetry`, {
      headers: getAuthHeaders(),
    })
    if (!res.ok) {
      if (res.status === 401) throw new Error("UNAUTHORIZED")
      throw new Error("Failed to fetch marketing telemetry")
    }
    return res.json()
  },

  async getGovernanceOverview(): Promise<GovernanceOverviewData> {
    const res = await fetch(`${ADMIN_API_BASE}/governance`, {
      headers: getAuthHeaders(),
    })
    if (!res.ok) {
      if (res.status === 401) throw new Error("UNAUTHORIZED")
      throw new Error("Failed to fetch governance overview")
    }
    return res.json()
  },
}
