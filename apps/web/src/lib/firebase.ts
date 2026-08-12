import { initializeApp, getApps } from "firebase/app"
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from "firebase/auth"
import type { User } from "firebase/auth"

const hasFirebaseConfig = Boolean(import.meta.env.VITE_FIREBASE_API_KEY)

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "mock-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "mock-domain",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "mock-project",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Initialize Firebase safely
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
const auth = getAuth(app)
const googleProvider = new GoogleAuthProvider()

export { auth }
export type { User }

const API_URL = import.meta.env.VITE_API_URL || ""

export async function loginWithEmail(email: string, password: string) {
  if (hasFirebaseConfig) {
    try {
      return await signInWithEmailAndPassword(auth, email, password)
    } catch (err) {
      // Fallback to local auth if Firebase fails or is unconfigured
    }
  }

  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })

  if (!res.ok) {
    const errorText = await res.text()
    let msg = "Invalid credentials"
    try {
      msg = JSON.parse(errorText).detail || msg
    } catch {}
    throw new Error(msg)
  }

  const data = await res.json()
  if (data.access_token) {
    localStorage.setItem("auth_token", data.access_token)
  }
  return data
}

export async function signupWithEmail(email: string, password: string) {
  if (hasFirebaseConfig) {
    try {
      return await createUserWithEmailAndPassword(auth, email, password)
    } catch (err) {
      // Fallback to local auth if Firebase fails
    }
  }

  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })

  if (!res.ok) {
    const errorText = await res.text()
    let msg = "Sign up failed"
    try {
      msg = JSON.parse(errorText).detail || msg
    } catch {}
    throw new Error(msg)
  }

  const data = await res.json()
  if (data.access_token) {
    localStorage.setItem("auth_token", data.access_token)
  }
  return data
}

export async function loginWithGoogle() {
  if (hasFirebaseConfig) {
    return signInWithPopup(auth, googleProvider)
  }
  // Local mode mock login for Google button
  return loginWithEmail("owner@example.com", "password123")
}

export async function logout() {
  localStorage.removeItem("auth_token")
  if (hasFirebaseConfig) {
    try {
      await firebaseSignOut(auth)
    } catch {}
  }
}

export function onAuthChange(callback: (user: any) => void) {
  const localToken = localStorage.getItem("auth_token")
  if (localToken || !hasFirebaseConfig) {
    fetch(`${API_URL}/api/auth/status`, {
      headers: { Authorization: `Bearer ${localToken || "dev-user-123"}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.user) {
          callback(data.user)
        } else {
          callback(null)
        }
      })
      .catch(() => callback(null))

    return () => {}
  }

  return onAuthStateChanged(auth, callback)
}

export async function getIdToken(): Promise<string | null> {
  const localToken = localStorage.getItem("auth_token")
  if (localToken) return localToken

  const user = auth.currentUser
  if (!user) return "dev-user-123"
  return user.getIdToken()
}
