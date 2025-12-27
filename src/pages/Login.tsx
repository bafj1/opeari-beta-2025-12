import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`
      }
    })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Check your email for the login link!')
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-[#fffaf5] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#e8e4de] p-8">
          {/* Mascot */}
          <div className="flex justify-center mb-6">
            <img
              src="/opeari-welcome-green.png"
              alt="Opeari mascot"
              className="w-24 h-24 object-contain"
            />
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[#1E6B4E] mb-2">Welcome back</h1>
            <p className="text-[#5a6e5a]">Enter your email to sign in</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
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

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#1E6B4E] text-white font-semibold rounded-xl hover:bg-[#165a40] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send Login Link'}
            </button>
          </form>

          {/* Message */}
          {message && (
            <div className={`mt-6 p-4 rounded-xl text-sm ${message.includes('Check your email')
                ? 'bg-[#1E6B4E]/10 text-[#1E6B4E]'
                : 'bg-red-50 text-red-600'
              }`}>
              {message}
            </div>
          )}

          {/* Footer link */}
          <p className="text-center text-sm text-[#5a6e5a] mt-8">
            Don't have an account?{' '}
            <Link to="/waitlist" className="text-[#1E6B4E] font-semibold hover:underline">
              Join the Waitlist
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}