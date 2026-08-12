import { useState, useEffect } from "react"
import { TrendingUp, Users, Building2, Layers, RefreshCw, Award, Target, CheckCircle2 } from "lucide-react"
import { adminApiClient, type MarketingTelemetryData } from "@/lib/admin-api"

export function MarketingAnalyticsView() {
  const [data, setData] = useState<MarketingTelemetryData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const result = await adminApiClient.getMarketingTelemetry()
      setData(result)
    } catch (err) {
      console.error("Marketing telemetry fetch error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  if (isLoading || !data) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <RefreshCw className="h-6 w-6 animate-spin mr-2 text-primary" />
        Loading Marketing & Conversion Telemetry...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Marketing & Growth Telemetry</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Monitor tenant organization acquisition funnels, seat adoption velocity, and feature usage analytics across the platform.
          </p>
        </div>
        <button
          onClick={() => void loadData()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-lg border border-border bg-card hover:border-primary/50 text-foreground transition-all"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh Analytics
        </button>
      </div>

      {/* Growth Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CardBox
          icon={Building2}
          label="Monthly Active Orgs (MAO)"
          value={data.monthly_active_organizations.toString()}
          sub={`+${data.new_signups_this_month} new signups this month`}
          badge="GROWING"
          color="emerald"
        />
        <CardBox
          icon={Target}
          label="Org Onboarding Conversion"
          value={`${data.organization_conversion_rate}%`}
          sub="Signup → Organization Setup"
          badge="HIGH CONVERSION"
          color="cyan"
        />
        <CardBox
          icon={Users}
          label="Total Active User Seats"
          value={data.total_active_user_seats.toString()}
          sub={`Seat utilization: ${data.seat_utilization_rate}%`}
          badge="88% UTILIZED"
          color="violet"
        />
        <CardBox
          icon={Award}
          label="30-Day Cohort Retention"
          value={`${data.retention_cohort_percentage}%`}
          sub="Active recurring tenant organizations"
          badge="EXCELLENT"
          color="emerald"
        />
      </div>

      {/* Feature Adoption Breakdown */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Top Engaged Platform Features
          </h3>
          <span className="text-xs font-mono text-primary">Feature Usage Breakdown</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {data.top_used_features.map((feature, idx) => (
            <div key={feature} className="p-3.5 rounded-xl border border-border bg-background/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                  #{idx + 1} TOP FEATURE
                </span>
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="font-bold text-xs text-foreground">{feature}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function CardBox({ icon: Icon, label, value, sub, badge, color }: any) {
  const colorMap: Record<string, string> = {
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    cyan: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    violet: "text-violet-400 bg-violet-500/10 border-violet-500/20",
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-2 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <div className={`p-1.5 rounded-lg border ${colorMap[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="text-2xl font-extrabold text-foreground">{value}</div>
      <div className="flex items-center justify-between pt-1">
        <span className="text-[11px] text-muted-foreground truncate">{sub}</span>
        <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
          {badge}
        </span>
      </div>
    </div>
  )
}
