import { useState, useEffect } from "react"
import { Bot, Sparkles, Zap, CheckCircle2, Play, RefreshCw, FileCode } from "lucide-react"
import { adminApiClient, type AgentPerformanceData, type AgentEvalRunResult } from "@/lib/admin-api"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AgentUsageMonitor } from "@/components/agent-usage-monitor"

export function AgentPerformanceView() {
  const [data, setData] = useState<AgentPerformanceData | null>(null)
  const [evalResult, setEvalResult] = useState<AgentEvalRunResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRunningEval, setIsRunningEval] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const result = await adminApiClient.getAgentPerformance()
      setData(result)
    } catch (err) {
      console.error("Agent performance fetch error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRunEvaluation = async () => {
    setIsRunningEval(true)
    try {
      const result = await adminApiClient.runAgentEvaluations("benchmark_eval_suite_v1")
      setEvalResult(result)
    } catch (err) {
      console.error("Failed to run agent evaluation benchmark:", err)
    } finally {
      setIsRunningEval(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  if (isLoading || !data) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground text-xs font-mono">
        <RefreshCw className="h-4 w-4 animate-spin mr-2 text-primary" />
        Loading...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          LLM Provider: <code className="text-foreground font-mono">OpenRouter / OpenAI</code>
        </div>
        <Button
          onClick={handleRunEvaluation}
          disabled={isRunningEval}
          size="sm"
          className="h-8 text-xs gap-1.5 font-semibold"
        >
          {isRunningEval ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
          Run Benchmark
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Agent Runs</span>
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-bold text-foreground">{data.total_agent_runs.toLocaleString()}</div>
            <div className="text-[11px] text-muted-foreground">WebSocket sessions</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Total Tokens</span>
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-bold text-foreground">{(data.total_tokens_consumed / 1000000).toFixed(2)}M</div>
            <div className="text-[11px] text-muted-foreground">OpenRouter + OpenAI</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>TOON Savings</span>
              <Zap className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-foreground">{data.toon_savings_percentage}%</div>
            <div className="text-[11px] text-muted-foreground">{(data.toon_tokens_saved / 1000).toFixed(0)}k tokens saved</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Benchmark Pass Rate</span>
              <CheckCircle2 className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-bold text-foreground">{data.benchmark_pass_rate_percentage}%</div>
            <div className="text-[11px] text-muted-foreground">Tool errors: {data.tool_failure_rate_percentage}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Benchmark Results */}
      {evalResult && (
        <Card className="border-primary/40">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Latest Benchmark Result
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-4 text-xs font-mono">
            <div>
              <span className="text-muted-foreground block">Suite</span>
              <span className="font-bold text-foreground">{evalResult.suite_name}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Score</span>
              <span className="font-bold text-emerald-400">{evalResult.accuracy_score}%</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Passed</span>
              <span className="font-bold text-foreground">{evalResult.passed_tests}/{evalResult.total_tests}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Latency</span>
              <span className="font-bold text-foreground">{evalResult.average_response_time_ms} ms</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comprehensive Real-time Telemetry Monitor */}
      <AgentUsageMonitor organizationId={1} />

      {/* TOON Context Optimization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <FileCode className="h-4 w-4 text-primary" /> TOON Context Optimization
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Tabular JSON datasets are serialized using TOON (<code className="text-primary font-mono">apps/api/modules/agents/toon_utils.py</code>) to reduce prompt token usage.
          </p>

          <div className="grid gap-4 md:grid-cols-2 text-xs font-mono">
            <div className="p-3 rounded-lg border border-border bg-background/30 space-y-1">
              <div className="text-muted-foreground font-semibold">Standard JSON</div>
              <pre className="text-[11px] text-muted-foreground p-2 rounded bg-black/30 overflow-x-auto">
{`[
  {"id": 1, "name": "Product A", "price": 49.99},
  {"id": 2, "name": "Product B", "price": 89.99}
]`}
              </pre>
            </div>

            <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 space-y-1">
              <div className="text-emerald-400 font-semibold">TOON Notation</div>
              <pre className="text-[11px] text-emerald-300 p-2 rounded bg-black/40 overflow-x-auto">
{`[id,name,price]
1,Product A,49.99
2,Product B,89.99`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
