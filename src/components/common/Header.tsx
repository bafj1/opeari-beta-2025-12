import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

export default function Header() {
  const { user } = useAuth()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  // Handle scroll detection for dynamic header styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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

  // Dynamic Header Classes - completely borderless
  const headerClasses = `
    fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out
    ${isScrolled
      ? 'bg-opeari-bg/95 backdrop-blur-sm py-3'
      : 'bg-transparent shadow-none py-5 sm:py-6'}
  `

  return (
    <header className={headerClasses}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link
          to={user ? '/dashboard' : '/'}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none decoration-transparent"
        >
          <img src="/icon.svg" alt="" className="h-7 w-7 sm:h-8 sm:w-8" />
          <span className="text-[#1E6B4E] font-bold text-xl sm:text-2xl">Opeari</span>
        </Link>

        {/* Right side */}
        {user ? (
          <>
            {/* Desktop Navigation */}
            <div className="hidden sm:flex items-center gap-6">
              <nav className="flex items-center gap-6">
                <Link
                  to="/dashboard"
                  className={`text-sm font-medium transition-colors focus:outline-none focus:text-opeari-heading ${isActive('/dashboard')
                    ? 'text-opeari-heading font-bold'
                    : 'text-opeari-text-secondary hover:text-opeari-heading'
                    }`}
                >
                  Dashboard
                </Link>
              </nav>

              {/* Profile Dropdown (Desktop Only) */}
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opeari-green/30 ${menuOpen
                    ? 'bg-opeari-green shadow-[0_4px_12px_rgba(30,107,78,0.2)] scale-105'
                    : 'bg-opeari-mint hover:bg-opeari-green hover:shadow-[0_4px_12px_rgba(30,107,78,0.2)] hover:scale-105 active:scale-95'
                    } group`}
                >
                  <svg
                    className={`w-5 h-5 transition-colors ${menuOpen ? 'text-white' : 'text-opeari-heading group-hover:text-white'}`}
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
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-[0_10px_25px_rgba(30,107,78,0.15)] border border-opeari-border py-2 z-20">
                      <Link
                        to="/profile"
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-opeari-text hover:bg-opeari-mint transition-colors"
                      >
                        Profile
                      </Link>
                      <Link
                        to="/settings"
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-opeari-text hover:bg-opeari-mint transition-colors"
                      >
                        Settings
                      </Link>
                      <div className="border-t border-opeari-border my-2" />
                      <button
                        onClick={handleLogout}
                        disabled={loggingOut}
                        className="block w-full text-left px-4 py-2 text-sm text-opeari-coral hover:bg-opeari-coral/10 transition-colors font-medium disabled:opacity-50"
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
                className="p-2 text-opeari-heading hover:bg-opeari-mint rounded-full transition-colors"
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
              <div className="absolute top-full left-0 w-full bg-white border-b border-opeari-border shadow-[0_4px_24px_rgba(30,107,78,0.15)] p-4 flex flex-col gap-1 sm:hidden animate-in slide-in-from-top-2 duration-200">
                <Link
                  to="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className={`p-3 rounded-lg text-sm font-medium transition-all ${isActive('/dashboard')
                    ? 'bg-opeari-mint text-opeari-heading font-bold'
                    : 'text-opeari-text hover:bg-opeari-mint/50'
                    }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/build-your-village"
                  onClick={() => setMenuOpen(false)}
                  className={`p-3 rounded-lg text-sm font-medium transition-all ${isActive('/build-your-village')
                    ? 'bg-opeari-mint text-opeari-heading font-bold'
                    : 'text-opeari-text hover:bg-opeari-mint/50'
                    }`}
                >
                  Find Matches
                </Link>
                <Link
                  to="/connections"
                  onClick={() => setMenuOpen(false)}
                  className={`p-3 rounded-lg text-sm font-medium transition-all ${isActive('/connections')
                    ? 'bg-opeari-mint text-opeari-heading font-bold'
                    : 'text-opeari-text hover:bg-opeari-mint/50'
                    }`}
                >
                  My Village
                </Link>
                <Link
                  to="/messages"
                  onClick={() => setMenuOpen(false)}
                  className={`p-3 rounded-lg text-sm font-medium transition-all ${isActive('/messages')
                    ? 'bg-opeari-mint text-opeari-heading font-bold'
                    : 'text-opeari-text hover:bg-opeari-mint/50'
                    }`}
                >
                  Messages
                </Link>

                <div className="h-px bg-opeari-border my-2" />

                <Link
                  to="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="p-3 rounded-lg text-sm text-opeari-text hover:bg-opeari-mint/50 transition-all"
                >
                  Profile
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setMenuOpen(false)}
                  className="p-3 rounded-lg text-sm text-opeari-text hover:bg-opeari-mint/50 transition-all"
                >
                  Settings
                </Link>

                <div className="h-px bg-opeari-border my-2" />

                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="p-3 rounded-lg text-sm font-bold text-opeari-coral hover:bg-opeari-coral/10 text-left transition-all disabled:opacity-50"
                >
                  {loggingOut ? 'Signing out...' : 'Sign out'}
                </button>
              </div>
            )}
          </>
        ) : (

          <>
            {/* Center Nav */}
            <nav className="hidden sm:flex items-center gap-8">
              <Link to="/about" className="text-opeari-heading text-sm font-medium hover:opacity-70 transition-opacity">
                About
              </Link>
              <Link to="/faq" className="text-opeari-heading text-sm font-medium hover:opacity-70 transition-opacity">
                FAQ
              </Link>
            </nav>

            {/* Right Side */}
            <div className="flex items-center gap-4">
              <Link
                to="/login"
                className="text-opeari-heading text-sm font-medium hover:opacity-70 transition-opacity"
              >
                Login
              </Link>
              <Link
                to="/waitlist"
                className="inline-flex items-center justify-center h-10 px-6 text-sm font-semibold rounded-full transition-all duration-300 hover:scale-105 hover:shadow-lg focus:outline-none"
                style={{
                  backgroundColor: 'var(--opeari-coral)',
                  color: 'var(--opeari-text-heading)'
                }}
              >
                Join Waitlist
              </Link>
            </div>
          </>
        )}
      </div>
    </header >
  )
}