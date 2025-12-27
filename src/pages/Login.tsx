import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff } from 'lucide-react'

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

      // Check if onboarding is complete
      const { data: member } = await supabase
        .from('members')
        .select('onboarding_complete')
        .eq('user_id', data.user.id)
        .single()

      if (member?.onboarding_complete) {
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

  return (
    <main className="min-h-screen bg-[#fffaf5] flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-[#1E6B4E] to-[#2d7a5e] p-12 flex-col justify-between text-white relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-white/5 rounded-full" />
        <div className="absolute bottom-40 left-10 w-24 h-24 bg-white/5 rounded-full" />

        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-4">Welcome back to your village</h2>
          <p className="text-white/80 text-lg mb-10">
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

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
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
                  className="w-full px-4 py-3 rounded-xl border border-[#e8e4de] text-[#1E6B4E] placeholder-[#9ca3af] focus:outline-none focus:border-[#1E6B4E] focus:ring-2 focus:ring-[#1E6B4E]/20 transition-all"
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
                <label className="flex items-center gap-2 cursor-pointer text-[#5a6e5a]">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-[#e8e4de] text-[#1E6B4E] focus:ring-[#1E6B4E]/20"
                  />
                  Remember me
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
            <p className="text-center text-sm text-[#5a6e5a] mt-8">
              Don't have an invite code?{' '}
              <Link to="/waitlist" className="text-[#1E6B4E] font-semibold hover:underline">
                Join the Waitlist
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}