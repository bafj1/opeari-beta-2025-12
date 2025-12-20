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
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Validation state
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [touched, setTouched] = useState({ email: false, password: false })

  const validateEmail = (value: string) => {
    if (!value) return 'Email is required'
    if (!/^\S+@\S+\.\S+$/.test(value)) return 'Please enter a valid email address'
    return ''
  }

  const validatePassword = (value: string) => {
    if (!value) return 'Password is required'
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
    const pError = validatePassword(password)

    setEmailError(eError)
    setPasswordError(pError)
    setTouched({ email: true, password: true })

    if (eError || pError) {
      return
    }

    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      const { data: member } = await supabase
        .from('members')
        .select('onboarding_complete, location')
        .eq('user_id', data.user.id)
        .single()

      if (member?.onboarding_complete || member?.location) {
        navigate('/dashboard')
      } else {
        navigate('/onboarding')
      }
    } catch (err: any) {
      console.error('Login error:', err)
      if (err.message?.includes('Invalid login')) {
        setError('Invalid email or password')
      } else if (err.message?.includes('Email not confirmed')) {
        setError('Please check your email to confirm your account')
      } else {
        setError(err.message || 'Something went wrong')
      }
    } finally {
      setLoading(false)
    }
  }

  // Show nothing while redirecting logged-in user
  if (user) {
    return null
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Header */}
      <header className="bg-white px-4 sm:px-8 py-4 flex justify-between items-center border-b border-mint-dark">
        <Link to="/" className="flex items-center">
          <img src="/logo.svg" alt="Opeari" className="h-12 sm:h-14" />
        </Link>
        <Button
          to="/waitlist"
          variant="tertiary"
          className="font-bold text-primary hover:text-coral"
        >
          Join Waitlist
        </Button>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="flex max-w-[900px] w-full bg-white rounded-3xl overflow-hidden shadow-card border border-mint-dark">

          {/* Left Side - Branding (hidden on mobile) */}
          <div className="hidden md:flex flex-1 bg-gradient-to-br from-primary to-primary-light p-8 lg:p-10 flex-col justify-between text-white relative overflow-hidden min-h-[500px]">
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
                src="/opeari-welcome-green.png"
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
          <div className="flex-1 p-6 sm:p-8 lg:p-10 flex flex-col justify-center bg-cream">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-primary mb-1">Sign in</h1>
              <p className="text-sm text-text-muted">Enter your details to access your account</p>
            </div>

            {/* Error Message (Refined: Soft Terracotta) */}
            {error && (
              <div className="bg-error-bg border border-error-border text-error-text px-4 py-3 rounded-xl mb-6 text-sm flex items-start gap-2">
                <svg className="w-5 h-5 flex-shrink-0 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span style={{ color: '#c46952', fontWeight: 500 }}>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label htmlFor="email" className="block font-bold text-sm text-primary mb-1.5 align-middle">
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
                    setTouched(prev => ({ ...prev, email: true }))
                    setEmailError(validateEmail(email))
                  }}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  className={`w-full px-4 py-3 border-2 rounded-xl text-primary bg-white transition-all focus:outline-none focus:ring-2 focus:ring-primary/10 placeholder:text-text-muted/40 text-base ${emailError
                    ? 'border-error/50 focus:border-error'
                    : 'border-mint-dark focus:border-primary'
                    }`}
                />
                {emailError && (
                  <p className="mt-1 text-xs text-error font-medium pl-1">{emailError}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block font-bold text-sm text-primary mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => {
                      const newVal = e.target.value
                      setPassword(newVal)
                      if (touched.password) setPasswordError(validatePassword(newVal))
                    }}
                    onBlur={() => {
                      setTouched(prev => ({ ...prev, password: true }))
                      setPasswordError(validatePassword(password))
                    }}
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                    className={`w-full px-4 py-3 pr-12 border-2 rounded-xl text-primary bg-white transition-all focus:outline-none focus:ring-2 focus:ring-primary/10 placeholder:text-text-muted/40 text-base ${passwordError
                      ? 'border-error/50 focus:border-error'
                      : 'border-mint-dark focus:border-primary'
                      }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary transition-colors"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {passwordError && (
                  <p className="mt-1 text-xs text-error font-medium pl-1">{passwordError}</p>
                )}
              </div>

              <div className="flex justify-between items-center text-sm">
                <label className="flex items-center gap-2 cursor-pointer text-text-muted">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 cursor-pointer rounded border-mint-dark text-primary focus:ring-primary"
                    style={{ accentColor: '#1e6b4e' }}
                  />
                  Remember me
                </label>
                <Button
                  to="/forgot-password"
                  variant="tertiary"
                  className="font-semibold px-0 py-0 h-auto text-sm"
                >
                  Forgot password?
                </Button>
              </div>

              <Button
                type="submit"
                loading={loading}
                fullWidth
                variant="primary"
                size="md"
              >
                Enter Your Village
              </Button>
            </form>

            <div className="mt-8 text-center text-sm text-text-muted">
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
      <footer className="bg-white px-4 py-6 text-center text-xs text-text-muted border-t border-mint-dark">
        <div className="flex justify-center gap-6 mb-3">
          <Button to="/" variant="tertiary" className="text-text-muted font-normal hover:text-primary text-xs px-0 py-0">Home</Button>
          <Button to="/privacy" variant="tertiary" className="text-text-muted font-normal hover:text-primary text-xs px-0 py-0">Privacy</Button>
          <Button to="/terms" variant="tertiary" className="text-text-muted font-normal hover:text-primary text-xs px-0 py-0">Terms</Button>
        </div>
        <div className="opacity-60">© 2025 Opeari</div>
      </footer>
    </div>
  )
}