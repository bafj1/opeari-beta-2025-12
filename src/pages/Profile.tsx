import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
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
  children_age_groups: string[]
  kids: Kid[]
  languages: string[]
  special_availability: string[]
}

// Gender color helper - Converted to Tailwind classes
function getGenderClasses(gender: string | null): string {
  switch (gender) {
    case 'boy':
      return 'bg-blue-50 text-blue-700'
    case 'girl':
      return 'bg-pink-50 text-pink-700'
    default:
      return 'bg-opeari-green/10 text-opeari-heading'
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

// Format age group tags
function formatAgeGroup(tag: string): string {
  return tag
    .replace(/_/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
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
        .eq('id', user!.id)
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
        children_age_groups: member.children_age_groups || [],
        kids: member.kids || [],
        languages: member.languages || [],
        special_availability: member.special_availability || [],
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
      <div className="min-h-screen flex items-center justify-center bg-opeari-bg">
        <div className="w-10 h-10 border-4 border-opeari-peach border-t-opeari-green rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-opeari-bg">
        <p className="text-gray-500 font-bold">Profile not found</p>
      </div>
    )
  }

  const situationLabel = NANNY_SITUATION_OPTIONS.find(o => o.id === profile.nanny_situation)?.label
  const timelineLabel = TIMELINE_OPTIONS.find(o => o.id === profile.care_timeline)?.label
  const hasSchedule = Object.values(profile.schedule).some(slots => slots && slots.length > 0)

  return (
    <div className="min-h-screen bg-opeari-bg pb-24 font-sans">


      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Header with Edit */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-opeari-heading tracking-tight">My Profile</h1>
          <Link
            to="/settings"
            className="px-6 py-2.5 bg-white border border-opeari-border text-opeari-heading font-bold rounded-full text-sm hover:bg-opeari-mint/10 hover:border-opeari-green/30 transition-all shadow-sm hover:shadow"
          >
            Edit Profile
          </Link>
        </div>

        {/* Profile Completeness - CTA */}
        {!isComplete && (
          <Link
            to="/settings?tab=profile"
            className="block mb-8 p-6 rounded-2xl bg-white border border-opeari-peach/30 shadow-card hover:shadow-card-hover hover:border-opeari-peach transition-all group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-opeari-peach/5 group-hover:bg-opeari-peach/10 transition-colors" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-opeari-heading uppercase tracking-wide">Profile strength</span>
                <span className="text-sm font-bold text-opeari-peach">{completeness}%</span>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden bg-stone-100">
                <div
                  className="h-full rounded-full transition-all bg-gradient-to-r from-opeari-peach to-opeari-coral"
                  style={{ width: `${completeness}%` }}
                />
              </div>
              <p className="text-sm mt-3 flex items-center gap-2 text-opeari-heading font-bold group-hover:text-opeari-coral transition-colors">
                Complete your profile to get 3x more connections
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </p>
            </div>
          </Link>
        )}

        {/* Main Card */}
        <div className="bg-white rounded-2xl overflow-hidden border border-opeari-border shadow-card hover:shadow-card-hover transition-all duration-300">

          {/* Photo & Basic Info */}
          <div className="p-6 sm:p-8 border-b border-gray-100 bg-gradient-to-b from-white to-stone-50/30">
            <div className="flex items-start gap-6">
              {/* Avatar */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 bg-white border-4 border-white shadow-md">
                {profile.photo_url ? (
                  <img src={profile.photo_url} alt={profile.first_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-opeari-green/10 flex items-center justify-center">
                    <span className="text-4xl font-bold text-opeari-heading/50">
                      {profile.first_name?.charAt(0) || '?'}
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 pt-2">
                <h2 className="text-2xl sm:text-3xl font-bold text-opeari-heading tracking-tight">
                  {profile.first_name}'s Family
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <svg className="w-4 h-4 text-opeari-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="font-medium text-opeari-heading/70">
                    {profile.neighborhood || 'Neighborhood Not Set'}
                  </span>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {situationLabel && (
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${profile.nanny_situation === 'have_nanny' ? 'bg-opeari-green/10 text-opeari-green' : 'bg-opeari-peach/10 text-opeari-peach'}`}>
                      {situationLabel}
                    </span>
                  )}
                  {timelineLabel && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">
                      {timelineLabel}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Tagline */}
            {profile.tagline && (
              <div className="mt-8 p-5 rounded-xl bg-opeari-bg/50 border border-opeari-border/30">
                <p className="text-lg italic text-opeari-heading/80 leading-relaxed font-medium text-center">"{profile.tagline}"</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
            {/* Kids Section */}
            <div className="p-6 sm:p-8">
              <h3 className="text-xs font-bold uppercase tracking-wider text-opeari-text-secondary mb-5 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Kids (Profiles coming soon)
              </h3>

              {profile.kids.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {profile.kids.map(kid => {
                    const genderClasses = getGenderClasses(kid.gender)
                    const age = kid.birth_year ? calculateKidAge(kid.birth_month || 1, kid.birth_year) : null
                    const primaryLabel = kid.first_name && kid.first_name.trim() ? kid.first_name.trim() : 'Child'

                    return (
                      <div
                        key={kid.id}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full ${genderClasses} font-bold text-sm shadow-sm`}
                      >
                        {/* Gender icon */}
                        <div className="w-5 h-5 rounded-full bg-white/60 flex items-center justify-center">
                          {kid.gender === 'boy' ? (
                            <svg className="w-3" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9H15V22H13V16H11V22H9V9H3V7H21V9Z" />
                            </svg>
                          ) : kid.gender === 'girl' ? (
                            <svg className="w-3" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM15 9H9V14H7V22H9V17H11V22H13V17H15V22H17V14H15V9Z" />
                            </svg>
                          ) : (
                            <svg className="w-3" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9H15V22H13V16H11V22H9V9H3V7H21V9Z" />
                            </svg>
                          )}
                        </div>
                        {primaryLabel}
                        {age && (
                          <span className="opacity-80 font-medium border-l border-current/20 pl-2 text-xs">
                            {age}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : profile.children_age_groups && profile.children_age_groups.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-xs text-gray-400 font-medium">Age groups you're planning around</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.children_age_groups.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-full text-xs font-bold bg-opeari-green/10 text-opeari-heading border border-opeari-green/20"
                      >
                        {formatAgeGroup(tag)}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <Link
                  to="/settings?tab=care"
                  className="block text-center py-8 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-opeari-mint hover:text-opeari-mint transition-colors hover:bg-opeari-mint/5 group"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-2 text-current group-hover:bg-white transition-colors">
                    <Plus size={20} />
                  </div>
                  <span className="text-sm font-bold">Add age groups</span>
                </Link>
              )}
            </div>

            {/* Schedule Section */}
            <div className="p-6 sm:p-8">
              <h3 className="text-xs font-bold uppercase tracking-wider text-opeari-text-secondary mb-5 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Care Schedule
              </h3>

              {hasSchedule ? (
                <div className="overflow-x-auto">
                  <div className="min-w-[280px]">
                    {/* Day headers */}
                    <div className="flex mb-2">
                      <div className="w-12 flex-shrink-0" />
                      {WEEKDAYS.map(day => (
                        <div key={day.id} className="flex-1 text-center text-[10px] font-bold text-opeari-heading uppercase">
                          {day.short}
                        </div>
                      ))}
                    </div>

                    {/* Time rows */}
                    {TIME_SLOTS.map(slot => {
                      const hasAnySlot = WEEKDAYS.some(d => (profile.schedule[d.id] || []).includes(slot.id))
                      if (!hasAnySlot) return null

                      return (
                        <div key={slot.id} className="flex items-center mb-1">
                          <div className="w-12 flex-shrink-0 text-[10px] text-gray-400 font-bold">
                            {slot.time}
                          </div>
                          {WEEKDAYS.map(day => {
                            const isSelected = (profile.schedule[day.id] || []).includes(slot.id)
                            return (
                              <div key={`${day.id}-${slot.id}`} className="flex-1 flex justify-center py-0.5 px-0.5">
                                <div
                                  className={`w-full aspect-square rounded-[4px] flex items-center justify-center transition-colors ${isSelected ? 'bg-opeari-mint shadow-sm' : 'bg-gray-50'}`}
                                >
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>

                  {/* Check strictly the boolean col (V1 Data Contract) */}
                  {profile.schedule_flexible && (
                    <p className="text-xs mt-4 flex items-center gap-1.5 text-opeari-green font-bold bg-opeari-green/5 p-2 rounded-lg inline-block">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Flexible schedule
                    </p>
                  )}
                </div>
              ) : (
                <Link
                  to="/settings?tab=care"
                  className="block text-center py-8 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-opeari-mint hover:text-opeari-mint transition-colors hover:bg-opeari-mint/5 group"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-2 text-current group-hover:bg-white transition-colors">
                    <Plus size={20} />
                  </div>
                  <span className="text-sm font-bold">Add your schedule</span>
                </Link>
              )}
            </div>
          </div>

          {/* Looking For */}
          {profile.looking_for.length > 0 && (
            <div className="p-6 sm:p-8 border-t border-gray-100 bg-stone-50/50">
              <h3 className="text-xs font-bold uppercase tracking-wider text-opeari-text-secondary mb-4">
                Looking For
              </h3>
              <div className="flex flex-wrap gap-2.5">
                {[...new Set(profile.looking_for.map(getLookingForLabel))].map((label, idx) => (
                  <span
                    key={idx}
                    className="px-4 py-2 rounded-full text-sm font-bold bg-white border border-opeari-border/50 text-opeari-heading shadow-sm"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {profile.languages.length > 0 && (
            <div className="p-6 sm:p-8 border-t border-gray-100 bg-stone-50/50">
              <h3 className="text-xs font-bold uppercase tracking-wider text-opeari-text-secondary mb-4">
                Languages Spoken
              </h3>
              <div className="flex flex-wrap gap-2.5">
                {profile.languages.map((lang, idx) => (
                  <span
                    key={idx}
                    className="px-4 py-2 rounded-full text-sm font-bold bg-white border border-opeari-border/50 text-opeari-heading shadow-sm capitalize"
                  >
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Bio */}
          {profile.bio && (
            <div className="p-6 sm:p-8 border-t border-gray-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-opeari-text-secondary mb-4">
                About Us
              </h3>
              <div className="prose prose-sm prose-stone text-opeari-text leading-relaxed font-medium">
                {profile.bio}
              </div>
            </div>
          )}
        </div>

        {/* Privacy Note */}
        <p className="text-xs text-opeari-text-secondary text-center mt-8 px-4 font-medium opacity-70">
          Your last name and exact location are only shared after you connect with another family.
        </p>
      </div>
    </div>
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
  // Update completeness to account for fallback
  if (profile.kids.length > 0 || (profile.children_age_groups && profile.children_age_groups.length > 0)) score += weights.kids
  if (profile.bio) score += weights.bio

  return score
}