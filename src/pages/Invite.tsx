import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Helmet } from 'react-helmet-async'

export default function Invite() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [step, setStep] = useState<'validating' | 'invalid' | 'expired' | 'create-account' | 'success'>('validating')
  const [referrerName, setReferrerName] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [touched, setTouched] = useState({
    firstName: false,
    lastName: false,
    email: false,
    password: false,
    confirmPassword: false
  })

  // Helper for validation
  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const isValidPassword = (pwd: string) => pwd.length >= 8
  const doPasswordsMatch = formData.password === formData.confirmPassword

  const referralCode = searchParams.get('code') || searchParams.get('ref')
  const emailFromLink = searchParams.get('email')

  useEffect(() => {
    if (emailFromLink) {
      setFormData(prev => ({ ...prev, email: emailFromLink }))
    }
    validateInvite()
  }, [referralCode, emailFromLink])

  async function validateInvite() {
    if (!referralCode) {
      setStep('invalid')
      return
    }

    try {
      // DEBUG: Log code being checked (Remove in prod)
      console.log('Validating invite code:', referralCode)

      // Look up in waitlist first (Source of truth for invite codes)
      const { data: waitlistReferrer, error } = await supabase
        .from('waitlist')
        .select('first_name')
        .eq('referral_code', referralCode)
        .maybeSingle()

      console.log('Waitlist result:', { waitlistReferrer, error })

      if (waitlistReferrer) {
        setReferrerName(waitlistReferrer.first_name)
        setStep('create-account')
        return
      }

      // Fallback: Check active members (if you have member-referrals later)
      // Note: Using maybeSingle to avoid 406
      const { data: memberReferrer } = await supabase
        .from('members')
        .select('first_name')
        .eq('referral_code', referralCode)
        .maybeSingle()

      if (memberReferrer) {
        setReferrerName(memberReferrer.first_name)
        setStep('create-account')
        return
      }

      console.log('Invalid invite code (not found in waitlist or members)')
      setStep('invalid')

    } catch (err) {
      console.error('Error validating invite:', err)
      setStep('invalid')
    }
  }

  async function handleResendLink() {
    if (!formData.email) {
      setError('Please enter your email address first')
      return
    }

    setResendLoading(true)
    setError('')

    try {
      // Check if user exists but isn't confirmed
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: formData.email,
      })

      if (error) throw error

      setResendSuccess(true)
      setTimeout(() => setResendSuccess(false), 5000)
    } catch (err: any) {
      // If resend fails, they might not have an account yet - that's okay
      setError('Could not resend. Try creating your account again.')
    } finally {
      setResendLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    // Validation
    if (!formData.firstName.trim()) {
      setError('Please enter your first name')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match")
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)

    try {
      // Create auth account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      })

      if (authError) {
        // Handle specific errors
        if (authError.message.includes('already registered')) {
          setError('This email is already registered. Try logging in instead.')
        } else if (authError.message.includes('valid email')) {
          setError('Please enter a valid email address')
        } else {
          throw authError
        }
        return
      }

      if (authData.user) {
        // Create member record
        const { error: memberError } = await supabase
          .from('members')
          .insert({
            user_id: authData.user.id,
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email,
            referred_by: referralCode,
            status: 'active',
          })

        if (memberError) {
          console.error('Member creation error:', memberError)
          // Don't throw - auth account exists, we can fix member later
        }

        if (referralCode) {
          try {
            await supabase.rpc('increment_referral_count', { ref_code: referralCode })
          } catch { }
        }

        setStep('success')
      }
    } catch (err: any) {
      console.error('Signup error:', err)
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Validating state
  if (step === 'validating') {
    return (
      <div className="min-h-screen bg-[#fffaf5] flex items-center justify-center p-4">
        <Helmet>
          <title>Opeari - Invite Your Village</title>
          <meta name="description" content="The more neighbors who join, the stronger the network. Invite friends to unlock flexible, local childcare." />

          {/* Open Graph */}
          <meta property="og:title" content="Opeari - Invite Your Village" />
          <meta property="og:description" content="The more neighbors who join, the stronger the network. Invite friends to unlock flexible, local childcare." />
          <meta property="og:image" content="https://opeari.com/opeari-village-hero.png" />
          <meta property="og:url" content="https://opeari.com/invite" />

          {/* Twitter */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="Opeari - Invite Your Village" />
          <meta name="twitter:description" content="The more neighbors who join, the stronger the network. Invite friends to unlock flexible, local childcare." />
          <meta name="twitter:image" content="https://opeari.com/opeari-village-hero.png" />
        </Helmet>
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-[#1e6b4e] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#1e6b4e] font-medium text-sm">Validating your invite...</p>
        </div>
      </div>
    )
  }

  // Invalid/Expired invite
  if (step === 'invalid' || step === 'expired') {
    return (
      <div className="min-h-screen bg-[#fffaf5] flex items-center justify-center p-4">
        <div className="max-w-sm w-full text-center bg-white p-8 rounded-3xl shadow-[0_20px_25px_-5px_rgba(30,107,78,0.1),0_10px_10px_-5px_rgba(30,107,78,0.04)] border border-[#8bd7c7]/30">
          <div className="w-16 h-16 bg-[#F8C3B3]/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#F8C3B3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#1e6b4e] mb-2">
            {step === 'expired' ? 'Link Expired' : 'Invalid Invite'}
          </h1>
          <p className="text-[#4A6163] text-sm mb-6 leading-relaxed">
            {step === 'expired'
              ? 'This invite link has expired. Request a new one from your friend!'
              : 'This invite link is invalid. Ask your friend for a new one!'}
          </p>

          {/* Resend option */}
          <div className="bg-[#f0f9f6] rounded-xl p-5 mb-5 border border-[#c8e6d9]">
            <p className="text-sm text-[#1e6b4e] font-medium mb-3">Already started signing up?</p>
            <input
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 border border-[#c8e6d9] rounded-xl text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-[#1e6b4e]/20 focus:border-[#1e6b4e] transition-all"
            />
            <button
              onClick={handleResendLink}
              disabled={resendLoading}
              className="w-full py-3 text-sm font-bold text-[#1e6b4e] border-2 border-[#1e6b4e] rounded-full hover:bg-[#1e6b4e] hover:text-white transition-all disabled:opacity-50"
            >
              {resendLoading ? 'Sending...' : 'Resend Confirmation Email'}
            </button>
            {resendSuccess && (
              <p className="text-sm text-[#1e6b4e] mt-2 font-medium">✓ Check your email!</p>
            )}
          </div>

          <Link
            to="/waitlist"
            className="inline-block px-8 py-3 bg-[#F8C3B3] text-[#1e6b4e] font-bold rounded-full hover:bg-[#f5a08a] transition-all text-sm shadow-[0_4px_6px_-1px_rgba(30,107,78,0.1),0_2px_4px_-1px_rgba(30,107,78,0.06)] hover:-translate-y-0.5"
          >
            Join Waitlist
          </Link>

          <p className="text-xs text-[#8faaaa] mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-[#1e6b4e] font-bold hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    )
  }

  // Success state
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-[#fffaf5] flex items-center justify-center p-4">
        <div className="max-w-sm w-full text-center bg-white p-8 rounded-3xl shadow-[0_20px_25px_-5px_rgba(30,107,78,0.1),0_10px_10px_-5px_rgba(30,107,78,0.04)] border border-[#8bd7c7]/30">
          <div className="w-16 h-16 bg-[#d8f5e5] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#1e6b4e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#1e6b4e] mb-2">Seed Planted! 🌿</h1>
          <p className="text-[#4A6163] text-sm mb-8 leading-relaxed">
            Welcome to Opeari. You've just strengthened the network for your neighbors. Complete your profile to see who else is nearby.
          </p>
          <button
            onClick={() => navigate('/onboarding')}
            className="w-full max-w-xs px-6 py-3.5 bg-[#1e6b4e] text-white font-bold rounded-full hover:bg-[#154a36] hover:shadow-[0_10px_15px_-3px_rgba(30,107,78,0.1),0_4px_6px_-2px_rgba(30,107,78,0.05)] hover:-translate-y-0.5 transition-all"
          >
            Complete Profile
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="block mx-auto mt-4 text-sm text-[#1e6b4e] font-semibold hover:underline opacity-80"
          >
            Skip for now →
          </button>
        </div>
      </div>
    )
  }

  // Create account form (mobile-first)
  return (
    <div className="min-h-screen bg-[#fffaf5] flex flex-col">
      {/* Simple header */}
      <header className="p-6 flex justify-center">
        <Link to="/">
          <img src="/logo.svg" alt="Opeari" className="h-10" />
        </Link>
      </header>

      {/* Form */}
      <main className="flex-1 flex items-center justify-center p-4 pb-12">
        <div className="max-w-[500px] w-full">
          <div className="bg-white rounded-3xl border border-[#8bd7c7]/30 shadow-[0_20px_25px_-5px_rgba(30,107,78,0.1),0_10px_10px_-5px_rgba(30,107,78,0.04)] p-8 sm:p-10 relative overflow-hidden">
            {/* Decor */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#d8f5e5]/50 rounded-bl-full -z-0 pointer-events-none" />

            {/* Header */}
            <div className="text-center mb-8 relative z-10">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#1e6b4e] mb-2">Welcome to Opeari!</h1>
              {referrerName ? (
                <p className="text-[#4A6163]">
                  You’ve been invited to join <span className="text-[#1e6b4e] font-bold">{referrerName}'s</span> village
                </p>
              ) : (
                <p className="text-[#4A6163]">You’ve been invited! Create your account to get started</p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="mb-6 p-4 bg-[#F8C3B3]/10 border border-[#F8C3B3] rounded-xl text-[#e08e79] text-sm font-medium text-center">
                {error}
                {error.includes('already registered') && (
                  <Link to="/login" className="block mt-2 font-bold underline hover:text-[#c47764]">
                    Go to login →
                  </Link>
                )}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
              {/* Name row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1e6b4e] mb-1.5 uppercase tracking-wide">
                    First Name
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-3 border border-[#c8e6d9] rounded-xl text-[#1e6b4e] focus:outline-none focus:ring-2 focus:ring-[#1e6b4e]/20 focus:border-[#1e6b4e] transition-all placeholder:text-[#8faaaa]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1e6b4e] mb-1.5 uppercase tracking-wide">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-3 border border-[#c8e6d9] rounded-xl text-[#1e6b4e] focus:outline-none focus:ring-2 focus:ring-[#1e6b4e]/20 focus:border-[#1e6b4e] transition-all placeholder:text-[#8faaaa]"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-[#1e6b4e] mb-1.5 uppercase tracking-wide">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  onBlur={() => setTouched({ ...touched, email: true })}
                  className={`w-full px-4 py-3 border rounded-xl text-[#1e6b4e] focus:outline-none focus:ring-2 focus:ring-[#1e6b4e]/20 transition-all placeholder:text-[#8faaaa] ${touched.email && !isValidEmail(formData.email)
                    ? 'border-red-400 focus:border-red-500'
                    : 'border-[#c8e6d9] focus:border-[#1e6b4e]'
                    }`}
                />
                {touched.email && formData.email && !isValidEmail(formData.email) && (
                  <p className="mt-1 text-xs text-red-500 font-medium">Please enter a valid email address</p>
                )}
              </div>

              {/* Password with toggle */}
              <div>
                <label className="block text-xs font-bold text-[#1e6b4e] mb-1.5 uppercase tracking-wide">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    onBlur={() => setTouched({ ...touched, password: true })}
                    placeholder="At least 8 characters"
                    className={`w-full px-4 py-3 pr-12 border rounded-xl text-[#1e6b4e] focus:outline-none focus:ring-2 focus:ring-[#1e6b4e]/20 transition-all placeholder:text-[#8faaaa] ${touched.password && !isValidPassword(formData.password)
                      ? 'border-red-400 focus:border-red-500'
                      : 'border-[#c8e6d9] focus:border-[#1e6b4e]'
                      }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8faaaa] hover:text-[#1e6b4e] transition-colors"
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
              </div>

              {/* Confirm Password with toggle */}
              <div>
                <label className="block text-xs font-bold text-[#1e6b4e] mb-1.5 uppercase tracking-wide">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    onBlur={() => setTouched({ ...touched, confirmPassword: true })}
                    className={`w-full px-4 py-3 pr-12 border rounded-xl text-[#1e6b4e] focus:outline-none focus:ring-2 focus:ring-[#1e6b4e]/20 transition-all ${touched.confirmPassword && !doPasswordsMatch
                      ? 'border-red-400 focus:border-red-500'
                      : 'border-[#c8e6d9] focus:border-[#1e6b4e]'
                      }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8faaaa] hover:text-[#1e6b4e] transition-colors"
                  >
                    {showConfirmPassword ? (
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
                {touched.confirmPassword && !doPasswordsMatch && (
                  <p className="text-xs text-red-500 mt-1 font-medium">Passwords don't match</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !formData.firstName || !isValidEmail(formData.email) || !isValidPassword(formData.password) || !doPasswordsMatch}
                className="w-full py-4 bg-[#1e6b4e] text-white font-bold rounded-full hover:bg-[#154a36] hover:shadow-[0_10px_15px_-3px_rgba(30,107,78,0.1),0_4px_6px_-2px_rgba(30,107,78,0.05)] hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-[3px] border-white/30 border-t-white rounded-full animate-spin"></span>
                    Creating Account...
                  </span>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            {/* Help section */}
            <div className="mt-8 pt-6 border-t border-[#c8e6d9]">
              <p className="text-xs text-[#8faaaa] text-center mb-4">Having trouble?</p>
              <button
                onClick={handleResendLink}
                disabled={resendLoading || !formData.email}
                className="w-full py-2.5 text-sm bg-white border border-[#c8e6d9] text-[#1e6b4e] font-bold rounded-xl hover:bg-[#f0f9f6] disabled:opacity-50 transition-all"
              >
                {resendLoading ? 'Sending...' : 'Resend confirmation email'}
              </button>
              {resendSuccess && (
                <p className="text-xs text-[#1e6b4e] text-center mt-2 font-bold">✓ Email sent! Check your inbox.</p>
              )}
            </div>

            <p className="text-center text-xs text-[#8faaaa] mt-6 leading-relaxed">
              By joining, you agree to our{' '}
              <Link to="/terms" className="text-[#1e6b4e] font-bold hover:underline">Terms</Link>
              {' '}and{' '}
              <Link to="/privacy" className="text-[#1e6b4e] font-bold hover:underline">Privacy Policy</Link>
            </p>
          </div>

          <p className="text-center text-sm text-[#4A6163] mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-[#1e6b4e] font-bold hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}