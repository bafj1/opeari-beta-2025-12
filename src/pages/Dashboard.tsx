import { useState, useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Header from '../components/common/Header'
import DashboardHeader from '../components/Dashboard/DashboardHeader'
import VillageRadar from '../components/Dashboard/VillageRadar'
import SmartStack from '../components/Dashboard/SmartStack'
import { ChevronRight, Sprout, ShieldCheck } from 'lucide-react'
import {
  calculateOverlap,
  calculateCompatibility,
  getMatchReasons,
  type UserProfile,
  type FamilyMatch
} from '../lib/matching'

import CaregiverDashboard from '../components/Dashboard/CaregiverDashboard'

export default function Dashboard() {
  const { user } = useAuth()

  // 0. Check & Normalize User Type
  const rawIntent = user?.user_metadata?.intent
  let normalizedIntent: 'caregiver' | 'family' | 'unknown' = 'unknown'

  if (rawIntent === 'providing' || rawIntent === 'caregiver') {
    normalizedIntent = 'caregiver'
  } else if (rawIntent === 'seeking' || rawIntent === 'family') {
    normalizedIntent = 'family'
  }

  // TEMP DEBUG LOGS
  console.log('|--- DASHBOARD LOAD ---|')
  console.log('User ID:', user?.id)
  console.log('Raw Intent:', rawIntent)
  console.log('Normalized Intent:', normalizedIntent)
  console.log('|----------------------|')

  // 1. Strict Routing
  if (normalizedIntent === 'caregiver') {
    return <CaregiverDashboard />
  }

  if (normalizedIntent === 'unknown') {
    console.warn('Unknown intent, redirecting to onboarding.')
    return <Navigate to="/onboarding?step=0" replace />
  }

  // --- FAMILY DASHBOARD LOGIC (Strictly Family Only) ---
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [firstName, setFirstName] = useState('')

  // Stacks
  const [scheduleMatches, setScheduleMatches] = useState<FamilyMatch[]>([])
  const [nearbyMatches, setNearbyMatches] = useState<FamilyMatch[]>([])
  const [recentMatches, setRecentMatches] = useState<FamilyMatch[]>([])
  const [totalFamilies, setTotalFamilies] = useState(0)

  useEffect(() => {
    // Double check to prevent race conditions or heavy queries if intent is wrong
    if (!user || normalizedIntent !== 'family') return

    async function loadDashboardData() {
      setLoading(true)
      try {
        // 1. Get My Profile
        const { data: myProfile } = await supabase
          .from('members')
          .select('*')
          .eq('id', user!.id)
          .single()

        if (!myProfile) {
          console.warn('Family intent but no member profile found.')
          return
        }

        setFirstName(myProfile.first_name)

        const mapKids = (ages: number[] | null): any[] => {
          if (!ages) return []
          return ages.map((year, idx) => ({
            id: `k-${idx}`,
            birth_year: year,
            birth_month: null
          }))
        }

        const userProfile: UserProfile = {
          id: myProfile.id,
          schedule: myProfile.schedule || {},
          location: myProfile.location || '',
          neighborhood: myProfile.neighborhood || '',
          nanny_situation: myProfile.nanny_situation || '',
          kids: mapKids(myProfile.kids_ages),
          invited_by: myProfile.invited_by,
          care_timeline: myProfile.care_timeline
        }
        setProfile(userProfile)

        // 2. Get Potential Matches
        const { data: allMembers } = await supabase
          .from('members')
          .select('*', { count: 'exact' })
          .neq('id', myProfile.id)

        if (allMembers) {
          setTotalFamilies(allMembers.length) // or count

          // Process Matches
          const processed = allMembers.map(member => {
            const overlap = calculateOverlap(userProfile.schedule, member.schedule || {})
            const match: FamilyMatch = {
              id: member.id,
              first_name: member.first_name || 'Family',
              location: member.location || '',
              neighborhood: member.neighborhood || '',
              photo_url: member.photo_url,
              nanny_situation: member.nanny_situation || '',
              care_timeline: member.care_timeline || '',
              schedule: member.schedule || {},
              kids: mapKids(member.kids_ages),
              invited_by: member.invited_by,
              overlapDays: overlap.days,
              matchReasons: [],
              compatibility: 0
            }
            match.matchReasons = getMatchReasons(userProfile, match)
            match.compatibility = calculateCompatibility(match.matchReasons, overlap.percentage)
            return match
          })

          // Sort and Segment into Stacks

          // Stack 1: Perfect Schedule (>50% overlap OR 'schedule' reason highlighted)
          const scheduleStack = processed
            .filter(m => m.matchReasons.some(r => r.icon === 'schedule'))
            .sort((a, b) => b.compatibility - a.compatibility)
            .slice(0, 5)

          // Stack 2: Neighbors (Location match, excluding ones already in schedule stack to avoid dupes? or keep logic simple for now)
          // Let's allow dupes across stacks if relevant, or filter. Simple for now.
          const neighborStack = processed
            .filter(m => m.neighborhood === userProfile.neighborhood)
            .sort((a, b) => b.compatibility - a.compatibility)
            .slice(0, 5)

          // Stack 3: High Logic / Catch All (Top Comp)
          const topStack = processed
            .sort((a, b) => b.compatibility - a.compatibility)
            .slice(0, 5)

          setScheduleMatches(scheduleStack)
          setNearbyMatches(neighborStack)
          setRecentMatches(topStack) // Using top stack as "Recent" or "Recommended" for MVP
        }

      } catch (error) {
        console.error('Dashboard load error:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [user, normalizedIntent])

  return (
    <div className="min-h-screen bg-opeari-bg pb-20">
      <Header />

      <div className="max-w-6xl mx-auto px-4 pt-8">
        {/* 1. Header Section */}
        <div className="flex flex-col md:flex-row gap-8 items-start mb-10">
          <div className="flex-1">
            <DashboardHeader
              firstName={firstName}
              loading={loading}
              familyCount={totalFamilies}
              newMatchesCount={scheduleMatches.length}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT / MAIN COLUMN */}
          <div className="lg:col-span-2 space-y-10">

            {/* 2. Village Radar (Hero) */}
            <VillageRadar />

            {/* 3. Smart Stacks */}
            {loading ? (
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                <div className="flex gap-4 overflow-hidden">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-72 h-48 bg-gray-100 rounded-2xl animate-pulse shrink-0"></div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {scheduleMatches.length > 0 && (
                  <SmartStack
                    title="Perfect Schedule Matches"
                    subtitle="Families with compatible care needs."
                    matches={scheduleMatches}
                    viewAllLink="/build-your-village?filter=schedule"
                  />
                )}

                {nearbyMatches.length > 0 && (
                  <SmartStack
                    title="In Your Neighborhood"
                    subtitle={`Neighbors in ${profile?.neighborhood}.`}
                    matches={nearbyMatches}
                    viewAllLink="/build-your-village?filter=location"
                  />
                )}

                <SmartStack
                  title="Recommended Neighbors"
                  subtitle="Families compatible with your needs."
                  matches={recentMatches}
                  viewAllLink="/build-your-village"
                />

                {scheduleMatches.length === 0 && nearbyMatches.length === 0 && recentMatches.length === 0 && (
                  <div className="bg-white rounded-2xl p-8 text-center border-dashed border-2 border-gray-200">
                    <div className="w-16 h-16 bg-[#d8f5e5] rounded-full flex items-center justify-center mx-auto mb-4 text-[#1e6b4e]">
                      <Sprout size={32} />
                    </div>
                    <h3 className="font-bold text-xl text-opeari-heading mb-2">You're one of the first in this neighborhood!</h3>
                    <p className="text-gray-500 mb-6">Your village is just getting started. Invite a neighbor to grow it faster.</p>
                    <button className="bg-opeari-green text-white px-6 py-2 rounded-full font-bold shadow-md hover:bg-[#155d42] transition-colors">
                      Invite a Neighbor
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="space-y-6">
            {/* Profile Card Mini */}
            <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-100">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-opeari-mint rounded-full flex items-center justify-center text-xl border-2 border-white shadow-sm overflow-hidden">
                  {profile?.id && <span>{firstName.charAt(0)}</span>}
                  {/* Future: Real Avatar */}
                </div>
                <div>
                  <h3 className="font-bold text-opeari-heading">Your Profile</h3>
                  <Link to="/settings" className="text-xs text-gray-400 hover:text-opeari-green">Edit Preferences</Link>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Profile Strength</span>
                  <span className="font-bold text-opeari-green">98%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-opeari-green h-2 rounded-full w-[98%]" />
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-100">
              <h3 className="font-bold text-opeari-heading mb-4">Quick Actions</h3>
              <ul className="space-y-3">
                <li>
                  <Link to="/build-your-village" className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <span className="w-8 h-8 rounded-full bg-opeari-mint/50 flex items-center justify-center text-opeari-green">
                      <ChevronRight size={16} />
                    </span>
                    <span className="text-sm font-medium text-gray-700">Find Families</span>
                  </Link>
                </li>
                <li>
                  <button className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors text-left">
                    <span className="w-8 h-8 rounded-full bg-opeari-peach/50 flex items-center justify-center text-[#e08e70]">
                      <ChevronRight size={16} />
                    </span>
                    <span className="text-sm font-medium text-gray-700">Invite Friends</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Trust Badge (Mock) */}
            <div className="bg-[#f0faf4] rounded-2xl p-4 border border-opeari-green/20">
              <div className="flex items-start gap-3">
                <span className="text-xl text-opeari-green"><ShieldCheck size={24} /></span>
                <div>
                  <h4 className="font-bold text-opeari-green text-sm">Opeari Verified</h4>
                  <p className="text-xs text-opeari-green/80 mt-1">Complete your background check to unlock the Verified badge.</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}