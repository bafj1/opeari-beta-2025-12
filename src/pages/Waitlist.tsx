import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Helmet } from 'react-helmet-async'

const heroImg = '/opeari-waitlist.png'

export default function Waitlist() {
  const [searchParams] = useSearchParams()
  const referredByCode = searchParams.get('ref')


  // Form state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [userType, setUserType] = useState('')
  const [urgency, setUrgency] = useState('')
  const [referralSource, setReferralSource] = useState('')
  const [referralName, setReferralName] = useState('')
  const [linkedin, setLinkedin] = useState('')
  const [instagram, setInstagram] = useState('')
  const [whyJoin, setWhyJoin] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [touched, setTouched] = useState({ email: false, zip: false })

  // UI state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [queuePosition, setQueuePosition] = useState(0)
  const [generatedReferralCode, setGeneratedReferralCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [emailStatus, setEmailStatus] = useState<{ sent: boolean; message?: string } | null>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)

  const showReferralName = ['friend', 'neighbor', 'parent_group', 'other'].includes(referralSource)

  const generateReferralCode = (name: string) => {
    const cleanName = name.toUpperCase().slice(0, 4).padEnd(4, 'X')
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    return `${cleanName}-${random}`
  }

  const getShareURL = () => {
    return `${window.location.origin}/waitlist?ref=${generatedReferralCode}`
  }

  const sanitize = (str: string) => {
    if (!str) return ''
    return str.replace(/[<>"'&]/g, '').trim()
  }

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const handleSubmit = async () => {
    setError('')

    if (honeypot) return

    const cleanFirstName = sanitize(firstName)
    const cleanLastName = sanitize(lastName)
    const cleanEmail = email.trim().toLowerCase()
    const cleanZip = zipCode.trim()
    const cleanPhone = phone.replace(/\D/g, '') // Normalize to digits only

    // Validation
    let validationError = ''
    if (!cleanFirstName) validationError = 'Please enter your first name.'
    else if (!cleanLastName) validationError = 'Please enter your last name.'
    else if (!cleanEmail || !isValidEmail(cleanEmail)) validationError = 'Please enter a valid email address.'
    else if (!cleanZip || cleanZip.length !== 5) validationError = 'Please enter a valid 5-digit ZIP code.'
    else if (!urgency) validationError = 'Please select your timeline.'
    else if (!userType) validationError = 'Please select what brings you here.'
    else if (!referralSource) validationError = 'Please tell us how you heard about Opeari.'
    else if ((showReferralName || referralSource === 'referral_code') && !referralName) {
      validationError = referralSource === 'referral_code' ? 'Please enter your referral code.' : 'Please tell us who referred you.'
    }

    if (validationError) {
      setError(validationError)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    const refCode = generateReferralCode(cleanFirstName)
    setLoading(true)

    try {
      // Direct Supabase Insert
      const { error: dbError } = await supabase
        .from('waitlist')
        .insert({
          first_name: cleanFirstName,
          last_name: cleanLastName,
          email: cleanEmail,
          phone: cleanPhone || null, // Optional, digits only
          zip_code: cleanZip,
          role: userType,
          // Mapping urgency to 'looking_for' column (Text) per schema Plan A
          looking_for: urgency,
          // Mapping 'why_join' column explicitly
          why_join: whyJoin ? sanitize(whyJoin) : null,
          hear_about_us: referralSource,
          referred_by: sanitize(referralName) || null,
          linkedin_url: linkedin ? sanitize(linkedin) : null,
          instagram_handle: instagram ? sanitize(instagram) : null, // New field
          referral_code: refCode,
        })

      if (dbError) {
        if (dbError.code === '23505') { // Unique violation
          setError("You're already on the waitlist! We'll be in touch soon.")
          window.scrollTo({ top: 0, behavior: 'smooth' })
          return
        }
        throw dbError
      }

      /* Fetch real waitlist count for "Queue Position" */
      // Use RPC function because RLS prevents anon from selecting rows to count them
      const { data: countData } = await supabase.rpc('get_waitlist_count')
      const realPosition = (countData || 0)

      // Success
      setGeneratedReferralCode(refCode)
      setQueuePosition(realPosition)
      setSuccess(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })

      /**
       * PROCESS NOTE:
       * Users are inserted into Supabase with default status: 'pending'.
       * They DO NOT get immediate access or an account setup link.
       * The email below is purely a "We've saved your spot" confirmation.
       * Admin must manually review and approve in Supabase before sending an invite.
       */
      // Send confirmation email (Non-blocking)
      try {
        const response = await fetch('/.netlify/functions/send-waitlist-confirmation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: cleanEmail,
            firstName: cleanFirstName,
            lastName: cleanLastName,
            zipCode: cleanZip,
            userType,
            referralSource,
            referralName: sanitize(referralName),
            referralCode: refCode,
            position: realPosition,
            childcareChallenge: whyJoin
          })
        })

        // Safely parse JSON only if response might contain it
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json()
          if (data.ok && data.emailSent) {
            console.log('Confirmation email sent.', data.messageId)
            setEmailStatus({ sent: true, message: data.messageId })
          } else {
            console.warn('Email sending reported failure:', data.error)
            setEmailStatus({ sent: false, message: 'Could not send confirmation email.' })
          }
        } else {
          // Handle 404/500 text responses without throwing
          console.warn('Email endpoint returned non-JSON response:', response.status, response.statusText)
          setEmailStatus({ sent: false, message: 'Email service unavailable.' })
        }
      } catch (emailErr) {
        // Catch network errors (e.g. offline) or JSON parse errors
        console.error('Network/Logic error sending email:', emailErr)
        setEmailStatus({ sent: false, message: 'Network error sending email.' })
      }

    } catch (err: any) {
      console.error('Waitlist submission error:', err)
      const msg = (err.message && err.message.includes('row-level security'))
        ? 'Submission blocked by security policy. Please contact support.'
        : 'Something went wrong. Please try again or contact us.'

      setError(msg)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setLoading(false)
    }
  }

  const copyLink = () => {
    navigator.clipboard.writeText(getShareURL()).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const shareText = () => {
    const url = getShareURL()
    const msg = `Hey! I just joined Opeari — a neighborhood childcare network. Check it out: ${url}`
    window.open(`sms:?&body=${encodeURIComponent(msg)}`, '_blank')
  }

  const shareEmail = () => {
    const url = getShareURL()
    const subject = 'Join me on Opeari'
    const body = `Hey!\n\nI signed up for Opeari — a neighborhood childcare network for nanny shares, backup care, and more.\n\nCheck it out: ${url}`
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank')
  }

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Opeari',
          text: 'Check out Opeari — neighborhood-powered childcare!',
          url: getShareURL()
        })
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Share failed:', err)
        }
      }
    }
  }

  const launchConfetti = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const colors = ['#1e6b4e', '#F8C3B3', '#3ca370', '#d8f5e5', '#5a8a72', '#fff']
    const confetti: any[] = []

    for (let i = 0; i < 200; i++) {
      confetti.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        w: Math.random() * 10 + 4,
        h: Math.random() * 6 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        speed: Math.random() * 2 + 1.5,
        angle: Math.random() * 360,
        spin: Math.random() * 0.15 - 0.075
      })
    }

    let frame = 0
    const maxFrames = 420

    // Respect reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      confetti.forEach(c => {
        c.y += c.speed
        c.x += Math.sin(c.angle) * 0.5
        c.angle += c.spin
        ctx.save()
        ctx.translate(c.x + c.w / 2, c.y + c.h / 2)
        ctx.rotate(c.angle)
        ctx.fillStyle = c.color
        ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h)
        ctx.restore()
      })
      frame++
      if (frame < maxFrames) {
        requestAnimationFrame(animate)
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }
    animate()
  }

  useEffect(() => {
    if (success) {
      // Small delay to ensure canvas is mounted
      setTimeout(() => launchConfetti(), 100)
    }
  }, [success])


  // Shared input styles
  const inputClass = "w-full px-3.5 py-2.5 border border-[#c8e6d9] rounded-[10px] font-[Comfortaa] text-sm text-[#1e6b4e] bg-white transition-all focus:outline-none focus:border-[#1e6b4e] focus:ring-4 focus:ring-[#1e6b4e]/10 placeholder:text-[#658585]"
  const labelClass = "block text-[0.7rem] font-bold mb-1.5 text-[#527a6a] uppercase tracking-wide"

  return (
    <div className="min-h-screen bg-[#fffaf5] font-[Comfortaa] text-[#1e6b4e] flex flex-col">
      <Helmet>
        <title>Opeari - Join the Waitlist</title>
        <meta name="description" content="Be the first to build your village. Join neighbors sharing childcare costs and creating flexible support networks." />

        {/* Open Graph */}
        <meta property="og:title" content="Opeari - Join the Waitlist" />
        <meta property="og:description" content="Be the first to build your village. Join neighbors sharing childcare costs and creating flexible support networks." />
        <meta property="og:image" content="https://opeari.com/opeari-waitlist.png" />
        <meta property="og:url" content="https://opeari.com/waitlist" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Opeari - Join the Waitlist" />
        <meta name="twitter:description" content="Be the first to build your village. Join neighbors sharing childcare costs and creating flexible support networks." />
        <meta name="twitter:image" content="https://opeari.com/opeari-waitlist.png" />
      </Helmet>
      <style>{`
        @keyframes float-pear {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-float-pear {
          animation: float-pear 6s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-float-pear { animation: none; }
        }
      `}</style>


      {/* Main Content Area */}
      <div className="flex-1 w-full max-w-[1200px] mx-auto px-8 py-6 grid grid-cols-[1fr_1.1fr] gap-16 items-start max-md:grid-cols-1 max-md:gap-6 max-md:px-4">
        {/* Hero Column */}
        <div className="text-center sticky top-[6.5rem] max-md:static">
          <h1 className="text-[2.5rem] leading-tight mb-4 text-[#1e6b4e] max-md:text-[2rem] font-extrabold">
            Welcome to the neighborhood.
          </h1>
          <p className="text-base leading-relaxed text-[#527a6a] mb-6 max-w-[420px] mx-auto max-md:text-[0.95rem]">
            We're building a trusted network for families to share care and support. Secure your spot for early access.
            {!success && <img src={heroImg} alt="Opeari Village" className="w-[180px] mx-auto mb-4 max-md:w-[140px] max-md:my-3" onError={(e) => (e.currentTarget.style.display = 'none')} />}
          </p>


          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-2 gap-x-4 border-t border-[#c8e6d9] pt-4 max-w-[420px] mx-auto">
            {[
              { icon: <polyline points="20 6 9 17 4 12" />, text: 'Childcare coordination, made easy' },
              { icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>, text: 'Private, trusted connections' },
              { icon: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>, text: 'Flexible schedules that fit your life' }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 font-semibold text-[0.85rem] p-1.5 px-2.5 rounded-lg transition-all hover:text-[#154a36] hover:font-bold group">
                <div className="w-7 h-7 bg-[#d8f5e5] rounded-full flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-110 group-hover:shadow-[0_0_16px_rgba(30,107,78,0.2)]">
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 stroke-[#1e6b4e] fill-none stroke-[2.5]" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    {item.icon}
                  </svg>
                </div>
                {item.text}
              </div>
            ))}
          </div>

          {/* Pears Decoration (Moved from Right Card) */}
        </div>

        {/* Form Card */}
        <div className="bg-white p-6 rounded-3xl shadow-[0_4px_24px_rgba(30,107,78,0.08)] border border-white/80 max-md:p-5 max-md:rounded-[20px]">
          {error && (
            <div className="bg-red-100 text-red-800 p-3 rounded-lg text-sm mb-4 text-center border border-red-200">
              {error}
            </div>
          )}

          {referredByCode && !success && (
            <div className="inline-flex items-center gap-2 bg-[#F8C3B3]/30 border border-[#F8C3B3] rounded-full px-4 py-2 text-[0.85rem] text-[#1e6b4e] mb-6 font-bold">
              <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-current fill-none" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              Invited by a neighbor
            </div>
          )}

          {!success ? (
            <div>
              {/* Honeypot */}
              <input
                type="text"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                className="absolute -left-[9999px]"
                tabIndex={-1}
                autoComplete="off"
              />

              {/* Name Row */}
              <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                <div className="mb-4">
                  <label htmlFor="firstName" className={labelClass}>First Name <span className="text-red-600" aria-hidden="true">*</span></label>
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    maxLength={50}
                    autoComplete="given-name"
                    className={inputClass}
                    autoFocus
                    aria-required="true"
                    aria-invalid={!firstName && touched.email ? 'true' : 'false'}
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="lastName" className={labelClass}>Last Name <span className="text-red-600" aria-hidden="true">*</span></label>
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    maxLength={50}
                    autoComplete="family-name"
                    className={inputClass}
                    aria-required="true"
                    aria-invalid={!lastName && touched.email ? 'true' : 'false'}
                  />
                </div>
              </div>

              {/* Email Row */}
              <div className="mb-4">
                <label htmlFor="email" className={labelClass}>Email Address <span className="text-red-600" aria-hidden="true">*</span></label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  autoComplete="email"
                  className={`${inputClass} ${touched.email && !isValidEmail(email) ? 'border-red-400 focus:border-red-500' : ''}`}
                  onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                  aria-required="true"
                  aria-invalid={touched.email && !isValidEmail(email) ? 'true' : 'false'}
                  aria-describedby={touched.email && !isValidEmail(email) ? "email-error" : undefined}
                />
                {touched.email && email && !isValidEmail(email) && (
                  <p id="email-error" className="mt-1 text-xs text-red-500 ml-1" role="alert">Please enter a valid email address.</p>
                )}
              </div>

              {/* Phone / ZIP Row */}
              <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1 mb-4">
                <div>
                  <label htmlFor="phone" className={labelClass}>Phone Number</label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '').slice(0, 10)
                      let formatted = raw
                      if (raw.length > 0) {
                        if (raw.length <= 3) formatted = `(${raw}`
                        else if (raw.length <= 6) formatted = `(${raw.slice(0, 3)}) ${raw.slice(3)}`
                        else formatted = `(${raw.slice(0, 3)}) ${raw.slice(3, 6)}-${raw.slice(6)}`
                      }
                      setPhone(formatted)
                    }}
                    placeholder="(555) 555-5555"
                    autoComplete="tel"
                    className={inputClass}
                  />
                  <p className="text-[0.7rem] text-[#527a6a] mt-1.5 ml-1 opacity-80 leading-tight">
                    Optional — helps us verify you.
                  </p>
                </div>
                <div>
                  <label htmlFor="zipCode" className={labelClass}>Zip Code <span className="text-red-600" aria-hidden="true">*</span></label>
                  <input
                    id="zipCode"
                    type="text"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                    maxLength={5}
                    inputMode="numeric"
                    autoComplete="postal-code"
                    className={`${inputClass} ${touched.zip && zipCode.length > 0 && zipCode.length < 5 ? 'border-red-400 focus:border-red-500' : ''}`}
                    onBlur={() => setTouched(prev => ({ ...prev, zip: true }))}
                    aria-required="true"
                    aria-invalid={touched.zip && zipCode.length > 0 && zipCode.length < 5 ? 'true' : 'false'}
                    aria-describedby={touched.zip && zipCode.length > 0 && zipCode.length < 5 ? "zip-error" : undefined}
                  />
                  {touched.zip && zipCode && zipCode.length < 5 && (
                    <p id="zip-error" className="mt-1 text-xs text-red-500 ml-1" role="alert">Zip code must be 5 digits.</p>
                  )}
                </div>
              </div>

              {/* Role Selection */}
              <div className="mb-4">
                <label id="role-label" className={labelClass}>What brings you here? <span className="text-red-600" aria-hidden="true">*</span></label>
                <div role="radiogroup" aria-labelledby="role-label" className="grid grid-cols-3 gap-3 mb-4 max-sm:gap-2">
                  {[
                    { value: 'family', label: 'Find Care', sub: 'Need childcare help', icon: <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></> },
                    { value: 'caregiver', label: 'Give Care', sub: 'Looking to provide care', icon: <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /> },
                    { value: 'both', label: 'Both', sub: 'Need care & want to give', icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></> }
                  ].map((role) => (
                    <label key={role.value} className="cursor-pointer relative">
                      <input
                        type="radio"
                        name="role"
                        value={role.value}
                        checked={userType === role.value}
                        onChange={() => setUserType(role.value)}
                        className="absolute opacity-0 peer"
                      />
                      <div className={`border rounded-xl p-3 px-1 text-center transition-all h-full flex flex-col items-center justify-center min-h-[110px]
                        peer-focus:ring-4 peer-focus:ring-[#1e6b4e]/30 peer-focus:border-[#1e6b4e]
                        ${userType === role.value
                          ? 'border-[#1e6b4e] border-2 bg-[#d8f5e5] shadow-[0_2px_8px_rgba(30,107,78,0.15)]'
                          : 'border-[#c8e6d9] bg-white'}`}
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true" className={`w-[24px] h-[24px] mb-1.5 stroke-[1.5] fill-none ${userType === role.value ? 'stroke-[#1e6b4e]' : 'stroke-[#527a6a]'}`} strokeLinecap="round" strokeLinejoin="round">
                          {role.icon}
                        </svg>
                        <span className={`text-[0.8rem] font-bold leading-tight ${userType === role.value ? 'text-[#1e6b4e]' : 'text-[#527a6a]'}`}>
                          {role.label}
                        </span>
                        <span className={`text-[0.65rem] mt-1 leading-tight ${userType === role.value ? 'text-[#1e6b4e]' : 'text-[#8faaaa]'}`}>
                          {role.sub}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center my-7 mb-5 text-[#527a6a] text-[0.8rem]" aria-hidden="true">
                <div className="flex-1 h-px bg-[#c8e6d9]" />
                <span className="px-4 bg-white">A few more details</span>
                <div className="flex-1 h-px bg-[#c8e6d9]" />
              </div>

              {/* Timeline & Referral Source - STACKED */}
              <div className="flex flex-col gap-4">
                <div className="mb-2">
                  <label htmlFor="urgency" className={labelClass}>Timeline <span className="text-red-600" aria-hidden="true">*</span></label>
                  <select
                    id="urgency"
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value)}
                    className={`${inputClass} cursor-pointer bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%231e6b4e' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")] bg-no-repeat bg-[right_16px_center] appearance-none`}
                    aria-required="true"
                  >
                    <option value="">When do you need care?</option>
                    <option value="asap">ASAP (Ready now)</option>
                    <option value="1-3months">1-3 months</option>
                    <option value="3-6months">3-6 months</option>
                    <option value="exploring">Just exploring</option>
                  </select>
                  <p className="text-[0.7rem] text-[#527a6a] mt-1.5 ml-1 opacity-80 leading-tight">
                    Helps us prioritize families who need care immediately.
                  </p>
                </div>

                {/* Source */}
                <div className="mb-2">
                  <label htmlFor="referralSource" className={labelClass}>How did you hear? <span className="text-red-600" aria-hidden="true">*</span></label>
                  <select
                    id="referralSource"
                    value={referralSource}
                    onChange={(e) => {
                      setReferralSource(e.target.value)
                      if (e.target.value !== 'referral_code') setReferralName('')
                    }}
                    className={`${inputClass} cursor-pointer bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%231e6b4e' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")] bg-no-repeat bg-[right_16px_center] appearance-none`}
                    aria-required="true"
                  >
                    <option value="">Select...</option>
                    <option value="friend">Friend or family</option>
                    <option value="neighbor">Neighbor</option>
                    <option value="referral_code" className="font-bold">I have a code/name</option>
                    <option value="parent_group">Parent group</option>
                    <option value="social_media">Social media</option>
                    <option value="search">Google search</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Referral Code Toggle */}
                {(referralSource === '' || referralSource === 'referral_code') && (
                  <div className="mb-4">
                    <button
                      type="button"
                      onClick={() => setReferralSource(prev => prev === 'referral_code' ? '' : 'referral_code')}
                      className="text-sm font-semibold text-[#1e6b4e] flex items-center gap-2 hover:opacity-80 mb-2"
                      aria-expanded={referralSource === 'referral_code'}
                    >
                      <span className={`transition-transform duration-200 ${referralSource === 'referral_code' ? 'rotate-90' : ''}`} aria-hidden="true">▶</span>
                      Have a referral code?
                    </button>

                    {referralSource === 'referral_code' && (
                      <div className="mt-2 animate-in slide-in-from-top-2 duration-200">
                        <label htmlFor="referralName" className={labelClass}>Referral Code</label>
                        <input
                          id="referralName"
                          type="text"
                          value={referralName}
                          onChange={(e) => setReferralName(e.target.value)}
                          placeholder="Enter referral code"
                          className={inputClass}
                        />
                      </div>
                    )}
                  </div>

                )}

                {(showReferralName && referralSource !== 'referral_code') && (
                  <div className="mb-4">
                    <label htmlFor="referralName" className={labelClass}>
                      {referralSource === 'other' ? 'How did you find us?' : 'Who referred you?'} <span className="text-red-600" aria-hidden="true">*</span>
                    </label>
                    <input
                      id="referralName"
                      type="text"
                      value={referralName}
                      onChange={(e) => setReferralName(e.target.value)}
                      placeholder="Their name"
                      maxLength={100}
                      className={inputClass}
                      aria-required="true"
                    />
                  </div>
                )}
              </div>

              <div className="mb-4">
                <label htmlFor="linkedin" className={labelClass}>
                  LinkedIn <span className="text-[#8faaaa] font-normal normal-case tracking-normal">(Optional — helps verify you)</span>
                </label>
                <input
                  id="linkedin"
                  type="url"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  placeholder="linkedin.com/in/you"
                  className={inputClass}
                />
              </div>

              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => setInstagram(prev => prev === '' ? '@' : '')}
                  className="text-sm font-semibold text-[#1e6b4e] flex items-center gap-2 hover:opacity-80 mb-2"
                  aria-expanded={instagram !== ''}
                >
                  <span className={`transition-transform duration-200 ${instagram ? 'rotate-90' : ''}`} aria-hidden="true">▶</span>
                  Have an Instagram handle?
                </button>

                {instagram !== '' && (
                  <div className="mt-2 animate-in slide-in-from-top-2 duration-200">
                    <label htmlFor="instagram" className={labelClass}>Instagram Handle</label>
                    <input
                      id="instagram"
                      type="text"
                      value={instagram === '@' ? '' : instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      placeholder="@yourusername"
                      className={inputClass}
                    />
                  </div>
                )}
              </div>

              <div className="mb-4">
                <label htmlFor="whyJoin" className={labelClass}>Why join?</label>
                <textarea
                  id="whyJoin"
                  value={whyJoin}
                  onChange={(e) => setWhyJoin(e.target.value)}
                  placeholder="Looking for a nanny share nearby..."
                  className={`${inputClass} min-h-[60px] resize-y`}
                />
                <p className="text-[0.7rem] text-[#527a6a] mt-1.5 ml-1 opacity-80 leading-tight">
                  Optional — helps us learn about your situation.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-4 bg-[#1e6b4e] text-white rounded-full font-bold text-lg mt-5 transition-all shadow-[0_4px_12px_rgba(30,107,78,0.2)] hover:bg-[#154a36] hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(30,107,78,0.3)] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none relative"
              >
                {loading ? (
                  <span className="inline-block w-5 h-5 border-[3px] border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Secure My Spot'
                )}
              </button>

              <p className="text-center mt-4 text-[0.8rem] text-[#527a6a] opacity-80">
                We respect your privacy. No spam, just updates.
              </p>
            </div>
          ) : (
            /* Success State */
            <div className="text-center py-2 relative z-10">


              <canvas ref={canvasRef} className="fixed inset-0 w-full h-full pointer-events-none z-[999]" />
              <img src={heroImg} alt="Opeari Village" className="w-[180px] mx-auto mb-2 max-w-full h-auto" />
              <h2 className="text-[#1e6b4e] text-[2rem] mb-2 font-bold relative z-10">You're on the list!</h2>
              <p className="text-[#527a6a] mb-5 relative z-10">Thanks, <span className="font-bold">{firstName}</span>. We'll be in touch soon.
                {emailStatus?.sent === false && (
                  <span className="block text-sm text-[#F8C3B3] mt-2 bg-[#1e6b4e] px-3 py-1 rounded-full font-bold">
                    Note: Confirmation email failed to send, but you are signed up.
                  </span>
                )}
              </p>

              <div className="bg-[#d8f5e5] rounded-2xl py-4 px-8 mx-auto inline-block min-w-[200px] mb-6 shadow-inner relative z-10">
                <div className="text-[3.5rem] font-bold text-[#1e6b4e] leading-none mb-1">#{queuePosition}</div>
                <div className="text-[0.9rem] text-[#527a6a] uppercase tracking-widest font-bold">in line</div>
              </div>

              <div className="bg-gradient-to-br from-[#f8fdf9] to-white p-6 rounded-2xl text-left border border-[#c8e6d9] shadow-[0_4px_16px_rgba(30,107,78,0.06)] relative z-10">
                <h4 className="text-[#1e6b4e] mb-1.5 font-bold text-lg">Skip the wait</h4>
                <p className="text-[0.9rem] text-[#527a6a] mb-5">
                  Every neighbor who joins moves you up the list.
                </p>

                {/* Clean Code Display */}
                <div className="bg-[#fffaf5] border border-[#c8e6d9] rounded-xl p-4 mb-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-[0.7rem] text-[#527a6a] uppercase tracking-wide font-bold mb-1">Your Referral Code</div>
                    <div className="text-2xl font-bold text-[#1e6b4e] tracking-wider font-mono">{generatedReferralCode}</div>
                  </div>
                  <button
                    onClick={copyLink}
                    className={`px-5 py-2.5 rounded-lg font-bold transition-all whitespace-nowrap shadow-sm ${copied ? 'bg-[#F8C3B3] text-[#1e6b4e]' : 'bg-[#1e6b4e] text-white hover:bg-[#154a36] hover:-translate-y-0.5'}`}
                  >
                    {copied ? 'Copied Link!' : 'Copy Link'}
                  </button>
                </div>

                <div className="flex gap-2 mt-3 max-md:flex-col">
                  {[
                    { fn: shareText, icon: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2-2h14a2 2 0 0 1 2-2h14a2 2 0 0 1 2-2 z" />, label: 'Text' },
                    { fn: shareEmail, icon: <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></>, label: 'Email' },
                  ].map((btn, i) => (
                    <button
                      key={i}
                      onClick={btn.fn}
                      className="flex-1 flex items-center justify-center gap-1.5 p-3 border border-[#c8e6d9] rounded-lg bg-white font-semibold text-[0.85rem] text-[#1e6b4e] transition-all hover:border-[#1e6b4e] hover:bg-[#d8f5e5]"
                    >
                      <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] stroke-current fill-none stroke-2">
                        {btn.icon}
                      </svg>
                      {btn.label}
                    </button>
                  ))}
                  {typeof navigator !== 'undefined' && 'share' in navigator && (
                    <button
                      onClick={shareNative}
                      className="flex-1 flex items-center justify-center gap-1.5 p-3 border border-[#c8e6d9] rounded-lg bg-white font-semibold text-[0.85rem] text-[#1e6b4e] transition-all hover:border-[#1e6b4e] hover:bg-[#d8f5e5]"
                    >
                      <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] stroke-current fill-none stroke-2">
                        <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                      </svg>
                      Share
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}