import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import Button from './Button'

export default function Header() {
  const { user } = useAuth()
  const location = useLocation()
  // const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const isActive = (path: string) => {
    return location.pathname === path
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    // Small delay for visual feedback
    await new Promise(resolve => setTimeout(resolve, 500))
    setMenuOpen(false)

    // Sign out from Supabase
    await supabase.auth.signOut()

    // Clear ALL Supabase data from localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb-') || key.includes('supabase')) {
        localStorage.removeItem(key)
      }
    })

    // Force full page reload to reset all state
    window.location.href = '/'
  }

  return (
    <header className="bg-white border-b border-border sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-5 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link
          to={user ? '/dashboard' : '/'}
          className="flex items-center hover:opacity-80 transition-opacity focus:outline-none"
        >
          <img src="/logo.svg" alt="Opeari" className="h-11 sm:h-12" />
        </Link>

        {/* Right side */}
        {user ? (
          <>
            {/* Desktop Navigation */}
            <div className="hidden sm:flex items-center gap-6">
              <nav className="flex items-center gap-6">
                <Link
                  to="/dashboard"
                  className={`text-sm font-medium transition-colors focus:outline-none focus:text-primary ${isActive('/dashboard')
                    ? 'text-primary font-bold'
                    : 'text-text-secondary hover:text-primary'
                    }`}
                >
                  Dashboard
                </Link>
                {/* Hidden while unfinished
                <Link
                  to="/build-your-village"
                  className={`text-sm font-medium transition-colors focus:outline-none focus:text-primary ${isActive('/build-your-village')
                    ? 'text-primary font-bold'
                    : 'text-text-secondary hover:text-primary'
                    }`}
                >
                  Find Matches
                </Link>
                <Link
                  to="/connections"
                  className={`text-sm font-medium transition-colors focus:outline-none focus:text-primary ${isActive('/connections')
                    ? 'text-primary font-bold'
                    : 'text-text-secondary hover:text-primary'
                    }`}
                >
                  My Village
                </Link>
                <Link
                  to="/messages"
                  className={`text-sm font-medium transition-colors focus:outline-none focus:text-primary ${isActive('/messages')
                    ? 'text-primary font-bold'
                    : 'text-text-secondary hover:text-primary'
                    }`}
                >
                  Messages
                </Link>
                */}
              </nav>

              {/* Profile Dropdown (Desktop Only) */}
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 ${menuOpen
                    ? 'bg-primary shadow-md scale-105'
                    : 'bg-mint hover:bg-primary hover:shadow-md hover:scale-105 active:scale-95'
                    } group`}
                >
                  <svg
                    className={`w-5 h-5 transition-colors ${menuOpen ? 'text-white' : 'text-primary group-hover:text-white'}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </button>

                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-border py-2 z-20">
                      <Link
                        to="/profile"
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-text-primary hover:bg-mint transition-colors"
                      >
                        Profile
                      </Link>
                      <Link
                        to="/settings"
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-text-primary hover:bg-mint transition-colors"
                      >
                        Settings
                      </Link>
                      <div className="border-t border-border my-2" />
                      <button
                        onClick={handleLogout}
                        disabled={loggingOut}
                        className="block w-full text-left px-4 py-2 text-sm text-coral hover:bg-coral/10 transition-colors font-medium disabled:opacity-50"
                      >
                        {loggingOut ? 'Signing out...' : 'Sign out'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Mobile Navigation Toggle */}
            <div className="sm:hidden flex items-center">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 text-primary hover:bg-mint rounded-full transition-colors"
                aria-label="Toggle menu"
              >
                {menuOpen ? (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>

            {/* Mobile Menu Overlay */}
            {menuOpen && (
              <div className="absolute top-full left-0 w-full bg-white border-b border-border shadow-xl p-4 flex flex-col gap-1 sm:hidden animate-in slide-in-from-top-2 duration-200">
                <Link
                  to="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className={`p-3 rounded-lg text-sm font-medium transition-all ${isActive('/dashboard')
                    ? 'bg-mint text-primary font-bold'
                    : 'text-text-primary hover:bg-mint/50'
                    }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/build-your-village"
                  onClick={() => setMenuOpen(false)}
                  className={`p-3 rounded-lg text-sm font-medium transition-all ${isActive('/build-your-village')
                    ? 'bg-mint text-primary font-bold'
                    : 'text-text-primary hover:bg-mint/50'
                    }`}
                >
                  Find Matches
                </Link>
                <Link
                  to="/connections"
                  onClick={() => setMenuOpen(false)}
                  className={`p-3 rounded-lg text-sm font-medium transition-all ${isActive('/connections')
                    ? 'bg-mint text-primary font-bold'
                    : 'text-text-primary hover:bg-mint/50'
                    }`}
                >
                  My Village
                </Link>
                <Link
                  to="/messages"
                  onClick={() => setMenuOpen(false)}
                  className={`p-3 rounded-lg text-sm font-medium transition-all ${isActive('/messages')
                    ? 'bg-mint text-primary font-bold'
                    : 'text-text-primary hover:bg-mint/50'
                    }`}
                >
                  Messages
                </Link>

                <div className="h-px bg-border my-2" />

                <Link
                  to="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="p-3 rounded-lg text-sm text-text-primary hover:bg-mint/50 transition-all"
                >
                  Profile
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setMenuOpen(false)}
                  className="p-3 rounded-lg text-sm text-text-primary hover:bg-mint/50 transition-all"
                >
                  Settings
                </Link>

                <div className="h-px bg-border my-2" />

                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="p-3 rounded-lg text-sm font-bold text-coral hover:bg-coral/10 text-left transition-all disabled:opacity-50"
                >
                  {loggingOut ? 'Signing out...' : 'Sign out'}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center gap-4">
            <Button
              to="/login"
              variant="tertiary"
              className="text-primary font-semibold"
            >
              Login
            </Button>
            <Button
              to="/waitlist"
              variant="primary"
              size="sm"
            >
              Join Waitlist
            </Button>
          </div>
        )}
      </div>
    </header>
  )
}