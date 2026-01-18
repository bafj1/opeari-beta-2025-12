import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

// New Village Components
import VillageHome from '../components/Dashboard/VillageHome'
import VillageResults from '../components/Dashboard/VillageResults'
import VillagePanel from '../components/Dashboard/VillagePanel'
import VillageMap from '../components/Dashboard/VillageMap'
import { EmptyStateBanner, SuccessStateBanner } from '../components/Dashboard/StateBanners'

import CaregiverDashboard from '../components/Dashboard/CaregiverDashboard'
import IncomingInterests from '../components/Dashboard/IncomingInterests'

// Helper to prevent infinite loading
const timeout = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default function Dashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<'family' | 'caregiver' | null>(null)

  // Real State for Family
  const [firstName, setFirstName] = useState(user?.user_metadata?.first_name || user?.user_metadata?.full_name?.split(' ')[0] || '')
  const [selectedNeeds, setSelectedNeeds] = useState<string[]>([])
  const [connectionsStarted] = useState(0)
  const [availabilityAdded, setAvailabilityAdded] = useState(false)
  const [matches] = useState<any[]>([])

  useEffect(() => {
    async function resolveIdentity() {
      if (!user) return;

      console.log('Dashboard: Resolving identity for', user.id);

      try {
        const dbPromise = supabase
          .from('members')
          .select('role, first_name, schedule')
          .eq('id', user.id)
          .single();

        const { data: member, error } = await Promise.race([
          dbPromise,
          timeout(2000).then(() => ({ data: null, error: { message: 'Timeout' } }))
        ]) as any;

        if (member) {
          console.log('Dashboard: Identity Resolved', member);
          setRole(member.role as 'family' | 'caregiver');
          setFirstName(member.first_name);

          if (member.role === 'family') {
            const hasAvailability = member.schedule && Object.keys(member.schedule).length > 0;
            setAvailabilityAdded(!!hasAvailability);
          }
        } else {
          if (error && error.message !== 'Timeout') console.error('Dashboard: Member fetch error', error);
          console.warn('Dashboard: Member row missing locally, falling back to metadata');
          const metaRole = user.user_metadata?.intent === 'caregiver' ? 'caregiver' : 'family';
          setRole(metaRole);
        }
      } catch (err) {
        console.error('Dashboard: Exception', err);
        setRole('family');
      }

      setLoading(false);
    }

    resolveIdentity();
  }, [user]);

  // Derived State
  const needsSelected = selectedNeeds.length;

  const handleToggleNeed = (needId: string) => {
    setSelectedNeeds(prev =>
      prev.includes(needId)
        ? prev.filter(n => n !== needId)
        : [...prev, needId]
    )
  }

  // Loading State (Non-blocking: we render shell, but maybe show a spinner inside content if crucial)
  if (loading && !role) {
    return <div className="min-h-screen bg-opeari-bg flex items-center justify-center"><div className="w-8 h-8 border-4 border-opeari-peach border-t-opeari-green rounded-full animate-spin"></div></div>
  }

  // 1. Strict Routing based on DB Role
  if (role === 'caregiver') {
    return <CaregiverDashboard />
  }

  // Fallback / Family
  if (role === 'family' || !role) {
    // Family Dashboard Render follows below
  } else {
    // Unknown
    return <Navigate to="/onboarding" replace />
  }

  // Banner Logic for Family
  const showEmptyBanner = connectionsStarted === 0 && matches.length === 0 && selectedNeeds.length === 0;
  const showSuccessBanner = connectionsStarted > 0;

  return (
    <div className="min-h-screen bg-opeari-bg pb-20 font-sans">



      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-8">

          {/* Left Column: Main Experience */}
          <div className="space-y-8">

            {/* 1. Village Home / Hero */}
            <VillageHome
              userName={firstName || "Breada"}
              selectedNeeds={selectedNeeds}
              onToggleNeed={handleToggleNeed}
            />

            {/* 1.5 Incoming Interests */}
            <IncomingInterests />

            {/* 2. State Banners (Conditional) */}
            <div className="grid grid-cols-1 gap-6">
              {showEmptyBanner && <EmptyStateBanner />}
              {showSuccessBanner && <SuccessStateBanner />}
            </div>

            {/* 3. Village Results */}
            {matches.length > 0 && <VillageResults matches={matches} />}

            {/* 4. Village Map */}
            <VillageMap />

          </div>

          {/* Right Column: Sidebar */}
          <div className="xl:block hidden">
            <div className="sticky top-6">
              <VillagePanel
                connectionsStarted={connectionsStarted}
                needsSelected={needsSelected}
                availabilityAdded={availabilityAdded}
              />
            </div>
          </div>

          {/* Mobile/Tablet Sidebar (Stacked) */}
          <div className="xl:hidden block">
            <VillagePanel
              connectionsStarted={connectionsStarted}
              needsSelected={needsSelected}
              availabilityAdded={availabilityAdded}
            />
          </div>

        </div>
      </div>

    </div>
  )
}