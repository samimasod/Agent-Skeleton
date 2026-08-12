import { useState, useEffect } from "react"
import { Building2, Users, Shield, FolderKanban, Search, RefreshCw } from "lucide-react"
import { adminApiClient, type GovernanceOverviewData } from "@/lib/admin-api"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function TenantGovernanceView() {
  const [data, setData] = useState<GovernanceOverviewData | null>(null)
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const result = await adminApiClient.getGovernanceOverview()
      setData(result)
    } catch (err) {
      console.error("Governance overview fetch error:", err)
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

  const filteredOrgs = data.recent_organizations.filter(
    (org) =>
      org.name.toLowerCase().includes(search.toLowerCase()) ||
      org.slug.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          SuperAdmins: <code className="text-foreground font-mono">{data.configured_super_admins.join(", ")}</code>
        </div>
        <Button variant="outline" size="sm" onClick={() => void loadData()} className="h-8 text-xs gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh Directory
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Organizations</span>
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-bold text-foreground">{data.total_organizations}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Workspaces</span>
              <FolderKanban className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-bold text-foreground">{data.total_projects}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>User Memberships</span>
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-bold text-foreground">{data.total_users}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Super Admins</span>
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-bold text-foreground">{data.configured_super_admins.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Directory Table */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" /> Tenant Directory
          </CardTitle>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Filter by name or slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-8 text-xs"
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {filteredOrgs.map((org) => (
            <div key={org.id} className="flex items-center justify-between p-3.5 rounded-lg border border-border/50 bg-background/30 text-xs">
              <div>
                <div className="font-bold text-foreground flex items-center gap-2">
                  {org.name}
                  <span className="text-[10px] font-mono text-muted-foreground">@{org.slug}</span>
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5 flex gap-4">
                  <span>{org.member_count} members</span>
                  <span>{org.project_count} workspaces</span>
                  <span>{org.pending_invites} pending invites</span>
                </div>
              </div>
              <div className="font-mono text-[10px] text-muted-foreground">
                ID #{org.id}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
