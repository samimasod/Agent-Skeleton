import { TrendingUp, Target, Filter, DollarSign } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

const funnelData = [
  { stage: "Visitors", count: 12400 },
  { stage: "Leads", count: 3200 },
  { stage: "Orgs", count: 850 },
  { stage: "Paid", count: 667 },
]

const leadSourcesData = [
  { source: "Developer Docs", leads: 1420 },
  { source: "GitHub Repo", leads: 980 },
  { source: "Organic Search", leads: 540 },
  { source: "Social Media", leads: 260 },
]

export function MarketingLeadsView() {
  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Inbound Leads</span>
              <Target className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-bold text-foreground">3,200</div>
            <div className="text-[11px] text-muted-foreground">+24% YoY</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Visitor → Lead Rate</span>
              <Filter className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-foreground">25.8%</div>
            <div className="text-[11px] text-muted-foreground">Traffic conversion</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Lead → Paid Rate</span>
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-bold text-foreground">78.5%</div>
            <div className="text-[11px] text-muted-foreground">Paid conversion</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Customer Acq Cost (CAC)</span>
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-bold text-foreground">$142</div>
            <div className="text-[11px] text-muted-foreground">Payback: 1.8 Mo</div>
          </CardContent>
        </Card>
      </div>

      {/* Funnel & Lead Source Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold">Acquisition Funnel</CardTitle>
          </CardHeader>
          <CardContent className="h-60 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={funnelData}>
                <defs>
                  <linearGradient id="funnelGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#beb4fd" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#beb4fd" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="stage" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: "#0d1322", borderRadius: "8px", fontSize: "12px" }} />
                <Area type="monotone" dataKey="count" stroke="#beb4fd" strokeWidth={2} fill="url(#funnelGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold">Lead Sources</CardTitle>
          </CardHeader>
          <CardContent className="h-60 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leadSourcesData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                <YAxis type="category" dataKey="source" stroke="#94a3b8" fontSize={10} width={100} />
                <Tooltip contentStyle={{ backgroundColor: "#0d1322", borderRadius: "8px", fontSize: "12px" }} />
                <Bar dataKey="leads" fill="#006ddd" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
