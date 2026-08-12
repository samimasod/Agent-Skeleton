import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Organization } from "@/lib/api-client"

interface OrgState {
  currentOrg: Organization | null
  organizations: Organization[]
  isLoading: boolean
  setCurrentOrg: (org: Organization | null) => void
  setOrganizations: (orgs: Organization[]) => void
  setLoading: (loading: boolean) => void
  reset: () => void
}

export const useOrgStore = create<OrgState>()(
  persist(
    (set) => ({
      currentOrg: null,
      organizations: [],
      isLoading: false,
      setCurrentOrg: (org) => set({ currentOrg: org }),
      setOrganizations: (orgs) => set({ organizations: orgs }),
      setLoading: (loading) => set({ isLoading: loading }),
      reset: () => set({ currentOrg: null, organizations: [], isLoading: false }),
    }),
    {
      name: "skeleton-org-storage",
      partialize: (state) => ({ 
        currentOrg: state.currentOrg,
      }),
    }
  )
)
