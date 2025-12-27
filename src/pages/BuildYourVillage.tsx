import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Header from '../components/common/Header'
import {
  WEEKDAYS,

  calculateKidAge,
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

interface FamilyMatch {
  id: string
  first_name: string
  location: string
  neighborhood: string
  photo_url: string | null
  tagline: string
  nanny_situation: string
  looking_for: string[]
  care_timeline: string
  schedule: Schedule
  kids: Kid[]
  invited_by: string | null
  // Computed
  compatibility: number
  matchReasons: MatchReason[]
  overlapDays: string[]
  overlapSlots: { day: string; slots: string[] }[]
  mutualConnections: string[]
  kidAgeMatch: boolean
  distanceMiles: number | null
}

interface MatchReason {
  icon: 'schedule' | 'location' | 'kids' | 'nanny' | 'connections' | 'ready'
  text: string
  highlight?: boolean
}

interface UserProfile {
  id: string
  schedule: Schedule
  location: string
  neighborhood: string
  nanny_situation: string
  kids: Kid[]
  invited_by: string | null
}

// Colors
const COLORS = {
  primary: '#1e6b4e',
  coral: '#F8C3B3',
  mint: '#d8f5e5',
  mintDark: '#8bd7c7',
  cream: '#fffaf5',
  textMuted: '#4A6163',
}

// Get situation label
function getSituationLabel(situation: string): string {
  switch (situation) {
    case 'have_nanny': return 'Has nanny to share'
    case 'seeking_share': return 'Looking for a share'
    case 'finding_together': return 'Finding nanny together'
    default: return 'Exploring options'
  }
}

// Calculate schedule overlap
function calculateOverlap(userSchedule: Schedule, otherSchedule: Schedule): {
  days: string[]
  slots: { day: string; slots: string[] }[]
  percentage: number
} {
  const overlapDays: string[] = []
  const overlapSlots: { day: string; slots: string[] }[] = []
  let totalUserSlots = 0
  let matchingSlots = 0

  WEEKDAYS.forEach(day => {
    const userSlots = userSchedule[day.id] || []
    const otherSlots = otherSchedule[day.id] || []
    totalUserSlots += userSlots.length

    const matching = userSlots.filter(slot => otherSlots.includes(slot))
    if (matching.length > 0) {
      overlapDays.push(day.id)
      overlapSlots.push({ day: day.id, slots: matching })
      matchingSlots += matching.length
    }
  })

  const percentage = totalUserSlots > 0 ? Math.round((matchingSlots / totalUserSlots) * 100) : 0
  return { days: overlapDays, slots: overlapSlots, percentage }
}

// Check if kids are in compatible age range (within 2 years)
function checkKidAgeCompatibility(userKids: Kid[], otherKids: Kid[]): boolean {
  if (userKids.length === 0 || otherKids.length === 0) return false

  const userAges = userKids
    .filter(k => k.birth_year)
    .map(k => {
      const age = calculateKidAge(k.birth_month || 1, k.birth_year!)
      const match = age.match(/(\d+)/)
      return match ? parseInt(match[1]) : 0
    })

  const otherAges = otherKids
    .filter(k => k.birth_year)
    .map(k => {
      const age = calculateKidAge(k.birth_month || 1, k.birth_year!)
      const match = age.match(/(\d+)/)
      return match ? parseInt(match[1]) : 0
    })

  // Check if any kids are within 2 years of each other
  for (const userAge of userAges) {
    for (const otherAge of otherAges) {
      if (Math.abs(userAge - otherAge) <= 2) return true
    }
  }
  return false
}

// Calculate match reasons
function getMatchReasons(user: UserProfile, family: FamilyMatch): MatchReason[] {
  const reasons: MatchReason[] = []

  // Schedule overlap
  if (family.overlapDays.length > 0) {
    const dayNames = family.overlapDays.map(d => WEEKDAYS.find(w => w.id === d)?.short || d).join(', ')
    reasons.push({
      icon: 'schedule',
      text: `Schedule match on ${dayNames}`,
      highlight: true,
    })
  }

  // Same neighborhood
  if (user.neighborhood && family.neighborhood &&
    user.neighborhood.toLowerCase() === family.neighborhood.toLowerCase()) {
    reasons.push({
      icon: 'location',
      text: 'Same neighborhood',
      highlight: true,
    })
  } else if (user.location && family.location &&
    user.location.substring(0, 3) === family.location.substring(0, 3)) {
    reasons.push({
      icon: 'location',
      text: 'Nearby location',
    })
  }

  // Kids age compatibility
  if (family.kidAgeMatch) {
    reasons.push({
      icon: 'kids',
      text: 'Kids similar ages',
      highlight: true,
    })
  }

  // Complementary nanny situation
  if ((user.nanny_situation === 'have_nanny' && family.nanny_situation === 'seeking_share') ||
    (user.nanny_situation === 'seeking_share' && family.nanny_situation === 'have_nanny')) {
    reasons.push({
      icon: 'nanny',
      text: family.nanny_situation === 'have_nanny' ? 'They have a nanny to share!' : 'Looking to join your share',
      highlight: true,
    })
  } else if (user.nanny_situation === 'finding_together' && family.nanny_situation === 'finding_together') {
    reasons.push({
      icon: 'nanny',
      text: 'Both looking to find a nanny together',
    })
  }

  // Mutual connections
  if (family.mutualConnections.length > 0) {
    reasons.push({
      icon: 'connections',
      text: `${family.mutualConnections.length} mutual connection${family.mutualConnections.length > 1 ? 's' : ''}`,
      highlight: true,
    })
  }

  // Ready now
  if (family.care_timeline === 'asap') {
    reasons.push({
      icon: 'ready',
      text: 'Ready to start now',
    })
  }

  return reasons
}

// Calculate compatibility score
function calculateCompatibility(reasons: MatchReason[], overlapPercentage: number): number {
  let score = 30 // Base score

  reasons.forEach(r => {
    if (r.highlight) score += 15
    else score += 8
  })

  score += Math.round(overlapPercentage * 0.3)

  return Math.min(score, 99)
}

// Icon components
function MatchIcon({ type }: { type: MatchReason['icon'] }) {
  switch (type) {
    case 'schedule':
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    case 'location':
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    case 'kids':
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    case 'nanny':
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      )
    case 'connections':
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      )
    case 'ready':
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
  }
}

