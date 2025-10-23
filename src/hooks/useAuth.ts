import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || "http://127.0.0.1:54321"
const supabaseAnonKey =
  (import.meta as any).env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"

console.log("Supabase URL:", supabaseUrl)
console.log("Supabase Anon Key:", supabaseAnonKey ? "Present" : "Missing")

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface User {
  id: string
  email: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Get initial session with timeout
    const getInitialSession = async () => {
      try {
        console.log("Checking initial session...")

        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Session check timeout")), 3000)
        )

        const sessionPromise = supabase.auth.getSession()

        const {
          data: { session },
          error,
        } = (await Promise.race([sessionPromise, timeoutPromise])) as any

        if (error) {
          console.error("Error getting session:", error)
          setError("שגיאה בטעינת המידע")
        } else {
          console.log("Session check complete:", session ? "User found" : "No user")
          setUser(session?.user ? { id: session.user.id, email: session.user.email || "" } : null)
        }
      } catch (err) {
        console.error("Error in getInitialSession:", err)
        setError("שגיאה בטעינת המידע")
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session ? "User found" : "No user")
      setUser(session?.user ? { id: session.user.id, email: session.user.email || "" } : null)
      setLoading(false)
      setError(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      setError(null)
      setLoading(true)

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError("שגיאה בהתחברות: " + error.message)
        return false
      }

      if (data.user) {
        setUser({ id: data.user.id, email: data.user.email || "" })
        return true
      }

      return false
    } catch (err) {
      console.error("Error signing in:", err)
      setError("שגיאה בהתחברות")
      return false
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setError(null)
      const { error } = await supabase.auth.signOut()
      if (error) {
        setError("שגיאה בהתנתקות: " + error.message)
        return false
      }
      setUser(null)
      return true
    } catch (err) {
      console.error("Error signing out:", err)
      setError("שגיאה בהתנתקות")
      return false
    }
  }

  return {
    user,
    loading,
    error,
    signIn,
    signOut,
  }
}
