import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff } from 'lucide-react'
import { Helmet } from 'react-helmet-async'

export default function Login() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // If already logged in, redirect to dashboard
  if (user) {
    navigate('/dashboard')
    return null
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Check intent and routing
      const intent = data.user?.user_metadata?.intent
      const isCaregiver = intent === 'caregiver' || intent === 'providing'

      if (isCaregiver) {
        const { data: profile } = await supabase
          .from('caregiver_profiles')
          .select('id')
          .eq('user_id', data.user.id)
          .single()

        if (profile) {
          navigate('/dashboard')
        } else {
          navigate('/onboarding')
        }
      } else {
        const { data: member } = await supabase
          .from('members')
          .select('profile_complete')
          .eq('user_id', data.user.id)
          .single()

        if (member?.profile_complete) {
          navigate('/dashboard')
        } else {
          navigate('/onboarding')
        }
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

  return (
    <main className="min-h-screen bg-[#fffaf5] flex">
      <Helmet>
        <title>Opeari - Login</title>
        <meta name="description" content="Welcome back to your village. Log in to manage your care schedule and connect with families." />

        {/* Open Graph */}
        <meta property="og:title" content="Opeari - Login" />
        <meta property="og:description" content="Welcome back to your village. Log in to manage your care schedule and connect with families." />
        <meta property="og:image" content="https://opeari.com/opeari-village-hero.png" />
        <meta property="og:url" content="https://opeari.com/login" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Opeari - Login" />
        <meta name="twitter:description" content="Welcome back to your village. Log in to manage your care schedule and connect with families." />
        <meta name="twitter:image" content="https://opeari.com/opeari-village-hero.png" />
      </Helmet>
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-[#1E6B4E] to-[#2d7a5e] p-12 pt-12 flex-col justify-between text-white relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-white/5 rounded-full" />
        <div className="absolute bottom-40 left-10 w-24 h-24 bg-white/5 rounded-full" />

        <div className="relative z-10">
          {/* Logo with spacing */}
          <Link to="/" className="flex items-center gap-2 mb-12 hover:opacity-90 transition-opacity">
            <img
              src="/icon.svg"
              alt="Opeari"
              className="w-8 h-8 block"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
            <span className="text-xl font-bold text-white">Opeari</span>
          </Link>

          <h2
            className="text-3xl font-bold mb-4"
            style={{ color: '#F9E3D2', opacity: 1 }}
          >
            Welcome back to your village
          </h2>
          <p className="relative z-20 text-white text-opacity-90 text-lg mb-10">
            Connect with trusted families nearby and build your childcare community.
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-white/60 rounded-full" />
              <span className="text-white/90">Find nanny share partners</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-white/60 rounded-full" />
              <span className="text-white/90">Match with similar schedules</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-white/60 rounded-full" />
              <span className="text-white/90">Trusted local connections</span>
            </div>
          </div>
        </div>

        {/* Mascot */}
        <img
          src="/opeari-welcome-green.png"
          alt="Opeari mascot"
          className="w-40 h-40 object-contain self-center opacity-90"
        />
      </div>

      {/* Right Panel - Form (and Nav) */}
      <div className="flex-1 flex flex-col items-center justify-center relative bg-[#fffaf5]">
        {/* Simplified Nav inside Right Panel */}
        <nav className="absolute top-0 right-0 w-full flex justify-end items-center gap-8 p-6 pr-8 overflow-visible z-10">
          <Link to="/about" className="text-sm text-[#1e6b4e] hover:underline">About</Link>
          <Link to="/faq" className="text-sm text-[#1e6b4e] hover:underline">FAQ</Link>
          <Link
            to="/waitlist"
            className="px-5 py-2 bg-[#F8C3B3] text-[#1e6b4e] rounded-full text-sm font-semibold hover:bg-[#f5b2a1] transition-colors whitespace-nowrap"
          >
            Join Waitlist
          </Link>
        </nav>

        <div className="w-full max-w-md p-6 lg:p-12 mt-16 lg:mt-0">
          <div className="bg-white rounded-2xl shadow-sm border border-[#e8e4de] p-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-[#1E6B4E] mb-2">Sign in</h1>
              <p className="text-[#5a6e5a]">Enter your details to access your account</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#1E6B4E] mb-2">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-[#8bd7c7] text-[#1E6B4E] placeholder-[#9ca3af] focus:outline-none focus:border-[#1E6B4E] focus:ring-2 focus:ring-[#1E6B4E]/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1E6B4E] mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-[#e8e4de] text-[#1E6B4E] placeholder-[#9ca3af] focus:outline-none focus:border-[#1E6B4E] focus:ring-2 focus:ring-[#1E6B4E]/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5a6e5a] hover:text-[#1E6B4E] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                {/* Custom Checkbox */}
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all
                        ${rememberMe
                          ? 'bg-[#1e6b4e] border-[#1e6b4e]'
                          : 'bg-white border-[#8bd7c7]'
                        }
                        peer-focus:ring-2 peer-focus:ring-[#1e6b4e]/20 peer-focus:ring-offset-1`}
                    >
                      {rememberMe && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-[#2F3E34]">Remember me</span>
                </label>

                <Link
                  to="/request-link"
                  className="text-[#1E6B4E] font-medium hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-[#1E6B4E] text-white font-semibold rounded-xl hover:bg-[#165a40] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Enter Your Village'}
              </button>
            </form>

            {/* Footer */}
            <p className="text-center text-sm text-[#546E5C] mt-8">
              Don't have an invite code?{' '}
              <Link to="/waitlist" className="text-[#F8C3B3] font-semibold hover:text-[#1e6b4e] transition-colors">
                Join the Waitlist
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}