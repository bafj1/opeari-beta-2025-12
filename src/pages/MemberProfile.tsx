import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Header from '../components/common/Header'
import Toast from '../components/ui/Toast'
import { logAlphaEvent } from '../lib/analytics'
import {
  NANNY_SITUATION_OPTIONS,
  LOOKING_FOR_OPTIONS,
  OPEN_TO_OPTIONS,
  calculateKidAge,
  WEEKDAYS,
  TIME_SLOTS,
} from '../lib/Constants'

type Schedule = Record<string, string[]>

interface Kid {
  id: string
  first_name?: string
  name?: string
  gender: string | null
  birth_month: number | null
  birth_year: number | null
}

interface MemberData {
  id: string
  first_name: string
  location: string
  neighborhood: string
  photo_url: string | null
  bio: string
  tagline: string
  nanny_situation: string
  looking_for: string[]
  open_to: string[]
  care_timeline: string
  schedule: Schedule
  schedule_flexible: boolean
  schedule_notes: string
  kids: Kid[]
}

// Colors
const COLORS = {
  primary: '#1e6b4e',
  coral: '#F8C3B3',
  mint: '#d8f5e5',
  mintDark: '#8bd7c7',
  cream: '#fffaf5',
  text: '#1e6b4e',
  textMuted: '#4A6163',
}

