import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Header from '../components/common/Header'
import Toast from '../components/ui/Toast'
import { logAlphaEvent } from '../lib/analytics'
import {
  NANNY_SITUATION_OPTIONS,
  calculateKidAge,
  WEEKDAYS,
  TIME_SLOTS,
} from '../lib/Constants'

type Schedule = Record<string, string[]>

// Prod Schema: No JSONB for kids. 
// We use placeholder kids or construct from kids_ages when connected.
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
  neighborhood: string
  zip_code: string
  bio: string

  // Aliases from Prod Schema
  situation: string
  timeline: string

  // Safe Fields
  num_kids: number
  children_age_groups: string[]
  care_types: string[]
  availability_days: string[] // needed for preview schedule
  availability_blocks: string[]
  schedule_flexible: boolean
  languages: string[]

  // Detailed / Connected Only
  schedule: Schedule
  schedule_notes: string
  kids: Kid[] // Only present if connected, otherwise empty array
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
      // 1. Fetch Preview Data (Safe View)
      // Only columns that exist in members_preview
      const { data: previewData, error: previewError } = await supabase
        .from('members_preview')
        .select(`
          id, first_name, role, neighborhood, zip_code, bio,
          num_kids, children_age_groups, care_types,
          availability_days, availability_blocks,
          schedule_flexible, languages, situation, timeline
        `)
        .eq('id', id)
        .single()

      if (previewError) throw previewError

      // Initialize with Preview Data
      let fullMember: MemberData = {
        id: previewData.id,
        first_name: previewData.first_name || 'Family',
        neighborhood: previewData.neighborhood || '',
        zip_code: previewData.zip_code || '',
        bio: previewData.bio || '',

        situation: previewData.situation || '',
        timeline: previewData.timeline || '',

        num_kids: previewData.num_kids || 0,
        children_age_groups: previewData.children_age_groups || [],
        care_types: previewData.care_types || [],
        availability_days: previewData.availability_days || [],
        availability_blocks: previewData.availability_blocks || [],
        schedule_flexible: previewData.schedule_flexible || false,
        languages: previewData.languages || [],

        // Safe / Preview Schedule Defaults (From Availability Days)
        // detailed schedule is hidden in preview
        schedule: previewData.availability_days
          ? previewData.availability_days.reduce((acc: any, day: string) => ({ ...acc, [day]: ['partial'] }), {})
          : {},
        schedule_notes: '',

        kids: [], // No kids details in preview
      }

      setMember(fullMember)

      // 2. Check Connection & Fetch Restricted Data
      if (user) {
        // Since members.id == auth.uid(), myMemberId IS user.id
        const myMemberId = user.id;

        // Check Connection
        let status = null
        try {
          const { data: connection } = await supabase
            .from('connections')
            .select('status')
            // Correct requester/requestee logic
            .or(`and(requester_id.eq.${myMemberId},requestee_id.eq.${id}),and(requester_id.eq.${id},requestee_id.eq.${myMemberId})`)
            .maybeSingle()

          if (connection) {
            status = connection.status
            setConnectionStatus(status)
          }
        } catch (e) { console.log('Connection check skipped', e) }

        // Gating Logic: Accepted Connection OR Self
        // Self Check: myMemberId === profileId (id from params)
        const isSelf = myMemberId === id;
        const isConnected = status === 'accepted';

        if (isConnected || isSelf) {
          // Fetch Sensitive Data from members_connected
          const { data: connectedData } = await supabase
            .from('members_connected')
            .select('schedule, schedule_notes, kids_ages') // specific sensitive fields
            .eq('id', id)
            .single()

          if (connectedData) {
            // Construct Kids from Ages
            let constructedKids: Kid[] = [];
            if (connectedData.kids_ages && Array.isArray(connectedData.kids_ages)) {
              constructedKids = connectedData.kids_ages.map((year: number, idx: number) => ({
                id: `k-${idx}`,
                birth_year: year,
                birth_month: null,
                gender: null
              }));
            }

            setMember(prev => ({
              ...prev!,
              schedule: connectedData.schedule || {},
              schedule_notes: connectedData.schedule_notes || '',
              kids: constructedKids
            }))
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

    logAlphaEvent('request_to_chat_click', {
      targetId: member.id,
      urgency: member.timeline
    })

    setConnecting(true)
    try {
      // Insert Connection
      // my ID is user.id
      const { error } = await supabase
        .from('connections')
        .insert({
          requester_id: user.id,
          requestee_id: member.id,
          status: 'pending',
        })

      if (error) throw error

      setConnectionStatus('pending')
      setToast({ message: 'Request sent!', type: 'success' })
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

  const situationLabel = NANNY_SITUATION_OPTIONS.find(o => o.id === member.situation)?.label

  return (
    <>
      <Header />
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          duration={3000}
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
                {/* Avatar (Placeholder) */}
                <div className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0" style={{ backgroundColor: COLORS.mint }}>
                  <span style={{ color: COLORS.primary }} className="text-3xl font-bold">
                    {member.first_name?.charAt(0)}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1">
                  <h1 style={{ color: COLORS.primary }} className="text-2xl font-bold">
                    {member.first_name}'s Family
                  </h1>
                  <p style={{ color: COLORS.textMuted }} className="mt-1">
                    {member.neighborhood || member.zip_code || 'Location not shared'}
                  </p>

                  {/* Situation Badge */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {/* Urgency Badge */}
                    {member.timeline === 'asap' && (
                      <span className="px-3 py-1.5 rounded-full text-sm font-bold bg-[#fff0ed] text-[#e05d44] border border-[#e05d44]/20 flex items-center gap-1">
                        Looking ASAP
                      </span>
                    )}

                    {situationLabel && (
                      <span
                        className="px-3 py-1.5 rounded-full text-sm font-semibold"
                        style={{
                          backgroundColor: member.situation === 'have_nanny' ? COLORS.mint : 'rgba(248, 195, 179, 0.2)',
                          color: member.situation === 'have_nanny' ? COLORS.primary : COLORS.coral,
                        }}
                      >
                        {situationLabel}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Schedule Section */}
            <div className="p-6" style={{ borderBottom: `1px solid ${COLORS.mintDark}` }}>
              <h3 style={{ color: COLORS.textMuted }} className="text-xs font-semibold uppercase tracking-wider mb-4">
                Care Schedule Needs
              </h3>

              {member.availability_days.length > 0 ? (
                <>
                  {/* Public View: Day Summary Only */}
                  {connectionStatus !== 'accepted' && user?.id !== member.id ? (
                    <div className="flex gap-2 mb-2">
                      {/* This effectively shows a "Preview" schedule based on tags */}
                      {WEEKDAYS.map(day => {
                        const hasSolts = member.availability_days.includes(day.id);
                        return (
                          <div
                            key={day.id}
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${hasSolts ? '' : 'opacity-40'}`}
                            style={{
                              backgroundColor: hasSolts ? COLORS.mint : '#f5f5f5',
                              color: hasSolts ? COLORS.primary : COLORS.textMuted
                            }}
                          >
                            {day.letter}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    /* Connected View: Detailed Grid */
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
                    </>
                  )}

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

              {(member.num_kids > 0 || member.kids.length > 0) ? (
                /* Gating Logic */
                connectionStatus !== 'accepted' && user?.id !== member.id ? (
                  /* Public / Private View (Safe) */
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span style={{ color: COLORS.text }} className="font-semibold text-lg">
                        {member.num_kids} {member.num_kids === 1 ? 'Child' : 'Children'}
                      </span>
                    </div>
                    {member.children_age_groups && member.children_age_groups.length > 0 && (
                      <span style={{ color: COLORS.textMuted }} className="text-sm">
                        Age Groups: {member.children_age_groups.join(', ')}
                      </span>
                    )}
                  </div>
                ) : (
                  /* Connected View (Detailed) */
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
                )
              ) : (
                <p style={{ color: COLORS.textMuted }} className="text-sm italic">
                  No kids listed
                </p>
              )}
            </div>

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
                  <strong style={{ color: COLORS.primary }}>Connect to see more:</strong> Kids' names, specific schedules, and household details are shared once you connect.
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
                  {connecting ? 'Sending Request...' : 'Request to Chat'}
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