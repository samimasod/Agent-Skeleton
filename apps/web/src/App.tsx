import { useEffect, useState } from "react"
import { Navigate, Route, Routes } from "react-router-dom"
import { useAuth } from "@/hooks/use-auth"
import { authApi, organizationsApi } from "@/lib/api-client"
import { useOrgStore } from "@/stores/org-store"
import { useAuthStore } from "@/stores/auth-store"
import { Toaster } from "@/components/ui/toaster"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { AuthLayout } from "@/components/layout/auth-layout"
import { LoginPage } from "@/routes/auth/login"
import { SignupPage } from "@/routes/auth/signup"
import { PendingInvitations } from "@/components/onboarding/pending-invitations"
import { SetupOrganization } from "@/components/onboarding/setup-organization"
import { DashboardHome } from "@/routes/dashboard"
import { ProjectsPage } from "@/routes/dashboard/projects"
import { ProjectDetailPage } from "@/routes/dashboard/projects/[id]"
import { SettingsPage } from "@/routes/dashboard/settings"
import { AgentsPage } from "@/routes/dashboard/agents"
import { AgentBuilderPage } from "@/routes/dashboard/agent-builder"
import type { OrganizationInvitation } from "@/lib/api-client"

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const { setIsSuperAdmin } = useAuthStore()
  const { currentOrg, setCurrentOrg, setOrganizations, isLoading, setLoading } = useOrgStore()
  const [needsSetup, setNeedsSetup] = useState(false)
  const [pendingInvitations, setPendingInvitations] = useState<OrganizationInvitation[]>([])
  const [checkingOrg, setCheckingOrg] = useState(true)

  useEffect(() => {
    async function checkOrganizations() {
      if (!user) {
        setCheckingOrg(false)
        return
      }

      setLoading(true)
      try {
        const authStatus = await authApi.status()
        setIsSuperAdmin(authStatus.is_super_admin)

        if (currentOrg) {
          setCheckingOrg(false)
          return
        }

        const response = await organizationsApi.list()
        setOrganizations(response.organizations)

        if (response.organizations.length === 0) {
          const inviteResponse = await organizationsApi.listPendingInvitations()
          setPendingInvitations(inviteResponse.invitations)
          setNeedsSetup(inviteResponse.invitations.length === 0 && !authStatus.is_super_admin)
        } else {
          setCurrentOrg(response.organizations[0])
          setPendingInvitations([])
        }
      } catch (err) {
        console.error("Failed to fetch organizations:", err)
        setNeedsSetup(true)
      } finally {
        setLoading(false)
        setCheckingOrg(false)
      }
    }

    if (!loading) {
      void checkOrganizations()
    }
  }, [user, loading, currentOrg, setCurrentOrg, setOrganizations, setLoading, setIsSuperAdmin])

  if (loading || checkingOrg || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (needsSetup && !currentOrg) {
    return <SetupOrganization />
  }

  if (pendingInvitations.length > 0 && !currentOrg) {
    return <PendingInvitations invitations={pendingInvitations} />
  }

  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    )
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

function App() {
  return (
    <>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <AuthLayout>
                <LoginPage />
              </AuthLayout>
            </PublicRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <AuthLayout>
                <SignupPage />
              </AuthLayout>
            </PublicRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardHome />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:id" element={<ProjectDetailPage />} />
          <Route path="agents" element={<AgentsPage />} />
          <Route path="agents/:id" element={<AgentBuilderPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route
          path="*"
          element={
            <div className="flex h-screen items-center justify-center">
              <div className="text-center">
                <h1 className="text-4xl font-bold">404</h1>
                <p className="mt-2 text-muted-foreground">Page not found</p>
              </div>
            </div>
          }
        />
      </Routes>
      <Toaster />
    </>
  )
}

export default App
