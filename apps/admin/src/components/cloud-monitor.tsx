import { useState, useEffect } from "react"
import { Database, HardDrive, Cpu, Activity, RefreshCw, Server, Zap } from "lucide-react"
import { adminApiClient, type CloudMonitorData } from "@/lib/admin-api"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function CloudMonitorView() {
  const [data, setData] = useState<CloudMonitorData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const result = await adminApiClient.getCloudMonitor()
      setData(result)
    } catch (err) {
      console.error("Cloud monitor fetch error:", err)
    } finally {
      setIsLoading(false)
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
          Environment: <code className="text-foreground font-mono">{data.environment}</code>
        </div>
        <Button variant="outline" size="sm" onClick={() => void loadData()} className="h-8 text-xs gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Database Provider</span>
              <Database className="h-4 w-4 text-primary" />
            </div>
            <div className="text-xl font-bold text-foreground truncate">{data.database_provider.split(" ")[0]}</div>
            <div className="text-[11px] text-muted-foreground">
              Pool: {data.active_connections}/{data.pool_size} active
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Storage Provider</span>
              <HardDrive className="h-4 w-4 text-primary" />
            </div>
            <div className="text-xl font-bold text-foreground">{data.storage_provider}</div>
            <div className="text-[11px] text-muted-foreground truncate">{data.storage_bucket}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Cache Engine</span>
              <Cpu className="h-4 w-4 text-primary" />
            </div>
            <div className="text-xl font-bold text-foreground">{data.cache_backend}</div>
            <div className="text-[11px] text-muted-foreground">Hit Ratio: {data.cache_hit_ratio}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Response Latency</span>
              <Activity className="h-4 w-4 text-primary" />
            </div>
            <div className="text-xl font-bold text-foreground">{data.average_latency_ms} ms</div>
            <div className="text-[11px] text-muted-foreground">{data.requests_per_minute} req/min</div>
          </CardContent>
        </Card>
      </div>

      {/* Details */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Server className="h-4 w-4 text-primary" /> Database Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <DataRow label="Engine" value="Async PostgreSQL (asyncpg + SQLAlchemy 2.0)" />
            <DataRow label="Status" value={data.database_status} />
            <DataRow label="Active Connections" value={`${data.active_connections} / ${data.pool_size}`} />
            <DataRow label="Schema Migration" value="Alembic DDL Migrations" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" /> Storage & Cache
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <DataRow label="Storage Provider" value={data.storage_provider} />
            <DataRow label="Bucket" value={data.storage_bucket} />
            <DataRow label="Cache Backend" value={data.cache_backend} />
            <DataRow label="Cache Hit Ratio" value={`${data.cache_hit_ratio}%`} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/40">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-foreground">{value}</span>
    </div>
  )
}
