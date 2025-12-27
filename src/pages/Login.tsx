import { useState, useEffect, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Button from '../components/common/Button'

// Feature icons
const FEATURES = [
  {
    text: 'Find nanny share partners',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    text: 'Match with similar schedules',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    text: 'Trusted local connections',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
]

export default function Login() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [email, setEmail] = useState('')

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Validation state
  const [emailError, setEmailError] = useState('')

  const [touched, setTouched] = useState({ email: false, password: false })

  const validateEmail = (value: string) => {
    if (!value) return 'Email is required'
    if (!/^\S+@\S+\.\S+$/.test(value)) return 'Please enter a valid email address'
    return ''
  }



  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      navigate('/dashboard')
    }
  }, [user, navigate])

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    // Frontend Validation
    const eError = validateEmail(email)
    setEmailError(eError)
    setTouched({ email: true, password: false })

    if (eError) {
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      })

      if (error) throw error

      setError('Check your email for the login link!')
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  // Show nothing while redirecting logged-in user
  if (user) {
    return null
  }

  return (
    <div className="min-h-screen bg-opeari-bg flex flex-col">
      {/* Header */}
      <header className="bg-opeari-bg px-4 sm:px-8 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center">
          <img src="/logo.svg" alt="Opeari" className="h-12 sm:h-14" />
        </Link>
        <Button
          to="/waitlist"
          variant="tertiary"
          className="font-bold text-opeari-heading hover:text-opeari-coral"
        >
          Join Waitlist
        </Button>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="flex max-w-[900px] w-full bg-white rounded-3xl overflow-hidden shadow-card border border-opeari-border">

          {/* Left Side - Branding (hidden on mobile) */}
          <div className="hidden md:flex flex-1 bg-gradient-to-br from-opeari-green to-opeari-green-dark p-8 lg:p-10 flex-col justify-between text-white relative overflow-hidden min-h-[500px]">
            <div className="relative z-10">
              <h2 className="text-2xl lg:text-3xl font-bold mb-4 leading-tight">
                Welcome back to your village
              </h2>
              <p className="text-base lg:text-lg opacity-90 leading-relaxed">
                Connect with trusted families nearby and build your childcare community.
              </p>

              {/* Feature list with ICONS */}
              <div className="mt-10 space-y-5">
                {FEATURES.map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                      {feature.icon}
                    </div>
                    <span className="text-sm lg:text-base font-medium">{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pear mascot circle */}
            <div className="relative z-10 flex justify-center mt-6">
              <div className="absolute w-36 h-36 lg:w-44 lg:h-44 rounded-full bg-white/10 -translate-y-2" />
              <img
                src="/images/opeari-welcome-green.png"
                alt="Opeari Pear"
                className="relative w-32 lg:w-40 h-auto drop-shadow-md"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            </div>

            {/* Decorative circles */}
            <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-white/5" />
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
          </div>

          {/* Right Side - Form */}
          <div className="flex-1 p-6 sm:p-8 lg:p-10 flex flex-col justify-center bg-opeari-bg">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-opeari-heading mb-1">Welcome back</h1>
              <p className="text-sm text-opeari-text-secondary">Enter your email to sign in</p>
            </div>

            {/* Message/Error (Green for success/info check, Red for error) */}
            {error && (
              <div className={`px-4 py-3 rounded-xl mb-6 text-sm flex items-start gap-2 ${error.includes('Check') ? 'bg-[#f0faf4] border border-[#1e6b4e]/30 text-[#1e6b4e]' : 'bg-error-bg border border-error-border text-error-text'}`}>
                {error.includes('Check') ? (
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 flex-shrink-0 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <span style={{ fontWeight: 500 }}>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label htmlFor="email" className="block font-bold text-sm text-opeari-heading mb-1.5 align-middle">
                  Email address
                </label>
                <input
                  autoFocus
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => {
                    const newVal = e.target.value
                    setEmail(newVal)
                    if (touched.email) setEmailError(validateEmail(newVal))
                  }}
                  onBlur={() => {
                    setTouched(prev => ({ ...prev, email: true, password: false }))
                    setEmailError(validateEmail(email))
                  }}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  className={`w-full px-4 py-3 border-2 rounded-xl text-opeari-heading bg-white transition-all focus:outline-none focus:ring-2 focus:ring-opeari-green/10 placeholder:text-opeari-text-secondary/40 text-base ${emailError
                    ? 'border-error/50 focus:border-error'
                    : 'border-opeari-border focus:border-opeari-green'
                    }`}
                />
                {emailError && (
                  <p className="mt-1 text-xs text-error font-medium pl-1">{emailError}</p>
                )}
              </div>

              <Button
                type="submit"
                loading={loading}
                fullWidth
                variant="primary"
                size="md"
              >
                {loading ? 'Sending Link...' : 'Send Login Link'}
              </Button>
            </form>

            <div className="mt-8 text-center text-sm text-opeari-text-secondary">
              <p>
                Don't have an invite code?{' '}
                <Button to="/waitlist" variant="tertiary" className="font-bold px-0 py-0 h-auto">
                  Join the Waitlist
                </Button>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white px-4 py-6 text-center text-xs text-opeari-text-secondary border-t border-opeari-border">
        <div className="flex justify-center gap-6 mb-3">
          <Button to="/" variant="tertiary" className="text-opeari-text-secondary font-normal hover:text-opeari-heading text-xs px-0 py-0">Home</Button>
          <Button to="/privacy" variant="tertiary" className="text-opeari-text-secondary font-normal hover:text-opeari-heading text-xs px-0 py-0">Privacy</Button>
          <Button to="/terms" variant="tertiary" className="text-opeari-text-secondary font-normal hover:text-opeari-heading text-xs px-0 py-0">Terms</Button>
        </div>
        <div className="opacity-60">© 2025 Opeari</div>
      </footer>
    </div>
  )
}