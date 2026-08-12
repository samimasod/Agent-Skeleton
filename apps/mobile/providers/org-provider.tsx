import React, { createContext, useContext, useEffect, useState } from "react"
import { organizationsApi, type Organization, type OrganizationInvitation } from "@/lib/api-client"
import { useAuth } from "./auth-provider"

interface OrgContextType {
  currentOrg: Organization | null
  setCurrentOrg: (org: Organization | null) => void
  organizations: Organization[]
  setOrganizations: (orgs: Organization[]) => void
  pendingInvitations: OrganizationInvitation[]
  setPendingInvitations: (invites: OrganizationInvitation[]) => void
  isLoading: boolean
  setLoading: (val: boolean) => void
  needsSetup: boolean
  setNeedsSetup: (val: boolean) => void
  refreshOrgs: () => Promise<void>
}

const OrgContext = createContext<OrgContextType | undefined>(undefined)

export function OrgProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading, isSuperAdmin } = useAuth()
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [pendingInvitations, setPendingInvitations] = useState<OrganizationInvitation[]>([])
  const [isLoading, setLoading] = useState(true)
  const [needsSetup, setNeedsSetup] = useState(false)

  const refreshOrgs = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const response = await organizationsApi.list()
      setOrganizations(response.organizations)

      if (response.organizations.length === 0) {
        const inviteResponse = await organizationsApi.listPendingInvitations()
        setPendingInvitations(inviteResponse.invitations)
        setNeedsSetup(inviteResponse.invitations.length === 0 && !isSuperAdmin)
        setCurrentOrg(null)
      } else {
        // Default to first org if none selected
        if (!currentOrg || !response.organizations.find(o => o.id === currentOrg.id)) {
          setCurrentOrg(response.organizations[0])
        }
        setPendingInvitations([])
        setNeedsSetup(false)
      }
    } catch (err) {
      console.error("Failed to fetch organizations:", err)
      setNeedsSetup(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading) {
      refreshOrgs()
    }
  }, [user, authLoading, isSuperAdmin])

  return (
    <OrgContext.Provider
      value={{
        currentOrg,
        setCurrentOrg,
        organizations,
        setOrganizations,
        pendingInvitations,
        setPendingInvitations,
        isLoading,
        setLoading,
        needsSetup,
        setNeedsSetup,
        refreshOrgs
      }}
    >
      {children}
    </OrgContext.Provider>
  )
}

export function useOrg() {
  const context = useContext(OrgContext)
  if (context === undefined) {
    throw new Error("useOrg must be used within an OrgProvider")
  }
  return context
}
