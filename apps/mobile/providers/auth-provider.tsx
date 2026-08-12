import React, { createContext, useContext, useEffect, useState } from "react"
import { onAuthChange, logout } from "@/lib/firebase"
import { authApi } from "@/lib/api-client"
import type { User } from "@/lib/firebase"

interface AuthContextType {
  user: User | null
  loading: boolean
  isSuperAdmin: boolean
  setIsSuperAdmin: (val: boolean) => void
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        try {
          const status = await authApi.status()
          setIsSuperAdmin(status.is_super_admin)
        } catch (e) {
          console.error("Failed to fetch auth status", e)
        }
      } else {
        setIsSuperAdmin(false)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signOut = async () => {
    try {
      await logout()
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, isSuperAdmin, setIsSuperAdmin, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