// Helper to get proper label for looking_for
function getLookingForLabel(item: string): string {
  const option = LOOKING_FOR_OPTIONS.find(o => o.id === item)
  if (option) return option.label

  // Handle legacy formats
  const normalized = item.toLowerCase().replace(/[_-]/g, ' ')
  if (normalized.includes('nanny') || normalized.includes('share')) return 'Nanny Share'
  if (normalized.includes('babysit')) return 'Babysitter Swap'
  if (normalized.includes('backup')) return 'Backup Care'
  if (normalized.includes('playdate')) return 'Playdates'
  if (normalized.includes('carpool')) return 'Carpools'

  return item.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// Gender color helper
function getGenderColor(gender: string | null): { bg: string; text: string } {
  switch (gender) {
    case 'boy': return { bg: '#E3F2FD', text: '#1976D2' }
    case 'girl': return { bg: '#FCE4EC', text: '#C2185B' }
    default: return { bg: COLORS.mint, text: COLORS.primary }
  }
}

export default function MemberProfile() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  // const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [member, setMember] = useState<MemberData | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  useEffect(() => {
    if (!id) return
    loadMember()
  }, [id])

  async function loadMember() {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*, kids(*)')
        .eq('id', id)
        .single()

      if (error) throw error

      setMember({
        id: data.id,
        first_name: data.first_name || 'Family',
        location: data.location || '',
        neighborhood: data.neighborhood || '',
        photo_url: data.photo_url,
        bio: data.bio || '',
        tagline: data.tagline || '',
        nanny_situation: data.nanny_situation || '',
        looking_for: data.looking_for || [],
        open_to: data.open_to || [],
        care_timeline: data.care_timeline || '',
        schedule: data.schedule || {},
        schedule_flexible: data.schedule_flexible || false,
        schedule_notes: data.schedule_notes || '',
        kids: data.kids || [],
      })

      // Check if already connected
      if (user) {
        const { data: myMember } = await supabase
          .from('members')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (myMember) {
          // Check for existing connection - wrapped in try/catch to handle 406
          try {
            const { data: connection } = await supabase
              .from('connections')
              .select('status')
              .or(`and(sender_id.eq.${myMember.id},receiver_id.eq.${id}),and(sender_id.eq.${id},receiver_id.eq.${myMember.id})`)
              .maybeSingle()

            if (connection) {
              setConnectionStatus(connection.status)
            }
          } catch (e) {
            // Ignore connection check errors (406 RLS issues)
            console.log('Connection check skipped')
          }
        }
      }
    } catch (err) {
      console.error('Error loading member:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleConnect() {
    if (!user || !member) return

    // LOG SIGNAL
    logAlphaEvent('request_to_chat_click', {
      targetId: member.id,
      urgency: member.care_timeline
    })

    setConnecting(true)
    try {
      const { data: myMember } = await supabase
        .from('members')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!myMember) throw new Error('Your profile not found')

      const { error } = await supabase
        .from('connections')
        .insert({
          sender_id: myMember.id,
          receiver_id: member.id,
          status: 'pending',
        })

      if (error) throw error

      setConnectionStatus('pending')
    } catch (err) {
      console.error('Connection error:', err)
      setToast({ message: 'Could not send connection request. Please try again.', type: 'error' })
    } finally {
      setConnecting(false)
    }
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.mint }}>
          <div style={{ color: COLORS.primary }} className="font-semibold animate-pulse">Loading profile...</div>
        </div>
      </>
    )
  }

  if (!member) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.mint }}>
          <div className="text-center">
            <p style={{ color: COLORS.textMuted }} className="mb-4">Family not found</p>
            <Link to="/build-your-village" style={{ color: COLORS.coral }} className="font-semibold hover:underline">
              ← Back to matches
            </Link>
          </div>
        </div>
      </>
    )
  }

  const situationLabel = NANNY_SITUATION_OPTIONS.find(o => o.id === member.nanny_situation)?.label
  // const timelineLabel = TIMELINE_OPTIONS.find(o => o.id === member.care_timeline)?.label
  const hasSchedule = Object.values(member.schedule).some(slots => slots && slots.length > 0)
  const lookingForLabels = [...new Set(member.looking_for.map(getLookingForLabel))]
  const openToLabels = member.open_to.map(id => OPEN_TO_OPTIONS.find(o => o.id === id)?.label).filter(Boolean)

  return (
    <>
      <Header />
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div className="min-h-screen" style={{ backgroundColor: COLORS.mint }}>
        <div className="max-w-2xl mx-auto px-4 py-6">

          {/* Back Link */}
          <Link
            to="/build-your-village"
            style={{ color: COLORS.textMuted }}
            className="inline-flex items-center gap-1 text-sm mb-4 hover:underline"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to matches
          </Link>

          {/* Main Card */}
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: COLORS.cream, border: `1px solid ${COLORS.mintDark}` }}>

            {/* Header Section */}
            <div className="p-6" style={{ borderBottom: `1px solid ${COLORS.mintDark}` }}>
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0" style={{ backgroundColor: COLORS.mint }}>
                  {member.photo_url ? (
                    <img src={member.photo_url} alt={member.first_name} className="w-full h-full object-cover" />
                  ) : (
                    <span style={{ color: COLORS.primary }} className="text-3xl font-bold">
                      {member.first_name?.charAt(0)}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <h1 style={{ color: COLORS.primary }} className="text-2xl font-bold">
                    {member.first_name}'s Family
                  </h1>
                  <p style={{ color: COLORS.textMuted }} className="mt-1">
                    {member.neighborhood || member.location || 'Location not shared'}
                  </p>

                  {/* Situation Badge */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {/* Urgency Badge */}
                    {member.care_timeline === 'asap' && (
                      <span className="px-3 py-1.5 rounded-full text-sm font-bold bg-[#fff0ed] text-[#e05d44] border border-[#e05d44]/20 flex items-center gap-1">
                        🔥 Looking ASAP
                      </span>
                    )}

                    {situationLabel && (
                      <span
                        className="px-3 py-1.5 rounded-full text-sm font-semibold"
                        style={{
                          backgroundColor: member.nanny_situation === 'have_nanny' ? COLORS.mint : 'rgba(248, 195, 179, 0.2)',
                          color: member.nanny_situation === 'have_nanny' ? COLORS.primary : COLORS.coral,
                        }}
                      >
                        {situationLabel}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Tagline */}
              {member.tagline && (
                <div className="mt-4 p-3 rounded-xl" style={{ backgroundColor: COLORS.mint }}>
                  <p style={{ color: COLORS.primary }} className="text-sm italic">"{member.tagline}"</p>
                </div>
              )}
            </div>

            {/* Schedule Section */}
            <div className="p-6" style={{ borderBottom: `1px solid ${COLORS.mintDark}` }}>
              <h3 style={{ color: COLORS.textMuted }} className="text-xs font-semibold uppercase tracking-wider mb-4">
                Care Schedule Needs
              </h3>

              {hasSchedule ? (
                <>
                  {/* Day headers */}
                  <div className="flex gap-1 mb-2">
                    <div className="w-16"></div>
                    {WEEKDAYS.map(day => (
                      <div key={day.id} className="flex-1 text-center text-xs font-semibold" style={{ color: COLORS.textMuted }}>
                        {day.short}
                      </div>
                    ))}
                  </div>

                  {/* Time slot rows */}
                  {TIME_SLOTS.map(slot => {
                    const hasAnyForSlot = WEEKDAYS.some(d => (member.schedule[d.id] || []).includes(slot.id))
                    if (!hasAnyForSlot) return null

                    return (
                      <div key={slot.id} className="flex gap-1 mb-1">
                        <div className="w-16 text-xs flex items-center" style={{ color: COLORS.textMuted }}>{slot.time}</div>
                        {WEEKDAYS.map(day => {
                          const hasSlot = (member.schedule[day.id] || []).includes(slot.id)
                          return (
                            <div
                              key={`${day.id}-${slot.id}`}
                              className="flex-1 h-8 rounded"
                              style={{
                                backgroundColor: hasSlot ? COLORS.mintDark : '#f5f5f5',
                              }}
                            />
                          )
                        })}
                      </div>
                    )
                  })}

                  {member.schedule_flexible && (
                    <p style={{ color: COLORS.textMuted }} className="text-xs mt-3 italic">
                      Flexible schedule - willing to adjust
                    </p>
                  )}
                </>
              ) : (
                <p style={{ color: COLORS.textMuted }} className="text-sm italic">
                  Schedule not yet set
                </p>
              )}
            </div>

            {/* Kids Section */}
            <div className="p-6" style={{ borderBottom: `1px solid ${COLORS.mintDark}` }}>
              <h3 style={{ color: COLORS.textMuted }} className="text-xs font-semibold uppercase tracking-wider mb-4">
                Kids
              </h3>

              {member.kids.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {member.kids.map(kid => {
                    const name = kid.first_name || kid.name || 'Child'
                    const age = kid.birth_year ? calculateKidAge(kid.birth_month || 1, kid.birth_year) : null
                    const genderColors = getGenderColor(kid.gender)

                    return (
                      <div
                        key={kid.id}
                        className="flex items-center gap-2 px-4 py-2 rounded-full"
                        style={{ backgroundColor: genderColors.bg }}
                      >
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold"
                          style={{ backgroundColor: genderColors.text + '20', color: genderColors.text }}
                        >
                          {name.charAt(0)}
                        </div>
                        <span style={{ color: genderColors.text }} className="font-medium">
                          {name}
                        </span>
                        {age && (
                          <span style={{ color: genderColors.text }} className="text-sm opacity-75">
                            {age}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p style={{ color: COLORS.textMuted }} className="text-sm italic">
                  No kids listed
                </p>
              )}
            </div>

            {/* Looking For Section */}
            {lookingForLabels.length > 0 && (
              <div className="p-6" style={{ borderBottom: `1px solid ${COLORS.mintDark}` }}>
                <h3 style={{ color: COLORS.textMuted }} className="text-xs font-semibold uppercase tracking-wider mb-4">
                  Looking For
                </h3>
                <div className="flex flex-wrap gap-2">
                  {lookingForLabels.map((label, idx) => (
                    <span
                      key={idx}
                      className="px-4 py-2 rounded-full text-sm font-medium"
                      style={{ backgroundColor: COLORS.mint, color: COLORS.primary }}
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Also Open To */}
            {openToLabels.length > 0 && (
              <div className="p-6" style={{ borderBottom: `1px solid ${COLORS.mintDark}` }}>
                <h3 style={{ color: COLORS.textMuted }} className="text-xs font-semibold uppercase tracking-wider mb-4">
                  Also Open To
                </h3>
                <div className="flex flex-wrap gap-2">
                  {openToLabels.map((label, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-full text-sm"
                      style={{ backgroundColor: '#f5f5f5', color: COLORS.textMuted }}
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* About Section */}
            {member.bio && (
              <div className="p-6" style={{ borderBottom: `1px solid ${COLORS.mintDark}` }}>
                <h3 style={{ color: COLORS.textMuted }} className="text-xs font-semibold uppercase tracking-wider mb-4">
                  About
                </h3>
                <p style={{ color: COLORS.primary }} className="text-sm leading-relaxed">
                  {member.bio}
                </p>
              </div>
            )}

            {/* Privacy Note */}
            <div className="p-6" style={{ backgroundColor: `${COLORS.mint}50` }}>
              <div className="flex items-start gap-3">
                <svg style={{ color: COLORS.coral }} className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                <p style={{ color: COLORS.textMuted }} className="text-sm">
                  <strong style={{ color: COLORS.primary }}>Connect to see more:</strong> Kids' names, allergies, pets, and household details are shared once you connect.
                </p>
              </div>
            </div>

            {/* Connect Button */}
            <div className="p-6">
              {connectionStatus === 'pending' ? (
                <div className="w-full py-4 rounded-full text-center" style={{ backgroundColor: COLORS.mint, color: COLORS.primary }}>
                  <span className="font-semibold">Connection request sent</span>
                </div>
              ) : connectionStatus === 'accepted' ? (
                <Link
                  to={`/messages/${member.id}`}
                  className="block w-full py-4 rounded-full text-center font-semibold"
                  style={{ backgroundColor: COLORS.primary, color: 'white' }}
                >
                  Message {member.first_name}
                </Link>
              ) : (
                <button
                  onClick={handleConnect}
                  disabled={connecting || !user}
                  className="w-full py-4 rounded-full font-bold text-lg shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-50"
                  style={{ backgroundColor: COLORS.primary, color: 'white' }}
                >
                  {connecting ? 'Sending Request...' : 'Request to Chat →'}
                </button>
              )}

              {!connectionStatus && (
                <p style={{ color: COLORS.textMuted }} className="text-xs text-center mt-3 opacity-80">
                  Start a conversation to see if it's a fit. No commitment.
                </p>
              )}

              {!user && (
                <p style={{ color: COLORS.textMuted }} className="text-xs text-center mt-3">
                  <Link to="/login" style={{ color: COLORS.coral }} className="font-semibold hover:underline">Log in</Link> to connect
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}