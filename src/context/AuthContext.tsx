import { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { ensureMemberRow } from '../lib/auth/ensureMemberRow'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Failsafe: If nothing resolves in 8 seconds, force loading to false
    const failsafeTimer = setTimeout(() => {
      setLoading((prev) => {
        if (prev) {
          console.warn('AuthContext: Failsafe triggered - forcing loading to false');
          return false;
        }
        return prev;
      });
    }, 8000);

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      clearTimeout(failsafeTimer);
      if (error) {
        console.error('Session error:', error)
        setSession(null)
        setUser(null)
      } else {
        setSession(session)
        setUser(session?.user ?? null)

        // Background check for member row
        if (session?.user) {
          ensureMemberRow().catch(err => console.error('Background init member row check failed', err));
        }
      }
      setLoading(false) // Always unblock immediately after getting session
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // console.log('Auth state changed:', event) 

        if (event === 'SIGNED_OUT') {
          setSession(null)
          setUser(null)
          setLoading(false)
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setSession(session)
          setUser(session?.user ?? null)
          setLoading(false) // Unblock UI immediately for better perceived performance

          // Run data consistency check in background
          if (session?.user) {
            ensureMemberRow().catch(err => console.error('Background member row check failed', err));
          }
        } else {
          // For other events (initial session check often falls here or above), ensure we update state
          setSession(session)
          setUser(session?.user ?? null)
          setLoading(false)
        }
      }
    )

    return () => {
      subscription.unsubscribe();
      clearTimeout(failsafeTimer);
    }
  }, [])

  const signOut = async () => {
    try {
      // Clear state first
      setUser(null)
      setSession(null)
      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut({ scope: 'local' })
      if (error) {
        console.error('Sign out error:', error)
      }
    } catch (err) {
      console.error('Sign out exception:', err)
    }
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}