export default function BuildYourVillage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [perfectTimelineMatches, setPerfectTimelineMatches] = useState<FamilyMatch[]>([])
  const [highCompatMatches, setHighCompatMatches] = useState<FamilyMatch[]>([])
  const [otherFamilies, setOtherFamilies] = useState<FamilyMatch[]>([])
  const [travelMatches, setTravelMatches] = useState<FamilyMatch[]>([])

  useEffect(() => {
    if (user) loadMatches()
  }, [user])

  async function loadMatches() {
    try {
      // Get current user's profile
      const { data: myProfile } = await supabase
        .from('members')
        .select('*, kids(*)')
        .eq('user_id', user!.id)
        .single()

      if (!myProfile) return

      const profile: UserProfile = {
        id: myProfile.id,
        schedule: myProfile.schedule || {},
        location: myProfile.location || '',
        neighborhood: myProfile.neighborhood || '',
        nanny_situation: myProfile.nanny_situation || '',
        kids: myProfile.kids || [],
        invited_by: myProfile.invited_by,
      }
      setUserProfile(profile)

      // Get all other members
      const { data: allMembers } = await supabase
        .from('members')
        .select('*, kids(*)')
        .neq('id', myProfile.id)

      if (!allMembers) return

      // Process matches
      const processed: FamilyMatch[] = allMembers.map(member => {
        const overlap = calculateOverlap(profile.schedule, member.schedule || {})
        const kidAgeMatch = checkKidAgeCompatibility(profile.kids, member.kids || [])

        // Calculate mutual connections (shared invited_by or same referrer)
        const mutualConnections: string[] = []
        if (profile.invited_by && member.invited_by === profile.invited_by) {
          mutualConnections.push('Same referrer')
        }

        const match: FamilyMatch = {
          id: member.id,
          first_name: member.first_name || 'Family',
          location: member.location || '',
          neighborhood: member.neighborhood || '',
          photo_url: member.photo_url,
          tagline: member.tagline || '',
          nanny_situation: member.nanny_situation || '',
          looking_for: member.looking_for || [],
          care_timeline: member.care_timeline || '',
          schedule: member.schedule || {},
          kids: member.kids || [],
          invited_by: member.invited_by,
          overlapDays: overlap.days,
          overlapSlots: overlap.slots,
          mutualConnections,
          kidAgeMatch,
          distanceMiles: null,
          compatibility: 0,
          matchReasons: [],
        }

        match.matchReasons = getMatchReasons(profile, match)
        match.compatibility = calculateCompatibility(match.matchReasons, overlap.percentage)

        return match
      })

      // Sort by compatibility descending
      processed.sort((a, b) => b.compatibility - a.compatibility)

      // --- SMART STACKS LOGIC ---

      const sameArea = processed.filter(m =>
        m.location.substring(0, 3) === profile.location.substring(0, 3) ||
        m.location.substring(0, 5) === profile.location.substring(0, 5) ||
        !m.location
      )

      const differentArea = processed.filter(m =>
        m.location &&
        m.location.substring(0, 3) !== profile.location.substring(0, 3) &&
        m.location.substring(0, 5) !== profile.location.substring(0, 5)
      )

      // 1. Perfect Timeline Matches
      // Criteria: Matches user's timeline preference precisely, or is ASAP if user is ASAP.
      // If user hasn't set timeline, maybe prioritize 'asap' people?
      const userTimeline = (myProfile.care_timeline || '').toLowerCase()

      const timelineMatches = sameArea.filter(m => {
        const matchTimeline = (m.care_timeline || '').toLowerCase()
        if (!userTimeline) return matchTimeline === 'asap' // Default to showing urgent matches
        return matchTimeline === userTimeline
      })

      // 2. High Compatibility (excluding those already in Timeline)
      // Criteria: Compatibility > 60 OR Same Neighborhood OR Kid Match
      const highCompat = sameArea.filter(m => {
        if (timelineMatches.includes(m)) return false // Already in stack 1
        return m.compatibility >= 60 ||
          (m.neighborhood && m.neighborhood === profile.neighborhood) ||
          m.kidAgeMatch
      })

      // 3. Others (The rest of same area)
      const others = sameArea.filter(m =>
        !timelineMatches.includes(m) &&
        !highCompat.includes(m)
      )

      setPerfectTimelineMatches(timelineMatches)
      setHighCompatMatches(highCompat)
      setOtherFamilies(others)
      setTravelMatches(differentArea.slice(0, 5))

    } catch (err) {
      console.error('Error loading matches:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.mint }}>
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3" style={{ borderColor: COLORS.primary, borderTopColor: 'transparent' }} />
            <p style={{ color: COLORS.primary }} className="font-medium">Finding your matches...</p>
          </div>
        </div>
      </>
    )
  }

  const hasSchedule = userProfile && Object.values(userProfile.schedule).some(s => s && s.length > 0)

  return (
    <>
      <Header />
      <div className="min-h-screen" style={{ backgroundColor: COLORS.mint }}>
        {/* Hero Banner */}
        <div style={{ backgroundColor: COLORS.primary }} className="py-8 px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Build Your Village
            </h1>
            <p className="text-white/80">
              Smart Stacks™ help you find the right families, faster.
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-6">

          {/* No Schedule Warning */}
          {!hasSchedule && (
            <div className="mb-6 p-4 rounded-xl" style={{ backgroundColor: COLORS.cream, border: `2px solid ${COLORS.coral}` }}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${COLORS.coral}20` }}>
                  <svg style={{ color: COLORS.coral }} className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 style={{ color: COLORS.primary }} className="font-bold">Set your schedule to find better matches</h3>
                  <p style={{ color: COLORS.textMuted }} className="text-sm mt-1">
                    We'll show you families who need care on the same days and times as you.
                  </p>
                  <Link
                    to="/settings?tab=schedule"
                    className="inline-block mt-3 px-4 py-2 rounded-full text-sm font-semibold"
                    style={{ backgroundColor: COLORS.coral, color: COLORS.primary }}
                  >
                    Set Your Schedule
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* STACK 1: PERFECT TIMELINE */}
          {perfectTimelineMatches.length > 0 && (
            <section className="mb-8">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.coral }} />
                <h2 style={{ color: COLORS.primary }} className="text-xl font-bold">
                  Perfect Timeline Matches
                </h2>
              </div>
              <p className="text-sm text-opeari-text-secondary mb-4 ml-5">
                Families whose care needs align with yours perfectly.
              </p>

              <div className="space-y-4">
                {perfectTimelineMatches.map(family => (
                  <MatchCard key={family.id} family={family} userSchedule={userProfile?.schedule || {}} />
                ))}
              </div>
            </section>
          )}

          {/* STACK 2: HIGH COMPATIBILITY */}
          {highCompatMatches.length > 0 && (
            <section className="mb-8">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.mintDark }} />
                <h2 style={{ color: COLORS.primary }} className="text-xl font-bold">
                  High Compatibility
                </h2>
              </div>
              <p className="text-sm text-text-secondary mb-4 ml-5">
                Neighbors with similar kids, shared connections, or great overlap.
              </p>

              <div className="space-y-4">
                {highCompatMatches.map(family => (
                  <MatchCard key={family.id} family={family} userSchedule={userProfile?.schedule || {}} />
                ))}
              </div>
            </section>
          )}

          {/* STACK 3: EXPLORE (Others) */}
          {otherFamilies.length > 0 && (
            <section className="mb-8">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-gray-300" />
                <h2 style={{ color: COLORS.primary }} className="text-xl font-bold">
                  Explore the Village
                </h2>
              </div>
              <p className="text-sm text-text-secondary mb-4 ml-5">
                More families in your area.
              </p>

              <div className="space-y-4">
                {otherFamilies.map(family => (
                  <MatchCard key={family.id} family={family} userSchedule={userProfile?.schedule || {}} compact />
                ))}
              </div>
            </section>
          )}

          {/* No matches */}
          {perfectTimelineMatches.length === 0 && highCompatMatches.length === 0 && otherFamilies.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: COLORS.cream }}>
                <svg style={{ color: COLORS.textMuted }} className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </div>
              <h3 style={{ color: COLORS.primary }} className="font-bold text-lg mb-2">We're still growing in your area</h3>
              <p style={{ color: COLORS.textMuted }} className="text-sm mb-4 max-w-sm mx-auto">
                We couldn't find perfect matches yet. Try adjusting your schedule or invite a friend to start your local village.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
                <Link
                  to="/invite"
                  className="inline-block px-6 py-3 rounded-full font-semibold shadow-sm hover:shadow-md transition-all"
                  style={{ backgroundColor: COLORS.primary, color: 'white' }}
                >
                  Invite Friends
                </Link>
                <Link
                  to="/settings?tab=schedule"
                  className="inline-block px-6 py-3 rounded-full font-semibold border-2 hover:bg-white/50 transition-all"
                  style={{ borderColor: COLORS.primary, color: COLORS.primary }}
                >
                  Update Schedule
                </Link>
              </div>
            </div>
          )}

          {/* TRAVEL CONNECTIONS */}
          {travelMatches.length > 0 && (
            <section className="mt-8 pt-6" style={{ borderTop: `1px solid ${COLORS.mintDark}` }}>
              <div className="flex items-center gap-2 mb-4">
                <svg style={{ color: COLORS.textMuted }} className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
                <h2 style={{ color: COLORS.primary }} className="text-lg font-bold">
                  Travel Connections
                </h2>
              </div>
              <p style={{ color: COLORS.textMuted }} className="text-sm mb-4">
                Families in other areas you might visit
              </p>

              <div className="flex gap-3 overflow-x-auto pb-2">
                {travelMatches.map(family => (
                  <Link
                    key={family.id}
                    to={`/member/${family.id}`}
                    className="flex-shrink-0 p-4 rounded-xl"
                    style={{ backgroundColor: COLORS.cream, border: `1px solid ${COLORS.mintDark}`, minWidth: '200px' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.mint }}>
                        <span style={{ color: COLORS.primary }} className="font-bold">
                          {family.first_name?.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p style={{ color: COLORS.primary }} className="font-semibold text-sm">
                          {family.first_name}'s Family
                        </p>
                        <p style={{ color: COLORS.textMuted }} className="text-xs">
                          {family.neighborhood || family.location}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  )
}

// MATCH CARD Component
function MatchCard({ family, compact = false }: {
  family: FamilyMatch
  userSchedule: Schedule
  compact?: boolean
}) {
  const kidCount = family.kids.length
  const kidAges = family.kids
    .filter(k => k.birth_year)
    .map(k => calculateKidAge(k.birth_month || 1, k.birth_year!))

  const hasHighlightReasons = family.matchReasons.some(r => r.highlight)

  return (
    <Link
      to={`/member/${family.id}`}
      className="block rounded-2xl overflow-hidden transition-all hover:shadow-lg"
      style={{
        backgroundColor: COLORS.cream,
        border: hasHighlightReasons ? `2px solid ${COLORS.coral}` : `1px solid ${COLORS.mintDark}`,
      }}
    >
      {/* Why This Works Banner - only show if highlighted reasons */}
      {hasHighlightReasons && !compact && (
        <div className="px-5 py-3" style={{ backgroundColor: `${COLORS.coral}15`, borderBottom: `1px solid ${COLORS.coral}30` }}>
          <p style={{ color: COLORS.primary }} className="text-xs font-bold uppercase tracking-wider mb-2">
            Why this could work
          </p>
          <div className="flex flex-wrap gap-2">
            {family.matchReasons.filter(r => r.highlight).map((reason, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                style={{ backgroundColor: COLORS.coral, color: 'white' }}
              >
                <MatchIcon type={reason.icon} />
                <span>{reason.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-5">
        <div className="flex gap-4">
          {/* Avatar */}
          <div className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ backgroundColor: COLORS.mint }}>
            {family.photo_url ? (
              <img src={family.photo_url} alt={family.first_name} className="w-full h-full object-cover" />
            ) : (
              <span style={{ color: COLORS.primary }} className="text-xl font-bold">
                {family.first_name?.charAt(0)}
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 style={{ color: COLORS.primary }} className="font-bold text-lg">
                  {family.first_name}'s Family
                </h3>
                <p style={{ color: COLORS.textMuted }} className="text-sm">
                  {family.neighborhood || family.location || 'Location not set'}
                </p>
              </div>

              {/* Compatibility Score */}
              <div
                className="px-3 py-1 rounded-full text-sm font-bold flex-shrink-0"
                style={{
                  backgroundColor: family.compatibility >= 70 ? COLORS.primary : family.compatibility >= 50 ? COLORS.mint : COLORS.cream,
                  color: family.compatibility >= 70 ? 'white' : COLORS.primary,
                  border: family.compatibility < 70 ? `1px solid ${COLORS.mintDark}` : 'none',
                }}
              >
                {family.compatibility}%
              </div>
            </div>

            {/* Kids & Situation */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {/* Situation badge */}
              <span
                className="px-2.5 py-1 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: family.nanny_situation === 'have_nanny' ? COLORS.mint : `${COLORS.coral}20`,
                  color: family.nanny_situation === 'have_nanny' ? COLORS.primary : COLORS.coral,
                }}
              >
                {getSituationLabel(family.nanny_situation)}
              </span>

              {/* Kids info */}
              {kidCount > 0 && (
                <span style={{ color: COLORS.textMuted }} className="text-xs">
                  {kidCount} kid{kidCount !== 1 ? 's' : ''} {kidAges.length > 0 && `(${kidAges.join(', ')})`}
                </span>
              )}
            </div>

            {/* All match reasons (non-highlighted shown smaller) */}
            {!compact && family.matchReasons.filter(r => !r.highlight).length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {family.matchReasons.filter(r => !r.highlight).map((reason, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1 px-2 py-0.5 rounded text-xs"
                    style={{ backgroundColor: COLORS.mint, color: COLORS.textMuted }}
                  >
                    <MatchIcon type={reason.icon} />
                    <span>{reason.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Schedule Overlap Visual - Only if they have schedule */}
        {!compact && family.overlapDays.length > 0 && (
          <div className="mt-4 p-3 rounded-xl" style={{ backgroundColor: COLORS.mint }}>
            <div className="flex items-center justify-between mb-2">
              <span style={{ color: COLORS.textMuted }} className="text-xs font-medium">Schedule overlap</span>
            </div>
            <div className="flex gap-1">
              {WEEKDAYS.map(day => {
                const isOverlap = family.overlapDays.includes(day.id)
                const hasSlots = (family.schedule[day.id] || []).length > 0

                return (
                  <div
                    key={day.id}
                    className="flex-1 text-center py-2 rounded-lg text-xs font-semibold"
                    style={{
                      backgroundColor: isOverlap ? COLORS.coral : hasSlots ? COLORS.mintDark : 'white',
                      color: isOverlap ? 'white' : hasSlots ? COLORS.primary : COLORS.textMuted,
                    }}
                  >
                    {day.letter}
                    {isOverlap && (
                      <svg className="w-3 h-3 mx-auto mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Tagline */}
        {!compact && family.tagline && (
          <p
            className="text-sm italic mt-3 pt-3"
            style={{
              color: COLORS.textMuted,
              borderTop: `1px solid ${COLORS.mintDark}`,
            }}
          >
            "{family.tagline}"
          </p>
        )}

        {/* CTA */}
        <div className="mt-4 flex items-center justify-end">
          <span style={{ color: COLORS.coral }} className="text-sm font-semibold flex items-center gap-1">
            View Profile
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  )
}