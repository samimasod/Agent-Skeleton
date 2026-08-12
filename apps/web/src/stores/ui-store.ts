import { create } from "zustand"

interface UIState {
  sidebarOpen: boolean
  currentOrganizationId: number | null
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setCurrentOrganizationId: (id: number | null) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  currentOrganizationId: null,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setCurrentOrganizationId: (id) => set({ currentOrganizationId: id }),
}))
