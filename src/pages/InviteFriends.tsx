import { useState, useEffect } from 'react'
// import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Header from '../components/common/Header'
import Toast from '../components/common/Toast'
import { logAlphaEvent } from '../lib/analytics'

interface Referral {
  id: string
  first_name: string
  created_at: string
  status: string
}

export default function InviteFriends() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [referralCode, setReferralCode] = useState('')
  const [referralCount, setReferralCount] = useState(0)
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [copied, setCopied] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const inviteLink = `https://opeari.com/invite?code=${referralCode}`

  useEffect(() => {
    if (user) loadReferralData()
  }, [user])

  async function loadReferralData() {
    try {
      // Get user's referral code
      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('referral_code, referral_count')
        .eq('user_id', user!.id)
        .single()

      if (memberError) throw memberError

      if (member) {
        setReferralCode(member.referral_code || '')
        setReferralCount(member.referral_count || 0)

        // Get list of people they've referred
        if (member.referral_code) {
          const { data: refs } = await supabase
            .from('members')
            .select('id, first_name, created_at, status')
            .eq('referred_by', member.referral_code)
            .order('created_at', { ascending: false })
            .limit(10)

          if (refs) setReferrals(refs)
        }
      }
    } catch (err) {
      console.error('Error loading referral data:', err)
    } finally {
      setLoading(false)
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    logAlphaEvent('invite_link_generated', { method: 'clipboard', code: referralCode })
    setTimeout(() => setCopied(false), 2000)
  }

  function shareVia(platform: 'sms' | 'email' | 'whatsapp') {
    const message = `Join me on Opeari! It's a neighborhood childcare network that helps families connect for nanny shares, backup care, and more. Use my link to skip the waitlist: ${inviteLink}`

    // LOG SIGNAL
    logAlphaEvent('invite_link_generated', { method: platform, code: referralCode })

    switch (platform) {
      case 'sms':
        window.open(`sms:?body=${encodeURIComponent(message)}`)
        break
      case 'email':
        window.open(`mailto:?subject=${encodeURIComponent('Join me on Opeari!')}&body=${encodeURIComponent(message)}`)
        break
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`)
        break
    }
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-cream flex items-center justify-center">
          <div className="text-primary font-semibold animate-pulse">Loading...</div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-cream">
        <div className="max-w-2xl mx-auto px-4 py-8">

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-primary mb-2">Invite Friends</h1>
            <p className="text-text-secondary">
              Build your village! Friends you invite skip the waitlist and join directly.
            </p>
          </div>

          {/* Stats Card */}
          <div className="bg-gradient-to-br from-primary to-primary-dark rounded-2xl p-6 text-white mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm mb-1">Families Invited</p>
                <p className="text-4xl font-bold">{referralCount}</p>
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
            {referralCount >= 3 && (
              <div className="mt-4 pt-4 border-t border-white/20">
                <p className="text-sm text-white/90">
                  🎉 You're a Village Builder! Thanks for spreading the word.
                </p>
              </div>
            )}
          </div>

          {/* Referral Link Card */}
          <div className="bg-white rounded-2xl border border-border p-6 mb-6">
            <h2 className="font-semibold text-primary mb-4">Your Invite Link</h2>

            {/* Referral code display */}
            <div className="flex items-center justify-between p-4 bg-mint/30 rounded-lg mb-4">
              <div>
                <p className="text-xs text-text-muted">Your referral code</p>
                <p className="font-bold text-primary text-2xl tracking-wider">{referralCode}</p>
              </div>
              <button
                onClick={() => copyToClipboard(referralCode)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${copied
                  ? 'bg-primary text-white'
                  : 'bg-white text-primary border border-primary hover:bg-primary hover:text-white'
                  }`}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            {/* Link display */}
            <div className="mb-6">
              <p className="text-xs text-text-muted mb-2">Or share this link</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-4 py-3 bg-cream rounded-lg text-text-primary text-sm font-mono truncate">
                  {inviteLink}
                </div>
                <button
                  onClick={() => copyToClipboard(inviteLink)}
                  className="px-4 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>

            {/* Share buttons */}
            <div className="space-y-3">
              <p className="text-sm text-text-secondary">Share via:</p>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => shareVia('sms')}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-cream rounded-lg hover:bg-mint/50 transition-colors"
                >
                  <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span className="text-sm font-medium text-text-primary">Text</span>
                </button>
                <button
                  onClick={() => shareVia('email')}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-cream rounded-lg hover:bg-mint/50 transition-colors"
                >
                  <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-medium text-text-primary">Email</span>
                </button>
                <button
                  onClick={() => shareVia('whatsapp')}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-cream rounded-lg hover:bg-mint/50 transition-colors"
                >
                  <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  <span className="text-sm font-medium text-text-primary">WhatsApp</span>
                </button>
              </div>
            </div>
          </div>

          {/* Recent Referrals */}
          {referrals.length > 0 && (
            <div className="bg-white rounded-2xl border border-border p-6">
              <h2 className="font-semibold text-primary mb-4">Your Referrals</h2>
              <div className="space-y-3">
                {referrals.map((ref) => (
                  <div key={ref.id} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-mint flex items-center justify-center text-primary font-bold">
                        {ref.first_name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">{ref.first_name}</p>
                        <p className="text-xs text-text-muted">
                          Joined {new Date(ref.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${ref.status === 'active'
                      ? 'bg-mint text-primary'
                      : 'bg-cream text-text-muted'
                      }`}>
                      {ref.status === 'active' ? 'Active' : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="mt-6 p-4 bg-mint/30 rounded-xl">
            <h3 className="font-semibold text-primary text-sm mb-2">💡 Tips for inviting</h3>
            <ul className="text-sm text-text-secondary space-y-1">
              <li>• Parents in your neighborhood are perfect matches</li>
              <li>• Families with kids similar ages to yours</li>
              <li>• Friends looking for nanny shares or backup care</li>
            </ul>
          </div>

        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  )
}