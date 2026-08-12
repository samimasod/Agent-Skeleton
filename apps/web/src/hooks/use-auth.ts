import { useEffect } from "react"
import { useAuthStore } from "@/stores/auth-store"
import { onAuthChange } from "@/lib/firebase"
import type { User } from "@/lib/firebase"

export function useAuth() {
  const { user, loading, setUser, setLoading } = useAuthStore()

  useEffect(() => {
    const unsubscribe = onAuthChange((firebaseUser: User | null) => {
      setUser(firebaseUser)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [setUser, setLoading])

  return { user, loading }
}
