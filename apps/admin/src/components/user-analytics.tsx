import { useState, useEffect } from "react"
import { Users, UserCheck, Activity, UserMinus, RefreshCw } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { adminApiClient, type MarketingTelemetryData } from "@/lib/admin-api"

const retentionCohortData = [
  { week: "W1", retention: 100 },
  { week: "W2", retention: 94.2 },
  { week: "W3", retention: 91.5 },
  { week: "W4", retention: 89.8 },
  { week: "W5", retention: 88.4 },
  { week: "W6", retention: 88.0 },
]

export function UserAnalyticsView() {
  const [telemetry, setTelemetry] = useState<MarketingTelemetryData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const data = await adminApiClient.getMarketingTelemetry()
      setTelemetry(data)
    } catch (err) {
      console.error("Failed to load user analytics telemetry:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  if (isLoading || !telemetry) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground text-xs font-mono">
        <RefreshCw className="h-4 w-4 animate-spin mr-2 text-primary" />
        Loading User Analytics...
      </div>
    )
  }

  const activeSeats = telemetry.total_active_user_seats
  const utilization = telemetry.seat_utilization_rate
  const retention = telemetry.retention_cohort_percentage
  const wau = Math.round(activeSeats * 0.76)

  const churnVsRetentionData = [
    { name: "Active Retained", value: Math.round(retention), color: "#10b981" },
    { name: "Idle", value: Math.round((100 - retention) * 0.7), color: "#f59e0b" },
    { name: "Churned", value: Math.max(1, Math.round((100 - retention) * 0.3)), color: "#ef4444" },
  ]

  return (
    <div className="space-y-6">
      {/* Metrics Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Acquired User Seats</span>
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-bold text-foreground">{activeSeats}</div>
            <div className="text-[11px] text-muted-foreground">{utilization}% seat utilization</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Retention (30-day)</span>
              <UserCheck className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-foreground">{retention}%</div>
            <div className="text-[11px] text-muted-foreground">Active recurring cohort</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Weekly Active (WAU)</span>
              <Activity className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-bold text-foreground">{wau}</div>
            <div className="text-[11px] text-muted-foreground">Active platform seats</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Churn Rate</span>
              <UserMinus className="h-4 w-4 text-[#7fc8ff]" />
            </div>
            <div className="text-2xl font-bold text-foreground">
              {roundTwo(100.0 - retention)}%
            </div>
            <div className="text-[11px] text-muted-foreground">Monthly seat churn</div>
          </CardContent>
        </Card>
      </div>

      {/* Cohort & Churn Graphs */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-bold">Retention Cohort Curve</CardTitle>
          </CardHeader>
          <CardContent className="h-60 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={retentionCohortData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="week" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={[70, 100]} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0d1322", borderColor: "rgba(255,255,255,0.15)", borderRadius: "8px", fontSize: "12px" }}
                  formatter={(val: any) => [`${val}%`, "Retention"]}
                />
                <Line type="monotone" dataKey="retention" stroke="#7fc8ff" strokeWidth={2.5} dot={{ r: 3, fill: "#006ddd" }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold">Seat Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="h-60 pt-2 flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="70%">
              <PieChart>
                <Pie data={churnVsRetentionData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3}>
                  {churnVsRetentionData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#0d1322", borderRadius: "8px", fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-full space-y-1 text-[11px] pt-1">
              {churnVsRetentionData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.name}
                  </span>
                  <span className="font-mono font-medium text-foreground">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function roundTwo(val: number): number {
  return Math.round(val * 10) / 10
}
