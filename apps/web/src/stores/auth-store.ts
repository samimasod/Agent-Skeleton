import { create } from "zustand"
import type { User } from "firebase/auth"

interface AuthState {
  user: User | null
  loading: boolean
  isSuperAdmin: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  setIsSuperAdmin: (isSuperAdmin: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  isSuperAdmin: false,
  setUser: (user) => set({ user, ...(user ? {} : { isSuperAdmin: false }) }),
  setLoading: (loading) => set({ loading }),
  setIsSuperAdmin: (isSuperAdmin) => set({ isSuperAdmin }),
}))
