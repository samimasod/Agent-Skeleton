import { useState, useEffect } from "react"
import { Lock, Key, ArrowRight, LogOut, Mail, UserCheck } from "lucide-react"
import { adminApiClient, type AdminAuthStatus } from "@/lib/admin-api"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

import { AdminSidebar, type AdminTabKey } from "@/components/admin-sidebar"
import { OverviewDashboardView } from "@/components/overview-dashboard"
import { UserAnalyticsView } from "@/components/user-analytics"
import { MarketingLeadsView } from "@/components/marketing-leads"
import { SocialMediaAnalyticsView } from "@/components/social-media-analytics"
import { CloudMonitorView } from "@/components/cloud-monitor"
import { AgentPerformanceView } from "@/components/agent-performance"
import { TenantGovernanceView } from "@/components/tenant-governance"
import { AgentBuilderView } from "@/components/agent-builder"
import { AdminToolsPage } from "@/components/admin-tools"
import { SuperAdminTenantUsageDashboard } from "@/components/superadmin-tenant-usage"

export default function App() {
  const [activeTab, setActiveTab] = useState<AdminTabKey>("overview")
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false)
  const [authStatus, setAuthStatus] = useState<AdminAuthStatus | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true)
  
  // Auth Form State
  const [authMethod, setAuthMethod] = useState<"firebase" | "apikey">("firebase")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [inputApiKey, setInputApiKey] = useState("")
  const [authError, setAuthError] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)

  useEffect(() => {
    async function checkAuth() {
      try {
        const status = await adminApiClient.getAuthStatus()
        setAuthStatus(status)

        if (!status.admin_auth_enabled) {
          setIsAuthenticated(true)
          return
        }

        const savedKey = adminApiClient.getStoredApiKey()
        if (!savedKey) {
          setIsAuthenticated(false)
          return
        }

        await adminApiClient.getCloudMonitor()
        setIsAuthenticated(true)
      } catch (err: any) {
        if (err.message === "UNAUTHORIZED") {
          setIsAuthenticated(false)
        }
      }
    }

    void checkAuth()
  }, [])

  const handleApiKeyLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputApiKey.trim()) return

    setIsVerifying(true)
    setAuthError("")

    try {
      adminApiClient.setStoredApiKey(inputApiKey.trim())
      await adminApiClient.getCloudMonitor()
      setIsAuthenticated(true)
    } catch (err: any) {
      console.error("SuperAdmin login error:", err)
      setAuthError("Invalid API Key or credentials.")
      setIsAuthenticated(false)
      adminApiClient.clearStoredApiKey()
    } finally {
      setIsVerifying(false)
    }
  }

  const handleFirebaseLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setIsVerifying(true)
    setAuthError("")

    try {
      const token = `mock_firebase_admin_token_${btoa(email.trim())}`
      adminApiClient.setStoredApiKey(token)
      await adminApiClient.getCloudMonitor()
      setIsAuthenticated(true)
    } catch (err: any) {
      console.error("Firebase auth error:", err)
      setAuthError(`Authentication failed for '${email}'.`)
      setIsAuthenticated(false)
      adminApiClient.clearStoredApiKey()
    } finally {
      setIsVerifying(false)
    }
  }

  const handleLogout = () => {
    adminApiClient.clearStoredApiKey()
    setIsAuthenticated(false)
    setInputApiKey("")
    setEmail("")
    setPassword("")
  }

  if (!isAuthenticated && authStatus?.admin_auth_enabled) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-border bg-card shadow-2xl relative overflow-hidden">
          <CardHeader className="text-center space-y-2 border-b border-border/50 pb-6">
            <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 mb-2">
              <Lock className="h-6 w-6" />
            </div>
            <CardTitle className="text-xl font-extrabold tracking-tight">SuperAdmin Portal</CardTitle>
            <CardDescription className="text-xs">
              Authentication required.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {authError && (
              <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive font-medium text-center">
                {authError}
              </div>
            )}

            <Tabs value={authMethod} onValueChange={(v) => setAuthMethod(v as "firebase" | "apikey")}>
              <TabsList className="w-full grid grid-cols-2 mb-4">
                <TabsTrigger value="firebase" className="flex items-center gap-1.5 text-xs">
                  <UserCheck className="h-3.5 w-3.5" /> Firebase Auth
                </TabsTrigger>
                <TabsTrigger value="apikey" className="flex items-center gap-1.5 text-xs">
                  <Key className="h-3.5 w-3.5" /> API Key
                </TabsTrigger>
              </TabsList>

              <TabsContent value="firebase">
                <form onSubmit={handleFirebaseLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-primary" /> Email
                    </label>
                    <Input
                      type="email"
                      placeholder="admin@skeleton.io"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5 text-primary" /> Password
                    </label>
                    <Input
                      type="password"
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isVerifying || !email.trim()}
                    className="w-full py-2.5 text-xs font-bold flex items-center justify-center gap-2"
                  >
                    {isVerifying ? "Verifying..." : "Sign In"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="apikey">
                <form onSubmit={handleApiKeyLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                      <Key className="h-3.5 w-3.5 text-primary" /> Secret API Key
                    </label>
                    <Input
                      type="password"
                      placeholder="sk_admin_secret_key_12345"
                      value={inputApiKey}
                      onChange={(e) => setInputApiKey(e.target.value)}
                      className="font-mono"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isVerifying || !inputApiKey.trim()}
                    className="w-full py-2.5 text-xs font-bold flex items-center justify-center gap-2"
                  >
                    {isVerifying ? "Verifying..." : "Authenticate"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
      {/* Sidebar Navigation */}
      <AdminSidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onLogout={handleLogout}
        authEnabled={!!authStatus?.admin_auth_enabled}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Clean Header Bar */}
        <header className="border-b border-border bg-card/60 backdrop-blur-md sticky top-0 z-30 flex h-14 items-center justify-between px-6">
          <h1 className="font-bold text-sm text-foreground">
            {activeTab === "overview" && "Overview"}
            {activeTab === "tenant-usage" && "Tenant & User AI Usage Analytics"}
            {activeTab === "agent-builder" && "Agent Builder & Playground"}
            {activeTab === "tools-workspace" && "Tools & Sandbox Workspace"}
            {activeTab === "users" && "User Analytics"}
            {activeTab === "marketing" && "Marketing & Leads"}
            {activeTab === "social" && "Social Media Analytics"}
            {activeTab === "cloud" && "Cloud Infrastructure"}
            {activeTab === "agent" && "AI Agent Performance Telemetry"}
            {activeTab === "governance" && "Tenant Directory"}
          </h1>

          {authStatus?.admin_auth_enabled && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-xs font-mono gap-1.5 text-muted-foreground hover:text-destructive h-8"
            >
              <LogOut className="h-3.5 w-3.5" /> Lock
            </Button>
          )}
        </header>

        {/* Views */}
        <main className="flex-1 p-6 space-y-6">
          {activeTab === "overview" && <OverviewDashboardView />}
          {activeTab === "tenant-usage" && <SuperAdminTenantUsageDashboard />}
          {activeTab === "agent-builder" && <AgentBuilderView />}
          {activeTab === "tools-workspace" && <AdminToolsPage />}
          {activeTab === "users" && <UserAnalyticsView />}
          {activeTab === "marketing" && <MarketingLeadsView />}
          {activeTab === "social" && <SocialMediaAnalyticsView />}
          {activeTab === "cloud" && <CloudMonitorView />}
          {activeTab === "agent" && <AgentPerformanceView />}
          {activeTab === "governance" && <TenantGovernanceView />}
        </main>

        {/* Plain Footer */}
        <footer className="border-t border-border bg-card/30 py-3 px-6 text-xs text-muted-foreground flex items-center justify-between">
          <div>Skeleton Admin</div>
          <div className="font-mono text-[11px]">API: http://localhost:8001</div>
        </footer>
      </div>
    </div>
  )
}
