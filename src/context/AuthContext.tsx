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
    let mounted = true;

    // Hard failsafe: no matter what, stop loading after 5 seconds
    const failsafeTimer = setTimeout(() => {
      if (mounted) {
        setLoading(prev => {
          if (prev) {
            console.warn('AuthContext: Failsafe triggered after 5s');
            return false;
          }
          return prev;
        });
      }
    }, 5000);

    // Get initial session
    const initSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (!mounted) return;

        if (error) {
          console.error('Session error:', error);
          setSession(null);
          setUser(null);
        } else {
          setSession(session);
          setUser(session?.user ?? null);

          // Background member row check — do NOT await
          if (session?.user) {
            ensureMemberRow().catch(err =>
              console.error('Background member row check failed:', err)
            );
          }
        }
      } catch (err) {
        console.error('getSession exception:', err);
        if (mounted) {
          setSession(null);
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
        } else {
          setSession(session);
          setUser(session?.user ?? null);

          if (session?.user) {
            ensureMemberRow().catch(err =>
              console.error('Background member row check failed:', err)
            );
          }
        }
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(failsafeTimer);
    };
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