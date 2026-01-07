import { useState, useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import DashboardHeader from '../components/Dashboard/DashboardHeader'
import VillageRadar from '../components/Dashboard/VillageRadar'
import SmartStack from '../components/Dashboard/SmartStack'
import { ChevronRight, Sprout } from 'lucide-react'
import {
  calculateOverlap,
  calculateCompatibility,
  getMatchReasons,
  type UserProfile,
  type FamilyMatch
} from '../lib/matching'

import CaregiverDashboard from '../components/Dashboard/CaregiverDashboard'

// Helper to normalize schedule shape
const normalizeSchedule = (s: any) => (s?.grid ?? s ?? {});

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

  // Intel State
  const [intel, setIntel] = useState<any>(null);

  useEffect(() => {
    // Double check to prevent race conditions or heavy queries if intent is wrong
    if (!user || normalizedIntent !== 'family') return

    async function loadDashboardData() {
      setLoading(true)
      try {
        // 1. Get My Profile
        // strict logic: if members has user_id, use that. 
        // We know members.id is auth.id from previous context, but strictly we should check
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

        // Normalize Schedule
        const mySchedule = normalizeSchedule(myProfile.schedule);

        const userProfile: UserProfile = {
          id: myProfile.id,
          schedule: mySchedule,
          neighborhood: myProfile.neighborhood || '',
          nanny_situation: myProfile.nanny_situation || '',
          kids: mapKids(myProfile.kids_ages),
          invited_by: myProfile.invited_by,
          care_timeline: myProfile.care_timeline,
          zip_code: myProfile.zip_code // Needed for fallback
        }
        setProfile(userProfile)

        // 2. Get Potential Matches (FAMILIES ONLY) & Intel concurrently
        // Safe explicit select for browsing
        const [membersResult, intelResult] = await Promise.all([
          supabase
            .from('members_preview')
            .select(`
              id, first_name, role, neighborhood, zip_code, bio,
              availability_days, availability_blocks, num_kids,
              children_age_groups, care_types, situation, timeline
            `, { count: 'exact' })
            .eq('role', 'family') // FILTER: Only families
            .neq('id', myProfile.id),

          supabase.rpc('get_community_intel', {
            query_user_id: user!.id
          })
        ]);

        // Process Intel
        const { data: intelData, error: intelError } = intelResult;
        if (!intelError && intelData) {
          console.log('Intel Data:', intelData);
          setIntel(intelData);
        } else {
          console.warn('Intel Error:', intelError);
        }

        // Process Members
        const { data: allMembers, count } = membersResult;

        if (allMembers) {
          setTotalFamilies(count ?? allMembers.length ?? 0)

          // Process Matches
          const processed = allMembers.map((member: any) => {
            // Map Preview Fields to Match Model
            const memberSchedule = member.availability_days
              ? member.availability_days.reduce((acc: any, day: string) => ({ ...acc, [day]: ['partial'] }), {})
              : {};

            const overlap = calculateOverlap(userProfile.schedule, memberSchedule)

            const match: FamilyMatch = {
              id: member.id,
              first_name: member.first_name || 'Family',
              location: member.neighborhood || member.zip_code || '', // Neighborhood First, then Zip
              neighborhood: member.neighborhood || '',
              photo_url: null, // Removed per prod schema
              nanny_situation: member.situation || '', // Map alias
              care_timeline: member.timeline || '',    // Map alias
              schedule: memberSchedule,
              // Map num_kids to dummy array if needed, or empty
              kids: Array(member.num_kids || 0).fill({ id: 'unknown', birth_year: null }),
              invited_by: null, // Not in preview
              overlapDays: overlap.days,
              matchReasons: [],
              compatibility: 0
            }
            match.matchReasons = getMatchReasons(userProfile, match)
            match.compatibility = calculateCompatibility(match.matchReasons, overlap.percentage)
            return match
          })

          // Sort and Segment into Stacks with De-duplication

          const matchIds = new Set<string>();

          // Stack 1: Perfect Schedule (>50% overlap OR 'schedule' reason highlighted)
          const scheduleStack = processed
            .filter(m => m.matchReasons.some(r => r.icon === 'schedule'))
            .sort((a, b) => b.compatibility - a.compatibility)
            .slice(0, 5)

          scheduleStack.forEach(m => matchIds.add(m.id));

          // Stack 2: Neighbors (Location match, excluding already shown)
          // GUARD: Strict Neighborhood matching (no blanks)
          const myNeighborhood = (userProfile.neighborhood || '').trim();

          const neighborStack = processed
            .filter(m => {
              const theirNeighborhood = (m.neighborhood || '').trim();
              return myNeighborhood && theirNeighborhood &&
                theirNeighborhood.toLowerCase() === myNeighborhood.toLowerCase() &&
                !matchIds.has(m.id);
            })
            .sort((a, b) => b.compatibility - a.compatibility)
            .slice(0, 5)

          neighborStack.forEach(m => matchIds.add(m.id));

          // Stack 3: Recommended / Recent (Excluding already shown)
          const topStack = processed
            .filter(m => !matchIds.has(m.id))
            .sort((a, b) => b.compatibility - a.compatibility)
            .slice(0, 5)

          setScheduleMatches(scheduleStack)
          setNearbyMatches(neighborStack)
          setRecentMatches(topStack)
        }

      } catch (error) {
        console.error('Dashboard load error:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [user, normalizedIntent])

  // --- PRIMARY ACTION LOGIC ---
  const getPrimaryAction = () => {
    // Check normalized schedule for availability (Stronger check)
    const schedule = profile?.schedule ?? {};
    const hasAvailability = Object.values(schedule).some((slots: any) => Array.isArray(slots) && slots.length > 0);

    if (!hasAvailability) {
      return {
        title: "Set Your Availability",
        desc: "You won't appear in schedule searches until you add your times.",
        cta: "Update Schedule",
        link: "/settings"
      };
    }

    // Default: Build Village
    return {
      title: "Grow Your Village",
      desc: "Connect with families to unlock more care options.",
      cta: "Find Families",
      link: "/build-your-village"
    };
  };

  const primaryAction = getPrimaryAction();

  // STRONGER LOCATION FALLBACK
  const displayLocation =
    profile?.neighborhood?.trim() ||
    profile?.zip_code?.trim() ||
    'your area';

  return (
    <div className="min-h-screen bg-opeari-bg pb-20">


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
            {/* Show only if we have a location or it looks broken */}
            <VillageRadar location={displayLocation} intel={intel} />

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
                    subtitle={displayLocation && displayLocation.trim().length > 0 && displayLocation !== 'your area' ? `Neighbors in ${displayLocation}.` : "Families nearby."}
                    matches={nearbyMatches}
                    viewAllLink="/build-your-village?filter=location"
                  />
                )}

                {/* Only show Recommended if we have them */}
                {recentMatches.length > 0 && (
                  <SmartStack
                    title="Recommended Neighbors"
                    subtitle="Families compatible with your needs."
                    matches={recentMatches}
                    viewAllLink="/build-your-village"
                  />
                )}

                {scheduleMatches.length === 0 && nearbyMatches.length === 0 && recentMatches.length === 0 && (
                  <div className="bg-white rounded-2xl p-8 text-center border-dashed border-2 border-gray-200">
                    <div className="w-16 h-16 bg-[#d8f5e5] rounded-full flex items-center justify-center mx-auto mb-4 text-[#1e6b4e]">
                      <Sprout size={32} />
                    </div>
                    <h3 className="font-bold text-xl text-opeari-heading mb-2">You're one of the first in {displayLocation || 'this area'}!</h3>
                    <p className="text-gray-500 mb-6">Your village is just getting started. Invite a neighbor to grow it faster.</p>
                    <Link to="/invite" className="inline-block bg-opeari-green text-white px-6 py-2 rounded-full font-bold shadow-md hover:bg-[#155d42] transition-colors">
                      Invite a Neighbor
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="space-y-6">

            {/* Primary Action Card (Replaces Profile Strength) */}
            <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-100">
              <h3 className="font-bold text-opeari-heading mb-2">{primaryAction.title}</h3>
              <p className="text-sm text-gray-500 mb-4">{primaryAction.desc}</p>
              <Link to={primaryAction.link} className="block w-full text-center bg-opeari-green text-white py-2 rounded-lg font-bold hover:bg-[#155d42] transition-colors">
                {primaryAction.cta}
              </Link>
            </div>

            {/* Quick Links (Simplified) */}
            <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-100">
              <h3 className="font-bold text-opeari-heading mb-4">Quick Links</h3>
              <ul className="space-y-3">
                <li>
                  <Link to="/settings" className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                      <ChevronRight size={16} />
                    </span>
                    <span className="text-sm font-medium text-gray-700">Edit Profile</span>
                  </Link>
                </li>
                <li>
                  <Link to="/invite" className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <span className="w-8 h-8 rounded-full bg-opeari-peach/50 flex items-center justify-center text-[#e08e70]">
                      <ChevronRight size={16} />
                    </span>
                    <span className="text-sm font-medium text-gray-700">Invite Friends</span>
                  </Link>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}