import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Header from '../components/common/Header'
import {
  NANNY_SITUATION_OPTIONS,
  LOOKING_FOR_OPTIONS,
  TIMELINE_OPTIONS,
  calculateKidAge,
  WEEKDAYS,
  TIME_SLOTS,
} from '../lib/Constants'

type Schedule = Record<string, string[]>

interface Kid {
  id: string
  first_name: string
  gender: string | null
  birth_month: number | null
  birth_year: number | null
  allergies: string[]
  notes: string
}

interface ProfileData {
  id: string
  first_name: string
  last_name: string
  location: string
  neighborhood: string
  photo_url: string | null
  bio: string
  tagline: string
  nanny_situation: string
  looking_for: string[]
  care_timeline: string
  schedule: Schedule
  schedule_flexible: boolean
  schedule_notes: string
  pets: string[]
  kids: Kid[]
}

// Gender color helper
function getGenderColor(gender: string | null): { bg: string; text: string } {
  switch (gender) {
    case 'boy':
      return { bg: '#E3F2FD', text: '#1976D2' } // Blue
    case 'girl':
      return { bg: '#FCE4EC', text: '#C2185B' } // Pink
    default:
      return { bg: '#d8f5e5', text: '#1e6b4e' } // Green/gray
  }
}

// Normalize looking_for values
function getLookingForLabel(item: string): string {
  // First try to find in options
  const option = LOOKING_FOR_OPTIONS.find(o => o.id === item)
  if (option) return option.label

  // Handle legacy/mixed formats
  const normalized = item.toLowerCase().replace(/[_-]/g, ' ')
  if (normalized.includes('nanny') && normalized.includes('share')) return 'Nanny Share'
  if (normalized.includes('care') && normalized.includes('share')) return 'Nanny Share'
  if (normalized.includes('babysit')) return 'Babysitter Swap'
  if (normalized.includes('backup')) return 'Backup Care'
  if (normalized.includes('playdate')) return 'Playdates'
  if (normalized.includes('carpool')) return 'Carpools'

  // If already looks like a label, return as-is
  if (item.includes(' ')) return item

  // Convert snake_case to Title Case
  return item.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export default function Profile() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<ProfileData | null>(null)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    loadProfile()
  }, [user])

  async function loadProfile() {
    try {
      const { data: member, error } = await supabase
        .from('members')
        .select('*, kids(*)')
        .eq('user_id', user!.id)
        .single()

      if (error) throw error

      setProfile({
        id: member.id,
        first_name: member.first_name || '',
        last_name: member.last_name || '',
        location: member.location || '',
        neighborhood: member.neighborhood || '',
        photo_url: member.photo_url,
        bio: member.bio || '',
        tagline: member.tagline || '',
        nanny_situation: member.nanny_situation || '',
        looking_for: member.looking_for || [],
        care_timeline: member.care_timeline || '',
        schedule: member.schedule || {},
        schedule_flexible: member.schedule_flexible || false,
        schedule_notes: member.schedule_notes || '',
        pets: member.pets || [],
        kids: member.kids || [],
      })
    } catch (err) {
      console.error('Error loading profile:', err)
    } finally {
      setLoading(false)
    }
  }

  const completeness = profile ? calculateCompleteness(profile) : 0
  const isComplete = completeness >= 100

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#d8f5e5' }}>
          <div style={{ color: '#1e6b4e' }} className="font-semibold animate-pulse">Loading profile...</div>
        </div>
      </>
    )
  }

  if (!profile) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#d8f5e5' }}>
          <p style={{ color: '#4A6163' }}>Profile not found</p>
        </div>
      </>
    )
  }

  const situationLabel = NANNY_SITUATION_OPTIONS.find(o => o.id === profile.nanny_situation)?.label
  const timelineLabel = TIMELINE_OPTIONS.find(o => o.id === profile.care_timeline)?.label
  const hasSchedule = Object.values(profile.schedule).some(slots => slots && slots.length > 0)

  return (
    <>
      <Header />
      {/* MINT BACKGROUND */}
      <div className="min-h-screen" style={{ backgroundColor: '#d8f5e5' }}>
        <div className="max-w-2xl mx-auto px-4 py-6">

          {/* Header with Edit */}
          <div className="flex items-center justify-between mb-5">
            <h1 style={{ color: '#1e6b4e' }} className="text-2xl font-bold">My Profile</h1>
            <Link
              to="/settings"
              style={{ backgroundColor: '#F8C3B3', color: '#1e6b4e' }}
              className="px-4 py-2 font-semibold rounded-full text-sm"
            >
              Edit Profile
            </Link>
          </div>

          {/* Profile Completeness - NOW A CTA */}
          {!isComplete && (
            <Link
              to="/settings?tab=profile"
              className="block mb-5 p-4 rounded-xl"
              style={{ backgroundColor: '#F9E3D2', border: '2px solid #F8C3B3' }}
            >
              <div className="flex items-center justify-between mb-2">
                <span style={{ color: '#1e6b4e' }} className="text-sm font-semibold">Profile completeness</span>
                <span style={{ color: '#F8C3B3' }} className="text-sm font-bold">{completeness}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#fffaf5' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${completeness}%`, backgroundColor: '#F8C3B3' }}
                />
              </div>
              <p style={{ color: '#1e6b4e' }} className="text-xs mt-2 flex items-center gap-1">
                Complete your profile to get 3x more connections
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </p>
            </Link>
          )}

          {/* Main Card */}
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#fffaf5', border: '1px solid #8bd7c7' }}>

            {/* Photo & Basic Info */}
            <div className="p-5 sm:p-6" style={{ borderBottom: '1px solid #8bd7c7' }}>
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0" style={{ backgroundColor: '#d8f5e5' }}>
                  {profile.photo_url ? (
                    <img src={profile.photo_url} alt={profile.first_name} className="w-full h-full object-cover" />
                  ) : (
                    <span style={{ color: '#1e6b4e' }} className="text-3xl font-bold">
                      {profile.first_name?.charAt(0) || '?'}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h2 style={{ color: '#1e6b4e' }} className="text-xl sm:text-2xl font-bold">
                    {profile.first_name}'s Family
                  </h2>
                  <p style={{ color: '#4A6163' }} className="mt-1">
                    {profile.neighborhood || 'Add your neighborhood in settings'}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {situationLabel && (
                      <span
                        className="px-3 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: profile.nanny_situation === 'have_nanny' ? '#d8f5e5' : 'rgba(248, 195, 179, 0.2)',
                          color: profile.nanny_situation === 'have_nanny' ? '#1e6b4e' : '#F8C3B3',
                        }}
                      >
                        {situationLabel}
                      </span>
                    )}
                    {timelineLabel && (
                      <span style={{ backgroundColor: '#d8f5e5', color: '#1e6b4e' }} className="px-3 py-1 rounded-full text-xs font-medium">
                        {timelineLabel}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Tagline */}
              {profile.tagline && (
                <div className="mt-4 p-3 rounded-xl" style={{ backgroundColor: '#d8f5e5' }}>
                  <p style={{ color: '#1e6b4e' }} className="text-sm italic">"{profile.tagline}"</p>
                </div>
              )}
            </div>

            {/* Schedule Section */}
            <div className="p-5 sm:p-6" style={{ borderBottom: '1px solid #8bd7c7' }}>
              <h3 style={{ color: '#4A6163' }} className="text-xs font-semibold uppercase tracking-wider mb-3">
                Care Schedule
              </h3>

              {hasSchedule ? (
                <div className="overflow-x-auto">
                  {/* Visual Grid - Much easier to scan */}
                  <div className="min-w-[300px]">
                    {/* Day headers */}
                    <div className="flex">
                      <div className="w-14 flex-shrink-0" />
                      {WEEKDAYS.map(day => (
                        <div key={day.id} className="flex-1 text-center text-xs font-semibold py-2" style={{ color: '#1e6b4e' }}>
                          {day.short}
                        </div>
                      ))}
                    </div>

                    {/* Time rows */}
                    {TIME_SLOTS.map(slot => {
                      const hasAnySlot = WEEKDAYS.some(d => (profile.schedule[d.id] || []).includes(slot.id))
                      if (!hasAnySlot) return null

                      return (
                        <div key={slot.id} className="flex items-center">
                          <div className="w-14 flex-shrink-0 text-xs py-1" style={{ color: '#4A6163' }}>
                            {slot.time}
                          </div>
                          {WEEKDAYS.map(day => {
                            const isSelected = (profile.schedule[day.id] || []).includes(slot.id)
                            return (
                              <div key={`${day.id}-${slot.id}`} className="flex-1 flex justify-center py-1">
                                <div
                                  className="w-6 h-6 rounded-md flex items-center justify-center"
                                  style={{
                                    backgroundColor: isSelected ? '#8bd7c7' : '#f5f5f5',
                                  }}
                                >
                                  {isSelected && (
                                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>

                  {profile.schedule_flexible && (
                    <p style={{ color: '#4A6163' }} className="text-xs mt-3 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Flexible schedule
                    </p>
                  )}
                </div>
              ) : (
                <Link
                  to="/settings?tab=schedule"
                  className="block text-center py-6 rounded-xl"
                  style={{ border: '2px dashed #8bd7c7', color: '#4A6163' }}
                >
                  <svg style={{ color: '#8bd7c7' }} className="w-8 h-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Add your schedule
                </Link>
              )}
            </div>

            {/* Kids Section - WITH GENDER COLORS */}
            <div className="p-5 sm:p-6" style={{ borderBottom: '1px solid #8bd7c7' }}>
              <h3 style={{ color: '#4A6163' }} className="text-xs font-semibold uppercase tracking-wider mb-3">
                Kids
              </h3>

              {profile.kids.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {profile.kids.map(kid => {
                    const genderColors = getGenderColor(kid.gender)
                    const age = kid.birth_year ? calculateKidAge(kid.birth_month || 1, kid.birth_year) : null
                    const genderLabel = kid.gender === 'boy' ? 'Boy' : kid.gender === 'girl' ? 'Girl' : 'Child'

                    return (
                      <div
                        key={kid.id}
                        className="flex items-center gap-2 px-4 py-2 rounded-full"
                        style={{ backgroundColor: genderColors.bg }}
                      >
                        {/* Gender icon */}
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: genderColors.text + '20' }}
                        >
                          {kid.gender === 'boy' ? (
                            <svg className="w-3.5 h-3.5" style={{ color: genderColors.text }} fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9H15V22H13V16H11V22H9V9H3V7H21V9Z" />
                            </svg>
                          ) : kid.gender === 'girl' ? (
                            <svg className="w-3.5 h-3.5" style={{ color: genderColors.text }} fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM15 9H9V14H7V22H9V17H11V22H13V17H15V22H17V14H15V9Z" />
                            </svg>
                          ) : (
                            <svg className="w-3.5 h-3.5" style={{ color: genderColors.text }} fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9H15V22H13V16H11V22H9V9H3V7H21V9Z" />
                            </svg>
                          )}
                        </div>
                        <span style={{ color: genderColors.text }} className="text-sm font-semibold">
                          {genderLabel}
                        </span>
                        {age && (
                          <span style={{ color: genderColors.text }} className="text-sm font-medium">
                            {age}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <Link
                  to="/settings?tab=kids"
                  className="block text-center py-4 rounded-xl text-sm"
                  style={{ border: '2px dashed #8bd7c7', color: '#4A6163' }}
                >
                  Add your children
                </Link>
              )}
            </div>

            {/* Looking For - FIXED LABEL MAPPING */}
            {profile.looking_for.length > 0 && (
              <div className="p-5 sm:p-6" style={{ borderBottom: '1px solid #8bd7c7' }}>
                <h3 style={{ color: '#4A6163' }} className="text-xs font-semibold uppercase tracking-wider mb-3">
                  Looking For
                </h3>
                <div className="flex flex-wrap gap-2">
                  {/* Deduplicate and normalize labels */}
                  {[...new Set(profile.looking_for.map(getLookingForLabel))].map((label, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-full text-sm"
                      style={{ backgroundColor: '#d8f5e5', color: '#1e6b4e' }}
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Bio */}
            {profile.bio && (
              <div className="p-5 sm:p-6">
                <h3 style={{ color: '#4A6163' }} className="text-xs font-semibold uppercase tracking-wider mb-3">
                  About Us
                </h3>
                <p style={{ color: '#1e6b4e' }} className="text-sm leading-relaxed">
                  {profile.bio}
                </p>
              </div>
            )}
          </div>

          {/* Privacy Note */}
          <p style={{ color: '#4A6163' }} className="text-xs text-center mt-6 px-4">
            Your last name and exact location are only shared after you connect with another family.
          </p>
        </div>
      </div>
    </>
  )
}

function calculateCompleteness(profile: ProfileData): number {
  let score = 0
  const weights = {
    first_name: 10,
    location: 10,
    tagline: 15,
    nanny_situation: 10,
    looking_for: 10,
    care_timeline: 5,
    schedule: 20,
    kids: 15,
    bio: 5,
  }

  if (profile.first_name) score += weights.first_name
  if (profile.location) score += weights.location
  if (profile.tagline) score += weights.tagline
  if (profile.nanny_situation) score += weights.nanny_situation
  if (profile.looking_for.length > 0) score += weights.looking_for
  if (profile.care_timeline) score += weights.care_timeline
  if (Object.values(profile.schedule).some(s => s && s.length > 0)) score += weights.schedule
  if (profile.kids.length > 0) score += weights.kids
  if (profile.bio) score += weights.bio

  return score
}