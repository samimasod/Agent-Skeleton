import { useEffect, useState } from "react"
import {
  Activity,
  Building2,
  Users,
  DollarSign,
  Cpu,
  RefreshCw,
  Sparkles,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  SlidersHorizontal,
  ArrowUpRight,
  PieChart,
} from "lucide-react"
import { adminTelemetryApi, usageApi } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"

interface OverviewData {
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
}

interface TenantItem {
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
}

interface UserItem {
  user_uid: string
  organization_id: number
  total_tokens: number
  prompt_tokens: number
  completion_tokens: number
  cost_usd: number
  turns_count: number
  last_active_at: string | null
}

interface TimeSeriesPoint {
  date: string
  total_tokens: number
  prompt_tokens: number
  completion_tokens: number
  toon_tokens_saved: number
  cost_usd: number
  turns_count: number
}

type MetricMode = "tokens" | "cost" | "turns" | "toon"

export function SuperAdminTenantUsageDashboard() {
  const [overview, setOverview] = useState<OverviewData | null>(null)
  const [tenants, setTenants] = useState<TenantItem[]>([])
  const [users, setUsers] = useState<UserItem[]>([])
  const [timeSeries, setTimeSeries] = useState<TimeSeriesPoint[]>([])

  // Filter states
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null)
  const [selectedUserUid, setSelectedUserUid] = useState<string>("")
  const [days, setDays] = useState<number>(14)
  const [metricMode, setMetricMode] = useState<MetricMode>("tokens")
  const [searchTenantQuery, setSearchTenantQuery] = useState("")
  const [searchUserQuery, setSearchUserQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  // Inline Quota Editor Modal/Row state
  const [editingOrgId, setEditingOrgId] = useState<number | null>(null)
  const [newQuotaInput, setNewQuotaInput] = useState("")
  const [newBudgetInput, setNewBudgetInput] = useState("")
  const [hardLimitToggle, setHardLimitToggle] = useState(true)
  const [isSavingQuota, setIsSavingQuota] = useState(false)

  const loadDashboardData = async () => {
    setIsLoading(true)
    try {
      const [ovData, tnData, usData, tsData] = await Promise.all([
        adminTelemetryApi.overview().catch(() => null),
        adminTelemetryApi.tenants().catch(() => []),
        adminTelemetryApi.users(selectedOrgId || undefined).catch(() => []),
        adminTelemetryApi.timeSeries(days, selectedOrgId || undefined, selectedUserUid || undefined).catch(() => []),
      ])

      setOverview(ovData)
      setTenants(tnData)
      setUsers(usData)
      setTimeSeries(tsData)
    } catch (err) {
      console.error("Failed to load superadmin usage dashboard:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadDashboardData()
  }, [selectedOrgId, selectedUserUid, days])

  const handleEditQuotaClick = (t: TenantItem) => {
    setEditingOrgId(t.organization_id)
    setNewQuotaInput(String(t.monthly_token_quota))
    setNewBudgetInput(String(t.monthly_budget_usd))
    setHardLimitToggle(t.hard_limit_enabled)
  }

  const handleSaveQuota = async (orgId: number) => {
    setIsSavingQuota(true)
    try {
      await usageApi.updateQuota(orgId, {
        monthly_token_quota: parseInt(newQuotaInput, 10) || 1_000_000,
        monthly_budget_usd: parseFloat(newBudgetInput) || 50.0,
        hard_limit_enabled: hardLimitToggle,
      })
      setEditingOrgId(null)
      await loadDashboardData()
    } catch (err: any) {
      alert(err.message || "Failed to update quota settings")
    } finally {
      setIsSavingQuota(false)
    }
  }

  const filteredTenants = tenants.filter(
    (t) =>
      t.organization_name.toLowerCase().includes(searchTenantQuery.toLowerCase()) ||
      t.organization_slug.toLowerCase().includes(searchTenantQuery.toLowerCase()) ||
      String(t.organization_id).includes(searchTenantQuery)
  )

  const filteredUsers = users.filter(
    (u) =>
      u.user_uid.toLowerCase().includes(searchUserQuery.toLowerCase()) ||
      String(u.organization_id).includes(searchUserQuery)
  )

  // Calculate platform remaining quota across all tenants
  const totalAllocatedQuota = tenants.reduce((sum, t) => sum + t.monthly_token_quota, 0)
  const totalUsedTokens = tenants.reduce((sum, t) => sum + t.tokens_used_this_month, 0)
  const totalRemainingQuota = Math.max(0, totalAllocatedQuota - totalUsedTokens)
  const totalWarningTenants = tenants.filter((t) => t.status === "warning" || t.status === "exceeded").length

  return (
    <div className="space-y-6">
      {/* Header bar & Global Filters Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary" />
              Multi-Tenant AI Usage & Quota Dashboard
            </h1>
            <Badge variant="outline" className="font-mono text-xs bg-primary/10 text-primary border-primary/30">
              SuperAdmin Platform View
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Monitor cross-tenant token consumption, remaining organization token allocations, per-user usage, and interactive telemetry charts.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={loadDashboardData} disabled={isLoading} className="h-9 text-xs gap-1.5 self-start md:self-auto">
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} /> Refresh Analytics
        </Button>
      </div>

      {/* Global Filter Bar */}
      <Card className="border border-border bg-card/80">
        <CardContent className="p-3 sm:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center">
            {/* Organization Select */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                <Filter className="h-3 w-3" /> Tenant Organization
              </label>
              <select
                value={selectedOrgId ?? 0}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10)
                  setSelectedOrgId(val === 0 ? null : val)
                }}
                className="w-full h-8 rounded-md border border-border bg-background px-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value={0}>All Tenants (Global Platform)</option>
                {tenants.map((t) => (
                  <option key={t.organization_id} value={t.organization_id}>
                    Org #{t.organization_id} - {t.organization_name} ({t.remaining_tokens.toLocaleString()} tok left)
                  </option>
                ))}
              </select>
            </div>

            {/* User Search Input */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3" /> Filter by User UID
              </label>
              <Input
                placeholder="All Users or enter UID..."
                value={selectedUserUid}
                onChange={(e) => setSelectedUserUid(e.target.value)}
                className="h-8 text-xs font-mono"
              />
            </div>

            {/* Time Window Buttons */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground">Time Window Range</label>
              <div className="flex rounded-md border border-border p-0.5 bg-background text-xs font-mono h-8 items-center">
                {[7, 14, 30, 90].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDays(d)}
                    className={`flex-1 h-full rounded transition-colors ${days === d ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {d}D
                  </button>
                ))}
              </div>
            </div>

            {/* Metric Mode Toggle */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground">Graph Metric Mode</label>
              <div className="flex rounded-md border border-border p-0.5 bg-background text-xs font-mono h-8 items-center">
                {(["tokens", "cost", "turns", "toon"] as MetricMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMetricMode(m)}
                    className={`flex-1 h-full rounded transition-colors capitalize text-[10px] ${metricMode === m ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Platform KPI Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-card/70 border-border">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs flex items-center justify-between">
              Total Platform Tokens <Cpu className="h-4 w-4 text-primary" />
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-extrabold tracking-tight font-mono">
              {(overview?.platform_total_tokens || 0).toLocaleString()}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 font-mono">
              P: {(overview?.platform_prompt_tokens || 0).toLocaleString()} • C: {(overview?.platform_completion_tokens || 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/70 border-border">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs flex items-center justify-between">
              Remaining Allocation <PieChart className="h-4 w-4 text-blue-500" />
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-extrabold tracking-tight font-mono text-blue-500">
              {totalRemainingQuota.toLocaleString()}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Out of {totalAllocatedQuota.toLocaleString()} allocated
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/70 border-border">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs flex items-center justify-between">
              Total Spend (USD) <DollarSign className="h-4 w-4 text-emerald-500" />
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-extrabold tracking-tight font-mono text-emerald-500">
              ${(overview?.platform_total_cost_usd || 0).toFixed(4)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Across {(overview?.platform_total_turns || 0).toLocaleString()} total turns
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/70 border-border">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs flex items-center justify-between">
              TOON Savings <Sparkles className="h-4 w-4 text-amber-500" />
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-extrabold tracking-tight font-mono text-amber-500">
              {overview?.platform_toon_savings_percentage || 0}%
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 font-mono">
              {(overview?.platform_toon_tokens_saved || 0).toLocaleString()} tokens saved
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/70 border-border">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs flex items-center justify-between">
              Active Tenants <Building2 className="h-4 w-4 text-purple-500" />
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-extrabold tracking-tight font-mono">
              {overview?.platform_total_tenants || tenants.length}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {totalWarningTenants > 0 ? (
                <span className="text-amber-500 font-bold">{totalWarningTenants} near quota limit</span>
              ) : (
                <span className="text-[var(--positive)]">All tenants healthy</span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Interactive & Filterable Dynamic Time-Series Chart */}
      {timeSeries.length > 0 && (
        <Card className="border border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Filterable Telemetry Time-Series Chart
                </CardTitle>
                <CardDescription className="text-xs">
                  {selectedOrgId ? `Filtered for Org #${selectedOrgId}` : "Platform-wide aggregated metrics"} • Displaying <strong className="uppercase font-mono">{metricMode}</strong> over last {days} days
                </CardDescription>
              </div>
              <Badge variant="outline" className="font-mono text-[10px]">
                {selectedUserUid ? `User: ${selectedUserUid.slice(0, 10)}...` : "All Users"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-52 flex items-end gap-2 border-b border-border/50 pb-2">
              {timeSeries.map((point) => {
                let val = point.total_tokens
                if (metricMode === "cost") val = point.cost_usd
                if (metricMode === "turns") val = point.turns_count
                if (metricMode === "toon") val = point.toon_tokens_saved

                const maxVal = Math.max(
                  ...timeSeries.map((p) => {
                    if (metricMode === "cost") return p.cost_usd
                    if (metricMode === "turns") return p.turns_count
                    if (metricMode === "toon") return p.toon_tokens_saved
                    return p.total_tokens
                  }),
                  1
                )

                const heightPct = Math.max(8, Math.round((val / maxVal) * 100))

                return (
                  <div key={point.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                    {/* Hover Tooltip */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:block z-20 bg-popover text-popover-foreground p-2.5 rounded shadow-xl text-[11px] font-mono whitespace-nowrap border border-border">
                      <p className="font-bold text-primary border-b border-border pb-1 mb-1">{point.date}</p>
                      <p>Total Tokens: {point.total_tokens.toLocaleString()}</p>
                      <p className="text-muted-foreground text-[10px]">Prompt: {point.prompt_tokens.toLocaleString()} | Comp: {point.completion_tokens.toLocaleString()}</p>
                      <p className="text-emerald-500">Cost: ${point.cost_usd.toFixed(4)}</p>
                      <p>Turns: {point.turns_count}</p>
                      <p className="text-amber-500">TOON Saved: {point.toon_tokens_saved.toLocaleString()}</p>
                    </div>

                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full rounded-t transition-all ${
                        metricMode === "cost"
                          ? "bg-emerald-500/80 hover:bg-emerald-500"
                          : metricMode === "toon"
                          ? "bg-amber-500/80 hover:bg-amber-500"
                          : metricMode === "turns"
                          ? "bg-purple-500/80 hover:bg-purple-500"
                          : "bg-primary/80 hover:bg-primary"
                      }`}
                    />
                    <span className="text-[9px] font-mono text-muted-foreground truncate w-full text-center">
                      {point.date.slice(5)}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Per-Tenant Usage & Remaining Tokens Data Table */}
      <Card className="border border-border">
        <CardHeader className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Per-Tenant Usage & Remaining Token Allocations
            </CardTitle>
            <CardDescription className="text-xs">
              Monitor monthly token usage, remaining tokens, USD spend, and adjust organization limits.
            </CardDescription>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search tenant name or ID..."
              value={searchTenantQuery}
              onChange={(e) => setSearchTenantQuery(e.target.value)}
              className="pl-8 h-8 text-xs font-mono"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="text-xs">
                <TableHead>Org ID</TableHead>
                <TableHead>Tenant Name</TableHead>
                <TableHead className="text-right">Tokens Used</TableHead>
                <TableHead className="text-right">Monthly Quota</TableHead>
                <TableHead className="text-right">Remaining Tokens</TableHead>
                <TableHead className="text-right">USD Cost</TableHead>
                <TableHead className="text-center">Quota %</TableHead>
                <TableHead className="text-center">Policy Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-xs font-mono">
              {filteredTenants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-6 text-muted-foreground font-sans">
                    No tenant organizations found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTenants.map((t) => (
                  <TableRow key={t.organization_id} className={selectedOrgId === t.organization_id ? "bg-primary/5" : ""}>
                    <TableCell className="font-semibold">#{t.organization_id}</TableCell>
                    <TableCell className="font-sans">
                      <div className="font-bold">{t.organization_name}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">{t.organization_slug}</div>
                    </TableCell>
                    <TableCell className="text-right font-bold">{t.tokens_used_this_month.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{t.monthly_token_quota.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-bold text-blue-500">
                      {t.remaining_tokens.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-emerald-500">${t.cost_usd_this_month.toFixed(4)}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Progress value={Math.min(100, t.quota_used_percentage)} className="w-12 h-1.5" />
                        <span className="text-[10px]">{t.quota_used_percentage}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {t.status === "exceeded" ? (
                        <Badge variant="destructive" className="text-[10px]">Exceeded</Badge>
                      ) : t.status === "warning" ? (
                        <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-500 border-amber-500/30">Near Quota</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] bg-[var(--positive)]/10 text-[var(--positive)] border-[var(--positive)]/30">Normal</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditQuotaClick(t)}
                        className="h-7 text-[11px] px-2 text-primary"
                      >
                        <SlidersHorizontal className="h-3 w-3 mr-1" /> Adjust Quota
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Inline Quota Adjuster Panel */}
          {editingOrgId && (
            <div className="p-4 bg-card border-t border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold flex items-center gap-1.5">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
                  Adjust Quota Settings for Org #{editingOrgId}
                </span>
                <Button variant="ghost" size="sm" onClick={() => setEditingOrgId(null)} className="h-6 text-[10px]">
                  Cancel
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                <div>
                  <label className="text-[11px] text-muted-foreground font-semibold">Monthly Token Quota</label>
                  <Input
                    type="number"
                    value={newQuotaInput}
                    onChange={(e) => setNewQuotaInput(e.target.value)}
                    className="h-8 text-xs font-mono mt-1"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground font-semibold">Monthly USD Budget ($)</label>
                  <Input
                    type="number"
                    value={newBudgetInput}
                    onChange={(e) => setNewBudgetInput(e.target.value)}
                    className="h-8 text-xs font-mono mt-1"
                  />
                </div>
                <div className="flex items-center gap-2 h-8 pb-1">
                  <Switch id="super-hard-limit" checked={hardLimitToggle} onCheckedChange={setHardLimitToggle} />
                  <label htmlFor="super-hard-limit" className="text-xs font-semibold cursor-pointer">Enforce Hard Limit</label>
                </div>
                <div>
                  <Button size="sm" onClick={() => handleSaveQuota(editingOrgId)} disabled={isSavingQuota} className="h-8 w-full text-xs font-bold">
                    Apply Quota Policy
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Per-User Usage Telemetry Data Table */}
      <Card className="border border-border">
        <CardHeader className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Per-User AI Consumption Breakdown
            </CardTitle>
            <CardDescription className="text-xs">
              Detailed token usage, prompt vs. completion split, USD cost, and agent turns per user.
            </CardDescription>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search user UID or Org ID..."
              value={searchUserQuery}
              onChange={(e) => setSearchUserQuery(e.target.value)}
              className="pl-8 h-8 text-xs font-mono"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="text-xs">
                <TableHead>User UID</TableHead>
                <TableHead>Org ID</TableHead>
                <TableHead className="text-right">Total Tokens</TableHead>
                <TableHead className="text-right">Prompt Tokens</TableHead>
                <TableHead className="text-right">Completion Tokens</TableHead>
                <TableHead className="text-right">USD Cost</TableHead>
                <TableHead className="text-right">Turns Count</TableHead>
                <TableHead className="text-right">Last Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-xs font-mono">
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6 text-muted-foreground font-sans">
                    No user usage recorded yet.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((u) => (
                  <TableRow key={`${u.user_uid}-${u.organization_id}`}>
                    <TableCell className="font-semibold">{u.user_uid}</TableCell>
                    <TableCell>#{u.organization_id}</TableCell>
                    <TableCell className="text-right font-bold">{u.total_tokens.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{u.prompt_tokens.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{u.completion_tokens.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-emerald-500">${u.cost_usd.toFixed(4)}</TableCell>
                    <TableCell className="text-right font-bold">{u.turns_count}</TableCell>
                    <TableCell className="text-right text-muted-foreground text-[10px]">
                      {u.last_active_at ? new Date(u.last_active_at).toLocaleString() : "N/A"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
