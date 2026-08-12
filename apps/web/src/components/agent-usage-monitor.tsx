import { useEffect, useState } from "react"
import {
  Activity,
  DollarSign,
  Cpu,
  Clock,
  RefreshCw,
  Sparkles,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Bot,
  Layers,
  SlidersHorizontal,
} from "lucide-react"
import {
  usageApi,
  type UsageOverview,
  type UsageTimeSeriesPoint,
  type UsageModelBreakdown,
  type UsageAgentBreakdown,
  type UsageToolBreakdown,
  type OrganizationQuota,
} from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"

interface AgentUsageMonitorProps {
  organizationId: number
  className?: string
}

export function AgentUsageMonitor({ organizationId, className = "" }: AgentUsageMonitorProps) {
  const [overview, setOverview] = useState<UsageOverview | null>(null)
  const [timeSeries, setTimeSeries] = useState<UsageTimeSeriesPoint[]>([])
  const [models, setModels] = useState<UsageModelBreakdown[]>([])
  const [agents, setAgents] = useState<UsageAgentBreakdown[]>([])
  const [tools, setTools] = useState<UsageToolBreakdown[]>([])
  const [quota, setQuota] = useState<OrganizationQuota | null>(null)

  const [days, setDays] = useState<number>(14)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditingQuota, setIsEditingQuota] = useState(false)
  const [newQuotaInput, setNewQuotaInput] = useState("")
  const [newBudgetInput, setNewBudgetInput] = useState("")
  const [hardLimitToggle, setHardLimitToggle] = useState(true)
  const [isSavingQuota, setIsSavingQuota] = useState(false)

  const fetchTelemetryData = async () => {
    setIsLoading(true)
    try {
      const [ovData, tsData, mdData, agData, tlData, qtData] = await Promise.all([
        usageApi.overview(organizationId).catch(() => null),
        usageApi.timeSeries(organizationId, days).catch(() => []),
        usageApi.models(organizationId).catch(() => []),
        usageApi.agents(organizationId).catch(() => []),
        usageApi.tools(organizationId).catch(() => []),
        usageApi.getQuota(organizationId).catch(() => null),
      ])

      setOverview(ovData)
      setTimeSeries(tsData)
      setModels(mdData)
      setAgents(agData)
      setTools(tlData)
      setQuota(qtData)

      if (qtData) {
        setNewQuotaInput(String(qtData.monthly_token_quota))
        setNewBudgetInput(String(qtData.monthly_budget_usd))
        setHardLimitToggle(qtData.hard_limit_enabled)
      }
    } catch (err) {
      console.error("Failed to load telemetry:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void fetchTelemetryData()
  }, [organizationId, days])

  const handleSaveQuota = async () => {
    setIsSavingQuota(true)
    try {
      const updated = await usageApi.updateQuota(organizationId, {
        monthly_token_quota: parseInt(newQuotaInput, 10) || 1_000_000,
        monthly_budget_usd: parseFloat(newBudgetInput) || 50.0,
        hard_limit_enabled: hardLimitToggle,
      })
      setQuota(updated)
      setIsEditingQuota(false)
    } catch (err: any) {
      alert(err.message || "Failed to update quota settings")
    } finally {
      setIsSavingQuota(false)
    }
  }

  const quotaPct = quota ? quota.quota_used_percentage : 0
  const isNearLimit = quotaPct >= (quota?.alert_threshold_percentage || 80)

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              AI Agent Usage & Cost Telemetry
            </h2>
            <Badge variant="outline" className="font-mono text-[10px] bg-primary/5 text-primary border-primary/20">
              Org #{organizationId}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time token consumption, estimated USD spend, TOON efficiency, and tool reliability metrics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border p-0.5 bg-card text-xs font-mono">
            <button
              onClick={() => setDays(7)}
              className={`px-2.5 py-1 rounded-md transition-colors ${days === 7 ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground hover:text-foreground"}`}
            >
              7D
            </button>
            <button
              onClick={() => setDays(14)}
              className={`px-2.5 py-1 rounded-md transition-colors ${days === 14 ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground hover:text-foreground"}`}
            >
              14D
            </button>
            <button
              onClick={() => setDays(30)}
              className={`px-2.5 py-1 rounded-md transition-colors ${days === 30 ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground hover:text-foreground"}`}
            >
              30D
            </button>
          </div>

          <Button variant="outline" size="sm" onClick={fetchTelemetryData} disabled={isLoading} className="h-8 text-xs gap-1.5">
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </div>

      {/* Monthly Quota & Reservation Banner */}
      {quota && (
        <Card className={`border ${isNearLimit ? "border-amber-500/40 bg-amber-500/5" : "border-border bg-card/60"}`}>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                {isNearLimit ? (
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-[var(--positive)]" />
                )}
                <span className="text-xs font-extrabold tracking-tight">Monthly Token Budget & Quota</span>
                <Badge variant={quota.hard_limit_enabled ? "default" : "secondary"} className="text-[10px]">
                  {quota.hard_limit_enabled ? "Hard Limit Active" : "Soft Limit Only"}
                </Badge>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="text-muted-foreground">
                  Used: <strong className="text-foreground">{quota.tokens_used_this_month.toLocaleString()}</strong> / {quota.monthly_token_quota.toLocaleString()} tokens
                </span>
                {quota.reserved_tokens_in_flight > 0 && (
                  <span className="text-amber-500 text-[11px]">
                    ({quota.reserved_tokens_in_flight.toLocaleString()} in flight)
                  </span>
                )}
                <Button variant="ghost" size="sm" onClick={() => setIsEditingQuota(!isEditingQuota)} className="h-6 text-[11px] px-2 text-primary">
                  <SlidersHorizontal className="h-3 w-3 mr-1" /> Configure Quota
                </Button>
              </div>
            </div>

            <Progress value={Math.min(100, quotaPct)} className="h-2" />

            {/* Inline Quota Editor */}
            {isEditingQuota && (
              <div className="mt-4 pt-3 border-t border-border/50 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
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
                  <Switch id="hard-limit" checked={hardLimitToggle} onCheckedChange={setHardLimitToggle} />
                  <label htmlFor="hard-limit" className="text-xs font-semibold cursor-pointer">Enforce Hard Limit</label>
                </div>
                <div>
                  <Button size="sm" onClick={handleSaveQuota} disabled={isSavingQuota} className="h-8 w-full text-xs font-bold">
                    Save Quota Policy
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Top Telemetry Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/70 border-border">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs flex items-center justify-between">
              Total Tokens Used <Cpu className="h-4 w-4 text-primary" />
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-extrabold tracking-tight font-mono">
              {(overview?.total_tokens || 0).toLocaleString()}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 font-mono">
              Prompt: {(overview?.prompt_tokens || 0).toLocaleString()} • Completion: {(overview?.completion_tokens || 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/70 border-border">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs flex items-center justify-between">
              Estimated Spend <DollarSign className="h-4 w-4 text-emerald-500" />
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-extrabold tracking-tight font-mono text-emerald-500">
              ${(overview?.total_cost_usd || 0).toFixed(4)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Based on model completion rate cards
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/70 border-border">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs flex items-center justify-between">
              TOON Token Savings <Sparkles className="h-4 w-4 text-amber-500" />
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-extrabold tracking-tight font-mono text-amber-500">
              {overview?.toon_savings_percentage || 0}%
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 font-mono">
              {(overview?.toon_tokens_saved || 0).toLocaleString()} tokens saved via TOON
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/70 border-border">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs flex items-center justify-between">
              Avg Turn Latency <Clock className="h-4 w-4 text-blue-500" />
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-extrabold tracking-tight font-mono">
              {overview?.avg_latency_ms || 0} ms
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {(overview?.total_turns || 0).toLocaleString()} total agent turns
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Time-Series Chart Component */}
      {timeSeries.length > 0 && (
        <Card className="border border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Daily Token & Cost Activity
            </CardTitle>
            <CardDescription className="text-xs">Token consumption and estimated USD cost per day.</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-44 flex items-end gap-2 border-b border-border/50 pb-2">
              {timeSeries.map((point) => {
                const maxTokens = Math.max(...timeSeries.map((p) => p.total_tokens), 1)
                const heightPct = Math.max(10, Math.round((point.total_tokens / maxTokens) * 100))
                return (
                  <div key={point.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                    {/* Hover tooltip */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:block z-10 bg-popover text-popover-foreground p-2 rounded shadow-md text-[10px] font-mono whitespace-nowrap border border-border">
                      <p className="font-bold">{point.date}</p>
                      <p>Tokens: {point.total_tokens.toLocaleString()}</p>
                      <p>Cost: ${point.cost_usd.toFixed(4)}</p>
                      <p>Turns: {point.turns_count}</p>
                    </div>
                    <div
                      style={{ height: `${heightPct}%` }}
                      className="w-full bg-primary/80 hover:bg-primary rounded-t transition-all"
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

      {/* Detailed Breakdown Tabs */}
      <Tabs defaultValue="models" className="w-full space-y-4">
        <TabsList className="grid w-full grid-cols-3 text-xs">
          <TabsTrigger value="models" className="gap-1.5">
            <Layers className="h-3.5 w-3.5" /> Models & Providers
          </TabsTrigger>
          <TabsTrigger value="agents" className="gap-1.5">
            <Bot className="h-3.5 w-3.5" /> Agent Profiles
          </TabsTrigger>
          <TabsTrigger value="tools" className="gap-1.5">
            <Wrench className="h-3.5 w-3.5" /> Tool Reliability
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Models & Providers */}
        <TabsContent value="models">
          <Card className="border border-border">
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Consumption by LLM Model</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="text-xs">
                    <TableHead>Model ID</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead className="text-right">Total Tokens</TableHead>
                    <TableHead className="text-right">Estimated Cost</TableHead>
                    <TableHead className="text-right">Turns</TableHead>
                    <TableHead className="text-right">Avg Latency</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-xs font-mono">
                  {models.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-muted-foreground font-sans">
                        No model usage recorded yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    models.map((m) => (
                      <TableRow key={`${m.provider}-${m.model_id}`}>
                        <TableCell className="font-semibold">{m.model_id}</TableCell>
                        <TableCell className="text-muted-foreground uppercase text-[10px]">{m.provider}</TableCell>
                        <TableCell className="text-right">{m.total_tokens.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-emerald-500">${m.cost_usd.toFixed(4)}</TableCell>
                        <TableCell className="text-right">{m.turns_count}</TableCell>
                        <TableCell className="text-right">{m.avg_latency_ms} ms</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Agents */}
        <TabsContent value="agents">
          <Card className="border border-border">
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Consumption by Agent Profile</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="text-xs">
                    <TableHead>Agent ID</TableHead>
                    <TableHead>Agent Name</TableHead>
                    <TableHead className="text-right">Total Tokens</TableHead>
                    <TableHead className="text-right">Estimated Cost</TableHead>
                    <TableHead className="text-right">Turns</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-xs font-mono">
                  {agents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-muted-foreground font-sans">
                        No agent usage recorded yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    agents.map((a) => (
                      <TableRow key={a.agent_id}>
                        <TableCell>#{a.agent_id}</TableCell>
                        <TableCell className="font-semibold font-sans">{a.agent_name}</TableCell>
                        <TableCell className="text-right">{a.total_tokens.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-emerald-500">${a.cost_usd.toFixed(4)}</TableCell>
                        <TableCell className="text-right">{a.turns_count}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Tools Reliability */}
        <TabsContent value="tools">
          <Card className="border border-border">
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Tool Execution Reliability & Approvals</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="text-xs">
                    <TableHead>Tool Name</TableHead>
                    <TableHead className="text-right">Total Runs</TableHead>
                    <TableHead className="text-right">Success</TableHead>
                    <TableHead className="text-right">Failures</TableHead>
                    <TableHead className="text-right">Approved</TableHead>
                    <TableHead className="text-right">Rejected</TableHead>
                    <TableHead className="text-right">Avg Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-xs font-mono">
                  {tools.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6 text-muted-foreground font-sans">
                        No tool runs recorded yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    tools.map((t) => (
                      <TableRow key={t.tool_name}>
                        <TableCell className="font-semibold">{t.tool_name}</TableCell>
                        <TableCell className="text-right">{t.total_runs}</TableCell>
                        <TableCell className="text-right text-[var(--positive)]">{t.successful_runs}</TableCell>
                        <TableCell className="text-right text-destructive">{t.failed_runs}</TableCell>
                        <TableCell className="text-right text-blue-500">{t.approved_runs}</TableCell>
                        <TableCell className="text-right text-amber-500">{t.rejected_runs}</TableCell>
                        <TableCell className="text-right">{t.avg_duration_ms} ms</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
