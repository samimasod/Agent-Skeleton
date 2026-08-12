import { Share2, Globe, Eye, MessageSquare } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

const socialReferralsData = [
  { platform: "X / Twitter", visits: 4820, signups: 620 },
  { platform: "LinkedIn", visits: 3940, signups: 540 },
  { platform: "YouTube", visits: 2850, signups: 310 },
  { platform: "Dev.to", visits: 2100, signups: 280 },
  { platform: "Reddit", visits: 1650, signups: 190 },
]

const engagementRadarData = [
  { metric: "Mentions", score: 88 },
  { metric: "CTR", score: 76 },
  { metric: "Views", score: 92 },
  { metric: "Shares", score: 84 },
  { metric: "Stars", score: 95 },
]

export function SocialMediaAnalyticsView() {
  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Referral Clicks</span>
              <Share2 className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-bold text-foreground">15,360</div>
            <div className="text-[11px] text-muted-foreground">+32% vs last month</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Brand Impressions</span>
              <Eye className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-foreground">485.2K</div>
            <div className="text-[11px] text-muted-foreground">Across networks</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Social Signups</span>
              <Globe className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-bold text-foreground">1,940</div>
            <div className="text-[11px] text-muted-foreground">12.6% conversion</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Community Mentions</span>
              <MessageSquare className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-bold text-foreground">420</div>
            <div className="text-[11px] text-muted-foreground">Monthly total</div>
          </CardContent>
        </Card>
      </div>

      {/* Social Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold">Referrals & Signups</CardTitle>
          </CardHeader>
          <CardContent className="h-60 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={socialReferralsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="platform" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: "#0d1322", borderRadius: "8px", fontSize: "12px" }} />
                <Bar dataKey="visits" name="Visits" fill="#7fc8ff" radius={[4, 4, 0, 0]} />
                <Bar dataKey="signups" name="Signups" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold">Engagement Radar</CardTitle>
          </CardHeader>
          <CardContent className="h-60 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={engagementRadarData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="metric" stroke="#94a3b8" fontSize={10} />
                <PolarRadiusAxis stroke="#94a3b8" fontSize={9} domain={[0, 100]} />
                <Radar name="Score" dataKey="score" stroke="#beb4fd" fill="#beb4fd" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
