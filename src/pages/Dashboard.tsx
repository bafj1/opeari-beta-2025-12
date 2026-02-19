import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import OpeariLoader from '../components/ui/OpeariLoader'

import CaregiverDashboard from '../components/Dashboard/Caregiver/CaregiverDashboard'
import FamilyDashboard from '../components/Dashboard/NorthStar/FamilyDashboard'

// Helper to prevent infinite loading
const timeout = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default function Dashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<'family' | 'caregiver' | 'parent' | null>(null)

  useEffect(() => {
    async function resolveIdentity() {
      if (!user) {
        setLoading(false);
        return;
      }

      if (import.meta.env.DEV) console.log('Dashboard: Resolving identity for', user.id);

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
          if (import.meta.env.DEV) console.log('Dashboard: Identity Resolved', member);
          setRole(member.role as 'family' | 'caregiver');
        } else {
          if (error && error.message !== 'Timeout') console.error('Dashboard: Member fetch error', error);
          if (import.meta.env.DEV) console.warn('Dashboard: Member row missing locally, falling back to metadata');
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
  }, [user?.id]);

  // Loading State
  if (loading && !role) {
    return (
      <div className="min-h-screen bg-[#d8f5e5] flex items-center justify-center">
        <OpeariLoader message="Loading your village..." />
      </div>
    );
  }

  // 1. Strict Routing based on DB Role
  const normalizedRole = (role ?? '').toLowerCase();
  if (normalizedRole.includes('caregiver')) {
    return <CaregiverDashboard />
  }

  // Fallback / Family -> North Star Dashboard
  if (role === 'family' || role === 'parent' || !role) {
    return <FamilyDashboard />
  } else {
    // Unknown
    return <Navigate to="/onboarding" replace />
  }
}