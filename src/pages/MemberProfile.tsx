import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Star, Heart, Calendar, MapPin, Globe, Sparkles, Baby, Car, Handshake, Wind, PawPrint, CircleParking, CheckCircle2, Moon, Dumbbell, AlertTriangle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useViewer } from '../hooks/useViewer'
import { supabase } from '../lib/supabase'
import Toast from '../components/ui/Toast'
import { logAlphaEvent } from '../lib/analytics'
import { createNotification } from '../lib/notifications'
import {
  NANNY_SITUATION_OPTIONS,
  WEEKDAYS,
  TIME_SLOTS,
} from '../lib/Constants'

type Schedule = Record<string, string[]>

// Helper to humanize care types
function humanizeCareType(raw: string): string {
  const map: Record<string, string> = {
    'trusted-babysitter': 'a trusted babysitter',
    'nanny-share': 'a nanny share',
    'mothers-helper': "a mother's helper",
    'backup-care': 'backup care',
    'after-school': 'after-school care',
    'date-night': 'date night sitter',
    'occasional': 'occasional care',
  };
  return map[raw] || raw.replace(/-/g, ' ');
}

// Prod Schema: No JSONB for kids. 
// We use placeholder kids or construct from kids_ages when connected.
interface Kid {
  id: string
  first_name?: string
  name?: string
  gender: string | null
  birth_month: number | null
  birth_year: number | null
  notes?: string
}

interface MemberData {
  id: string
  first_name: string
  role: string
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

  // Preferences
  comfortable_with_pets?: boolean
  smoke_free_required?: boolean
  transportation_required?: boolean
  willing_to_travel?: boolean
  available_overnight?: boolean
  household_preferences?: string[]
  support_offered?: string[]
  has_transportation?: boolean
  can_lift_30lbs?: boolean
  comfortable_with_stairs?: boolean
  vetting_status?: string

  // Home details
  has_parking?: boolean
  has_stairs?: boolean
  has_yard?: boolean
  has_pool?: boolean
  has_pets?: boolean
  pet_types?: string[]
  home_type?: string
  home_allergies?: string[]
  home_allergy_notes?: string
  home_notes?: string

  email?: string
  phone?: string
  avatar_url?: string
  photo_url?: string
  instagram_handle?: string
  linkedin_handle?: string
  facebook_handle?: string
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

export default function MemberProfile() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { viewer } = useViewer()

  const [loading, setLoading] = useState(true)
  const [member, setMember] = useState<MemberData | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null)
  const [incomingRequest, setIncomingRequest] = useState<string | null>(null) // ID of request if they sent it
  const [connectionCount, setConnectionCount] = useState(0)
  const [mutualCount, setMutualCount] = useState(0)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [endorsementCount, setEndorsementCount] = useState(0)
  const [avgRating, setAvgRating] = useState(0)
  const [endorsements, setEndorsements] = useState<any[]>([])
  const [showEndorseForm, setShowEndorseForm] = useState(false)
  const [endorseRating, setEndorseRating] = useState(0)
  const [endorseText, setEndorseText] = useState('')
  const [endorseRelationship, setEndorseRelationship] = useState('')
  const [endorseSaving, setEndorseSaving] = useState(false)
  const [hasEndorsed, setHasEndorsed] = useState(false)

  function computeCompatibility() {
    if (!viewer?.member || !member || !isConnected) return null;

    const my = viewer.member;
    const their = member;
    const signals: Array<{ icon: string; label: string; type: 'match' | 'info' }> = [];

    // 1. Shared languages
    const myLangs = (my.languages || []).map((l: string) => l.toLowerCase());
    const theirLangs = (their.languages || []).map((l: string) => l.toLowerCase());
    const sharedLangs = myLangs.filter((l: string) => theirLangs.includes(l));
    if (sharedLangs.length > 0 && sharedLangs.length < theirLangs.length) {
      // Only show if there's overlap but not everything matches (that's boring)
      const formatted = sharedLangs.map((l: string) => l.charAt(0).toUpperCase() + l.slice(1));
      signals.push({ icon: 'language', label: `You both speak ${formatted.join(' & ')} `, type: 'match' });
    }

    // 2. Schedule day overlap
    const myDays = my.availability_days || [];
    const theirDays = their.availability_days || [];
    const sharedDays = myDays.filter((d: string) => theirDays.includes(d));
    if (sharedDays.length > 0 && myDays.length > 0 && theirDays.length > 0) {
      const dayNames: Record<string, string> = {
        mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday',
        thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday'
      };
      if (sharedDays.length <= 3) {
        const names = sharedDays.map((d: string) => dayNames[d] || d);
        signals.push({ icon: 'calendar', label: `${names.join(', ')} overlap`, type: 'match' });
      } else {
        signals.push({ icon: 'calendar', label: `${sharedDays.length} days of schedule overlap`, type: 'match' });
      }
    }

    // 3. Age group alignment (my kids need care → they can provide for that age)
    const myNeeds = (my.matching_prefs as any)?.age_ranges_need || my.children_age_groups || [];
    const theirProvides = (their as any).children_age_groups || [];
    // For now, just check if they share age groups (both have toddlers = likely good match)
    const ageGroupLabels: Record<string, string> = {
      infants: 'infants', toddlers: 'toddlers', preschool: 'preschoolers',
      school_age: 'school-age kids', teens: 'teens',
      'Infant (0-1)': 'infants', 'Toddler (1-3)': 'toddlers',
      'Preschool (3-5)': 'preschoolers', 'School Age (5-12)': 'school-age kids'
    };
    const sharedAgeGroups = myNeeds.filter((a: string) => theirProvides.includes(a));
    if (sharedAgeGroups.length > 0) {
      const label = ageGroupLabels[sharedAgeGroups[0]] || sharedAgeGroups[0];
      signals.push({ icon: 'baby', label: `Both have ${label} `, type: 'match' });
    }

    // 4. Shared support offered
    const mySupport = my.support_offered || [];
    const theirSupport = (their as any).support_offered || [];
    if (Array.isArray(mySupport) && Array.isArray(theirSupport)) {
      const sharedSupport = mySupport.filter((s: string) =>
        theirSupport.some((t: string) => t.toLowerCase() === s.toLowerCase())
      );
      if (sharedSupport.length > 0) {
        signals.push({ icon: 'handshake', label: `Both offer ${sharedSupport[0].toLowerCase()} `, type: 'match' });
      }
    }

    // 5. Care type alignment
    const myCareTypes = my.care_types || [];
    const theirCareTypes = their.care_types || [];
    const sharedCare = myCareTypes.filter((c: string) => theirCareTypes.includes(c));
    if (sharedCare.length > 0) {
      const careLabels: Record<string, string> = {
        'babysitter': 'babysitter', 'nanny': 'nanny', 'nanny-share': 'nanny share',
        'mothers-helper': "mother's helper", 'backup-care': 'backup care',
        'household-manager': 'household manager', 'special-needs': 'special needs care'
      };
      const label = careLabels[sharedCare[0]] || sharedCare[0].replace(/-/g, ' ');
      signals.push({ icon: 'sparkles', label: `Both looking for a ${label}`, type: 'match' });
    }

    // 6. Lifestyle compatibility
    if (my.smoke_free_required && their.smoke_free_required) {
      signals.push({ icon: 'smoke-free', label: 'Both prefer smoke-free', type: 'match' });
    }
    if (my.comfortable_with_pets && their.comfortable_with_pets) {
      signals.push({ icon: 'pets', label: 'Both comfortable with pets', type: 'match' });
    }

    // Cap at 4 signals to keep it clean
    return signals.slice(0, 4);
  }



  useEffect(() => {
    if (!id) return
    loadMember()
  }, [id, user]) // Re-load if user changes (login)

  async function loadMember() {
    try {
      setLoading(true)

      // 1. Check Connection Status FIRST
      let status = 'none'
      let incomingReqId: string | null = null

      if (user) {
        try {
          const { data: statusData } = await supabase.rpc('get_connection_status', {
            user_a: user.id,
            user_b: id
          });
          if (statusData) status = statusData;

          // Check for incoming request
          if (status === 'pending') {
            const { data: inc } = await supabase
              .from('connections')
              .select('id')
              .eq('requester_id', id)
              .eq('recipient_id', user.id)
              .eq('status', 'pending')
              .maybeSingle();
            if (inc) incomingReqId = inc.id;
          }
        } catch (e) {
          console.log('Connection check skipped/failed', e)
        }
      }

      setConnectionStatus(status === 'none' ? null : status)
      setIncomingRequest(incomingReqId)

      // 2. Fetch Member Data based on Status
      let dataToUse: any = null;
      let isFullProfile = false;

      // If ACCEPTED or SELF -> fetch FULL profile from members_connected (view returns specific cols basically SELECT * FROM members)
      if (status === 'accepted' || (user && user.id === id)) {
        isFullProfile = true;
        const { data: connectedData, error: connectedError } = await supabase
          .from('members_connected')
          .select('*') // members_connected view filters cols, but let's select all available
          .eq('id', id)
          .single()

        if (!connectedError && connectedData) {
          dataToUse = connectedData;

          // Attempt to fetch kids table if connected (and if RLS allows - it might not yet)
          // Fallback to kids_ages in dataToUse
          try {
            // This query might fail if RLS isn't set up for connected users on 'kids' table
            // But let's try.
            const { data: kidsData } = await supabase
              .from('kids')
              .select('*')
              .eq('user_id', id)

            if (kidsData && kidsData.length > 0) {
              dataToUse.kids_table = kidsData;
            }
          } catch (e) { /* ignore */ }
        }
      }

      // If NOT connected or fetch failed -> fetch PREVIEW
      if (!dataToUse) {
        isFullProfile = false;
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
        dataToUse = previewData;
      }

      if (!dataToUse) throw new Error('Member not found');

      // 3. Construct Member Object
      let kidsArray: Kid[] = [];

      if (isFullProfile) {
        // Source 1: Kids Table
        if (dataToUse.kids_table && dataToUse.kids_table.length > 0) {
          kidsArray = dataToUse.kids_table.map((k: any) => ({
            id: k.id,
            name: k.name,
            birth_year: k.birth_year ? k.birth_year : (k.birthday ? new Date(k.birthday).getFullYear() : null),
            birth_month: k.birthday ? new Date(k.birthday).getMonth() + 1 : null,
            gender: k.gender || null, // Updated to use real gender
            notes: k.notes
          }))
        }
        // Source 2: kids_ages array (fallback)
        else if (dataToUse.kids_ages && Array.isArray(dataToUse.kids_ages)) {
          kidsArray = dataToUse.kids_ages.map((year: number, idx: number) => ({
            id: `k - ${idx} `,
            name: `Child ${idx + 1} `,
            birth_year: year,
            birth_month: null,
            gender: null
          }));
        }
      }

      const fullMember: MemberData = {
        id: dataToUse.id,
        first_name: dataToUse.first_name || 'Family',
        role: dataToUse.role || 'family',
        neighborhood: dataToUse.neighborhood || '',
        zip_code: dataToUse.zip_code || '',
        bio: dataToUse.bio || '',

        situation: dataToUse.situation || '',
        timeline: dataToUse.timeline || '',

        num_kids: dataToUse.num_kids || 0,
        children_age_groups: dataToUse.children_age_groups || [],
        care_types: dataToUse.care_types || [],
        availability_days: dataToUse.availability_days || [],
        availability_blocks: dataToUse.availability_blocks || [],
        schedule_flexible: dataToUse.schedule_flexible || false,
        languages: dataToUse.languages || [],

        // Detailed
        schedule: dataToUse.schedule || {},
        schedule_notes: dataToUse.schedule_notes || '',
        kids: kidsArray,

        // Preferences (only present in members_connected usually)
        comfortable_with_pets: dataToUse.comfortable_with_pets,
        smoke_free_required: dataToUse.smoke_free_required,
        transportation_required: dataToUse.transportation_required,
        willing_to_travel: dataToUse.willing_to_travel,
        available_overnight: dataToUse.available_overnight,

        // Socials
        instagram_handle: dataToUse.instagram_handle,
        linkedin_handle: dataToUse.linkedin_handle,
        facebook_handle: dataToUse.facebook_handle,
        support_offered: dataToUse.support_offered || [],

        // Avatar
        avatar_url: dataToUse.avatar_url,
        photo_url: dataToUse.photo_url,

        // Additional preferences
        has_transportation: dataToUse.has_transportation,
        can_lift_30lbs: dataToUse.can_lift_30lbs,
        comfortable_with_stairs: dataToUse.comfortable_with_stairs,
        vetting_status: dataToUse.vetting_status,

        // Home details
        has_parking: dataToUse.has_parking,
        has_stairs: dataToUse.has_stairs,
        has_yard: dataToUse.has_yard,
        has_pool: dataToUse.has_pool,
        has_pets: dataToUse.has_pets,
        pet_types: dataToUse.pet_types || [],
        home_type: dataToUse.home_type,
        home_allergies: dataToUse.home_allergies || [],
        home_allergy_notes: dataToUse.home_allergy_notes,
        home_notes: dataToUse.home_notes,
      }

      setMember(fullMember)

      // Fetch Connection Stats
      const { data: countData } = await supabase.rpc('get_connection_count', { user_id: id });
      setConnectionCount(countData || 0);

      if (user) {
        const { data: mutualData } = await supabase.rpc('get_mutual_connections', {
          user_a: user.id,
          user_b: id
        });
        setMutualCount(mutualData || 0);
      }

      // Fetch Endorsements with author details
      try {
        const { data: endorseData } = await supabase
          .from('endorsements')
          .select(`
            id, rating, text, relationship, created_at,
            author:members!endorsements_author_id_fkey(first_name, last_name, avatar_url)
          `)
          .eq('recipient_id', id)
          .eq('is_visible', true)
          .order('created_at', { ascending: false })
          .limit(5);
        if (endorseData) {
          setEndorsementCount(endorseData.length);
          const ratings = endorseData.filter((e: any) => e.rating).map((e: any) => e.rating as number);
          if (ratings.length > 0) {
            setAvgRating(Math.round((ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length) * 10) / 10);
          }
          setEndorsements(endorseData);
        }
      } catch { /* endorsements table might not exist yet */ }

      // Check if current user already endorsed this member
      if (user) {
        try {
          const { data: myEndorsement } = await supabase
            .from('endorsements')
            .select('id')
            .eq('author_id', user.id)
            .eq('recipient_id', id)
            .maybeSingle();
          if (myEndorsement) setHasEndorsed(true);
        } catch { /* table might not exist */ }
      }

    } catch (err) {
      console.error('Error loading member:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleEndorse() {
    if (!user || !member || endorseRating === 0) return;
    setEndorseSaving(true);
    try {
      const { error } = await supabase.from('endorsements').insert({
        author_id: user.id,
        recipient_id: member.id,
        rating: endorseRating,
        text: endorseText.trim(),
        relationship: endorseRelationship,
      });
      if (error) throw error;
      setHasEndorsed(true);
      setShowEndorseForm(false);
      setToast({ message: 'Endorsement submitted!', type: 'success' });
      setTimeout(() => setToast(null), 3000);
      // Refresh endorsement data
      loadMember();
    } catch (err: any) {
      if (err.code === '23505') {
        setToast({ message: 'You already endorsed this member.', type: 'info' });
      } else {
        console.error('Endorse error:', err);
        setToast({ message: 'Could not save endorsement.', type: 'error' });
      }
      setTimeout(() => setToast(null), 3000);
    } finally {
      setEndorseSaving(false);
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
      const { error } = await supabase
        .from('connections')
        .insert({
          requester_id: user.id,
          recipient_id: member.id,
          status: 'pending',
        })

      if (error) throw error

      setConnectionStatus('pending')
      setToast({ message: 'Request sent!', type: 'success' })

      // Notify recipient
      await createNotification({
        userId: member.id,
        type: 'connection_request',
        title: 'New connection request',
        body: `${user.user_metadata?.first_name || 'Someone'} wants to connect with you`,
        fromUserId: user.id,
        link: `/ member / ${user.id} `,
      })
    } catch (err: any) {
      if (err.code === '23505') {
        console.warn('Connection already exists, treating as pending');
        setConnectionStatus('pending');
      } else {
        console.error('Connection error:', err)
        setToast({ message: 'Could not send connection request. Please try again.', type: 'error' })
      }
    } finally {
      setConnecting(false)
    }
  }

  async function handleAccept() {
    if (!incomingRequest) return;
    setConnecting(true);
    try {
      const { error } = await supabase
        .from('connections')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', incomingRequest);

      if (error) throw error;

      setConnectionStatus('accepted');
      setIncomingRequest(null);
      setToast({ message: 'Connection accepted!', type: 'success' });

      // Notify requester (member.id is the one we are viewing, which is the requester in this context?)
      // Wait, if I am viewing a profile and I have an incoming request FROM them, then member.id IS the requester.
      // Yes, in handleAccept: incomingRequest is the ID of the connection where requester_id = id (the profile we are viewing).
      // So notifying member.id is correct.

      if (member) {
        await createNotification({
          userId: member.id,
          type: 'connection_accepted',
          title: 'Connection accepted',
          body: `${user?.user_metadata?.first_name || 'Someone'} accepted your connection request`,
          fromUserId: user?.id,
          link: `/ member / ${user?.id} `,
        });
      }

      // Refresh to get full data (unlock profile)
      loadMember();
    } catch (err) {
      console.error('Accept error', err);
      setToast({ message: 'Failed to accept. Try again.', type: 'error' });
    } finally {
      setConnecting(false);
    }
  }

  async function handleDecline() {
    if (!incomingRequest) return;
    setConnecting(true);
    try {
      const { error } = await supabase
        .from('connections')
        .update({ status: 'declined', updated_at: new Date().toISOString() })
        .eq('id', incomingRequest);

      if (error) throw error;

      setConnectionStatus(null);
      setIncomingRequest(null);
      setToast({ message: 'Request declined.', type: 'info' });
    } catch (err) {
      console.error('Decline error', err);
    } finally {
      setConnecting(false);
    }
  }



  if (loading) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.mint }}>
          <div style={{ color: COLORS.primary }} className="font-semibold animate-pulse">Loading profile...</div>
        </div>
      </>
    )
  }

  if (!member) {
    return (
      <>
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
  const isConnected = connectionStatus === 'accepted';

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          duration={3000}
        />
      )}
      <div className="min-h-screen bg-[#d8f5e5]" style={{ fontFamily: 'Comfortaa, sans-serif' }}>
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

          {/* Back Link */}
          <Link
            to="/village"
            className="inline-flex items-center gap-1 text-sm text-[#546E5C] hover:underline"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Village
          </Link>

          {/* ===== PROFILE HEADER CARD ===== */}
          <div className="bg-white rounded-[24px] overflow-hidden border border-[#8bd7c7]/20 shadow-sm">
            {/* Top Banner — gradient */}
            <div className="h-24 bg-gradient-to-r from-[#d8f5e5] via-[#8bd7c7]/30 to-[#F8C3B3]/20" />

            {/* Avatar + Name overlay */}
            <div className="px-6 pb-6 -mt-12">
              <div className="flex items-end gap-4 mb-4">
                {/* Avatar */}
                <div className="w-24 h-24 rounded-full bg-white border-4 border-white shadow-md flex items-center justify-center overflow-hidden flex-shrink-0">
                  {(member.avatar_url || member.photo_url) ? (
                    <img
                      src={member.avatar_url || member.photo_url}
                      alt={member.first_name}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-[#d8f5e5] flex items-center justify-center">
                      <span className="text-3xl font-bold text-[#1e6b4e]">
                        {(member.first_name || '?').charAt(0)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pb-1 min-w-0">
                  <h1 className="text-2xl font-bold text-[#1e6b4e] truncate">
                    {member.role === 'caregiver'
                      ? `${member.first_name}`
                      : `${member.first_name}'s Family`}
                  </h1>
                  {(member.neighborhood || member.zip_code) && (
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-[#546E5C]" />
                      <span className="text-sm text-[#546E5C]">
                        {member.neighborhood || member.zip_code}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Role + Timeline badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#d8f5e5] text-[#1e6b4e]">
                  {member.role === 'caregiver' ? 'Caregiver' : member.role === 'both' ? 'Parent & Caregiver' : 'Parent'}
                </span>
                {member.timeline === 'asap' && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#FEF3C7] text-[#92400E]">
                    Looking ASAP
                  </span>
                )}
                {situationLabel && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{
                      backgroundColor: member.situation === 'have_nanny' ? '#d8f5e5' : 'rgba(248, 195, 179, 0.2)',
                      color: member.situation === 'have_nanny' ? '#1e6b4e' : '#c4785e',
                    }}
                  >
                    {situationLabel}
                  </span>
                )}
                {member.vetting_status === 'verified' && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#d8f5e5] text-[#1e6b4e] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified
                  </span>
                )}
              </div>

              {/* Endorsement Badge */}
              {endorsementCount > 0 && (
                <div className="flex items-center gap-1.5 mb-4 px-3 py-1.5 rounded-full bg-[#f0faf4] border border-[#8bd7c7]/15 w-fit">
                  <Star className="w-3.5 h-3.5 text-[#F59E0B] fill-[#F59E0B]" />
                  <span className="text-xs font-semibold text-[#1e6b4e]">
                    {endorsementCount} {endorsementCount === 1 ? 'endorsement' : 'endorsements'}
                  </span>
                  {avgRating > 0 && (
                    <span className="text-xs text-[#546E5C]">· {avgRating} avg</span>
                  )}
                </div>
              )}

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-xl bg-[#f0faf4] border border-[#8bd7c7]/15">
                  <p className="text-xl font-bold text-[#1e6b4e]">{member.care_types?.length || 0}</p>
                  <p className="text-[10px] text-[#546E5C] uppercase tracking-wide font-medium">Care Needs</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-[#f0faf4] border border-[#8bd7c7]/15">
                  <p className="text-xl font-bold text-[#1e6b4e]">{connectionCount}</p>
                  <p className="text-[10px] text-[#546E5C] uppercase tracking-wide font-medium">Connections</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-[#f0faf4] border border-[#8bd7c7]/15">
                  <p className="text-xl font-bold text-[#1e6b4e]">{mutualCount}</p>
                  <p className="text-[10px] text-[#546E5C] uppercase tracking-wide font-medium">Mutual</p>
                </div>
              </div>
            </div>
          </div>

          {/* ===== WHY YOU MIGHT BE A GOOD FIT ===== */}
          {(() => {
            const signals = computeCompatibility();
            if (!signals || signals.length === 0) return null;

            const iconMap: Record<string, React.FC<any>> = {
              'calendar': Calendar, 'sparkles': Sparkles, 'baby': Baby,
              'location': MapPin, 'language': Globe, 'transport': Car,
              'handshake': Handshake, 'smoke-free': Wind, 'pets': PawPrint,
              'parking': CircleParking, 'heart': Heart,
            };

            return (
              <div className="bg-white rounded-[20px] p-6 border border-[#8bd7c7]/20 shadow-sm">
                <h3 className="text-base font-bold text-[#1e6b4e] mb-4">Why You Might Be A Good Fit</h3>
                <div className="flex flex-wrap gap-2">
                  {signals.map((signal, idx) => {
                    const IconComp = iconMap[signal.icon] || Star;
                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#f0faf4] border border-[#8bd7c7]/15 text-sm"
                      >
                        <IconComp className="w-4 h-4 text-[#1e6b4e] flex-shrink-0" />
                        <span className="text-[#546E5C]">{signal.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* ===== ABOUT / BIO ===== */}
          {member.bio && (
            <div className="bg-white rounded-[20px] p-6 border border-[#8bd7c7]/20 shadow-sm">
              <h3 className="text-base font-bold text-[#1e6b4e] mb-3">About</h3>
              <p className="text-sm text-[#546E5C] leading-relaxed whitespace-pre-line">
                {member.bio.startsWith('Looking for:')
                  ? `Looking for ${humanizeCareType(member.bio.replace('Looking for: ', '').trim())}`
                  : member.bio}
              </p>
            </div>
          )}

          {/* ===== CARE SCHEDULE ===== */}
          <div className="bg-white rounded-[20px] p-6 border border-[#8bd7c7]/20 shadow-sm">
            <h3 className="text-base font-bold text-[#1e6b4e] mb-4">Care Schedule</h3>

            {member.availability_days.length > 0 ? (
              <>
                {/* Connected with detailed data? Show grid */}
                {isConnected && member.schedule && Object.values(member.schedule).some(slots => Array.isArray(slots) && slots.length > 0) ? (
                  <>
                    <div className="flex gap-1 mb-2">
                      <div className="w-16"></div>
                      {WEEKDAYS.map(day => (
                        <div key={day.id} className="flex-1 text-center text-xs font-semibold text-[#546E5C]">
                          {day.short}
                        </div>
                      ))}
                    </div>
                    {TIME_SLOTS.map(slot => {
                      const hasAnyForSlot = WEEKDAYS.some(d => (member.schedule[d.id] || []).includes(slot.id));
                      if (!hasAnyForSlot) return null;
                      return (
                        <div key={slot.id} className="flex gap-1 mb-1">
                          <div className="w-16 text-xs flex items-center text-[#546E5C]">{slot.time}</div>
                          {WEEKDAYS.map(day => {
                            const hasSlot = (member.schedule[day.id] || []).includes(slot.id);
                            return (
                              <div
                                key={`${day.id}-${slot.id}`}
                                className="flex-1 h-8 rounded"
                                style={{ backgroundColor: hasSlot ? '#8bd7c7' : '#f5f5f5' }}
                              />
                            );
                          })}
                        </div>
                      );
                    })}
                    {member.schedule_notes && (
                      <div className="mt-4 p-3 bg-[#f0faf4] rounded-lg text-sm text-[#1e6b4e]">
                        <span className="font-semibold">Note:</span> {member.schedule_notes}
                      </div>
                    )}
                  </>
                ) : (
                  /* Day pills — simple view */
                  <>
                    <div className="flex gap-2 mb-3">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => {
                        const dayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
                        const isActive = member.availability_days.map((d: string) => d.toLowerCase()).includes(dayKeys[idx]);
                        return (
                          <div
                            key={day}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-semibold transition-colors ${isActive
                              ? 'bg-[#1e6b4e] text-white'
                              : 'bg-gray-100 text-gray-300'
                              }`}
                          >
                            {day.substring(0, 2)}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                {/* Schedule summary */}
                <p className="text-sm text-[#546E5C]">
                  {member.availability_days.length === 7 ? 'Available all week' :
                    member.availability_days.length === 5 && ['mon', 'tue', 'wed', 'thu', 'fri'].every((d: string) => member.availability_days.map((ad: string) => ad.toLowerCase()).includes(d)) ? 'Weekdays (Mon-Fri)' :
                      `${member.availability_days.length} days per week`}
                  {member.schedule_flexible && ' · Flexible schedule'}
                </p>
              </>
            ) : (
              <p className="text-sm text-[#546E5C] italic">Schedule not yet set</p>
            )}
          </div>

          {/* ===== CARE TYPES ===== */}
          {member.care_types && member.care_types.length > 0 && (
            <div className="bg-white rounded-[20px] p-6 border border-[#8bd7c7]/20 shadow-sm">
              <h3 className="text-base font-bold text-[#1e6b4e] mb-3">Looking For</h3>
              <div className="flex flex-wrap gap-2">
                {member.care_types.map(ct => (
                  <span key={ct} className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[#d8f5e5] text-[#1e6b4e] capitalize">
                    {ct.replace(/-/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ===== LANGUAGES ===== */}
          {isConnected && member.languages && member.languages.length > 0 && (
            <div className="bg-white rounded-[20px] p-6 border border-[#8bd7c7]/20 shadow-sm">
              <h3 className="text-base font-bold text-[#1e6b4e] mb-3">Languages</h3>
              <div className="flex flex-wrap gap-2">
                {member.languages.map(lang => (
                  <div key={lang} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f0faf4] border border-[#8bd7c7]/15 text-sm text-[#546E5C]">
                    <Globe className="w-3.5 h-3.5 text-[#1e6b4e]" />
                    {lang}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===== PREFERENCES & LIFESTYLE ===== */}
          {isConnected && (
            <div className="bg-white rounded-[20px] p-6 border border-[#8bd7c7]/20 shadow-sm">
              <h3 className="text-base font-bold text-[#1e6b4e] mb-4">Preferences & Lifestyle</h3>
              {(() => {
                const prefs = [
                  { val: member.smoke_free_required, icon: Wind, label: 'Smoke-free environment' },
                  { val: member.comfortable_with_pets, icon: PawPrint, label: 'Comfortable with pets' },
                  { val: member.available_overnight, icon: Moon, label: 'Available overnight' },
                  { val: member.has_transportation, icon: Car, label: 'Has transportation' },
                  { val: member.can_lift_30lbs, icon: Dumbbell, label: 'Can lift 30+ lbs' },
                  { val: member.comfortable_with_stairs, icon: Dumbbell, label: 'Comfortable with stairs' },
                  { val: member.transportation_required, icon: Car, label: 'Own transportation' },
                  { val: member.willing_to_travel, icon: MapPin, label: 'Willing to travel' },
                ].filter(p => p.val);

                if (prefs.length === 0) {
                  return <p className="text-sm text-[#546E5C] italic">No specific preferences listed.</p>;
                }

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {prefs.map((pref, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-[#546E5C]">
                        <pref.icon className="w-4 h-4 text-[#1e6b4e]" />
                        <span>{pref.label}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* ===== HOME DETAILS (connected only) ===== */}
          {isConnected && (member.has_stairs || member.has_parking || member.has_yard || member.has_pool || member.has_pets || member.home_type) && (
            <div className="bg-white rounded-[20px] p-6 border border-[#8bd7c7]/20 shadow-sm">
              <h3 className="text-base font-bold text-[#1e6b4e] mb-4">Home Details</h3>

              {member.home_type && (
                <p className="text-sm text-[#546E5C] mb-3 capitalize">
                  {member.home_type.replace(/-/g, ' ')}
                </p>
              )}

              <div className="grid grid-cols-2 gap-2">
                {member.has_parking && (
                  <div className="flex items-center gap-2 text-sm text-[#546E5C]">
                    <Car className="w-4 h-4 text-[#1e6b4e]" />
                    <span>Parking available</span>
                  </div>
                )}
                {member.has_stairs && (
                  <div className="flex items-center gap-2 text-sm text-[#546E5C]">
                    <Dumbbell className="w-4 h-4 text-[#1e6b4e]" />
                    <span>Has stairs</span>
                  </div>
                )}
                {member.has_yard && (
                  <div className="flex items-center gap-2 text-sm text-[#546E5C]">
                    <MapPin className="w-4 h-4 text-[#1e6b4e]" />
                    <span>Outdoor space</span>
                  </div>
                )}
                {member.has_pool && (
                  <div className="flex items-center gap-2 text-sm text-[#546E5C]">
                    <Star className="w-4 h-4 text-[#1e6b4e]" />
                    <span>Pool</span>
                  </div>
                )}
                {member.has_pets && (
                  <div className="flex items-center gap-2 text-sm text-[#546E5C]">
                    <PawPrint className="w-4 h-4 text-[#1e6b4e]" />
                    <span>Pets in home{member.pet_types && member.pet_types.length > 0 ? ` (${member.pet_types.join(', ')})` : ''}</span>
                  </div>
                )}
              </div>

              {member.home_allergies && member.home_allergies.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <p className="text-xs font-semibold text-[#92400E] uppercase tracking-wide mb-2 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Household Allergies
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {member.home_allergies.map((allergy: string) => (
                      <span
                        key={allergy}
                        className="px-2 py-0.5 rounded-full text-xs bg-[#FEF3C7] text-[#92400E] font-medium"
                      >
                        {allergy}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {member.home_notes && (
                <p className="text-sm text-[#546E5C] mt-3 italic">{member.home_notes}</p>
              )}
            </div>
          )}

          {/* ===== CHILDREN ===== */}
          <div className="bg-white rounded-[20px] p-6 border border-[#8bd7c7]/20 shadow-sm">
            <h3 className="text-base font-bold text-[#1e6b4e] mb-4">Children</h3>
            {(member.num_kids > 0 || member.kids.length > 0) ? (
              !isConnected && user?.id !== member.id ? (
                /* Public view */
                <div className="flex flex-col gap-1">
                  <span className="text-lg font-semibold text-[#1e6b4e]">
                    {member.num_kids} {member.num_kids === 1 ? 'Child' : 'Children'}
                  </span>
                  {member.children_age_groups && member.children_age_groups.length > 0 && (
                    <span className="text-sm text-[#546E5C]">
                      Age Groups: {member.children_age_groups.join(', ')}
                    </span>
                  )}
                </div>
              ) : (
                /* Connected view — warm cards */
                <div className="flex flex-wrap gap-3">
                  {member.kids.map(kid => {
                    const name = kid.first_name || kid.name || 'Child';
                    const age = kid.birth_year
                      ? (() => {
                        const now = new Date();
                        const ageMonths = (now.getFullYear() - kid.birth_year) * 12 + (now.getMonth() - ((kid.birth_month || 1) - 1));
                        if (ageMonths < 0) return null;
                        if (ageMonths < 12) return `${ageMonths}mo`;
                        const years = Math.floor(ageMonths / 12);
                        return years === 1 ? '1 year' : `${years} years`;
                      })()
                      : null;
                    return (
                      <div
                        key={kid.id}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#f0faf4] border border-[#8bd7c7]/15"
                      >
                        <div className="w-8 h-8 rounded-full bg-[#d8f5e5] flex items-center justify-center">
                          <span className="text-sm font-bold text-[#1e6b4e]">
                            {name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#1e6b4e]">{name}</p>
                          {age && <p className="text-xs text-[#546E5C]">{age}</p>}
                        </div>
                      </div>
                    );
                  })}
                  {member.kids.length === 0 && member.num_kids > 0 && (
                    <span className="text-sm text-[#546E5C]">
                      {member.num_kids} {member.num_kids === 1 ? 'child' : 'children'}
                    </span>
                  )}
                </div>
              )
            ) : (
              member.role !== 'caregiver' ? (
                <p className="text-sm text-[#546E5C] italic">No children listed yet</p>
              ) : (
                <p className="text-sm text-[#546E5C] italic">Not applicable</p>
              )
            )}
          </div>

          {/* ===== PRIVACY NOTE (Not Connected) ===== */}
          {!isConnected && user?.id !== member.id && (
            <div className="bg-white/80 rounded-[20px] p-5 border border-[#8bd7c7]/20">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-[#F8C3B3] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                <p className="text-sm text-[#546E5C]">
                  <strong className="text-[#1e6b4e]">Connect to see more:</strong> Kids' names, detailed schedules, preferences, and contact info are shared once you connect.
                </p>
              </div>
            </div>
          )}

          {/* ===== ACTION BUTTONS ===== */}
          <div className="bg-white rounded-[20px] p-6 border border-[#8bd7c7]/20 shadow-sm">
            {connectionStatus === 'pending' ? (
              <>
                {incomingRequest ? (
                  <div className="flex flex-col gap-3">
                    <div className="bg-[#FFF7ED] border border-[#F8C3B3] rounded-xl p-4 text-center mb-1">
                      <p className="text-[15px] font-semibold text-[#1e6b4e]">
                        {member.first_name} asked to join your village
                      </p>
                      <p className="text-[13px] text-[#546E5C] mt-1">
                        Accept to share full profiles and start messaging
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handleAccept}
                        disabled={connecting}
                        className="flex-1 py-3 rounded-full font-bold text-white bg-[#1e6b4e] hover:bg-[#174f3a] transition-all disabled:opacity-50"
                      >
                        {connecting ? '...' : 'Welcome In'}
                      </button>
                      <button
                        onClick={handleDecline}
                        disabled={connecting}
                        className="flex-1 py-3 rounded-full font-bold bg-white border border-gray-200 text-[#546E5C] hover:bg-gray-50 transition-all disabled:opacity-50"
                      >
                        Skip
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="w-full py-4 rounded-full bg-[#d8f5e5] text-center">
                    <span className="font-semibold text-[#1e6b4e]">Connection request sent</span>
                  </div>
                )}
              </>
            ) : connectionStatus === 'accepted' ? (
              <div className="flex gap-3">
                <Link
                  to={`/profile/${member.id}`}
                  className="flex-1 py-3 rounded-full border border-[#8bd7c7]/30 text-center text-sm font-semibold text-[#1e6b4e] hover:bg-[#d8f5e5]/50 transition-colors"
                >
                  View Full Profile
                </Link>
                <Link
                  to={`/messages?to=${member.id}`}
                  className="flex-1 py-3 rounded-full bg-[#1e6b4e] text-white text-center text-sm font-semibold hover:bg-[#174f3a] transition-colors"
                >
                  Message {member.first_name}
                </Link>
              </div>
            ) : (
              <>
                <button
                  onClick={handleConnect}
                  disabled={connecting || !user}
                  className="w-full py-4 rounded-full font-bold text-lg bg-[#1e6b4e] text-white shadow-sm hover:shadow-md hover:bg-[#174f3a] transition-all disabled:opacity-50"
                >
                  {connecting ? 'Sending Request...' : 'Request to Chat'}
                </button>
                <p className="text-xs text-center mt-3 text-[#546E5C] opacity-80">
                  Start a conversation to see if it's a fit. No commitment.
                </p>
              </>
            )}

            {!user && (
              <p className="text-xs text-center mt-3 text-[#546E5C]">
                <Link to="/login" className="text-[#F8C3B3] font-semibold hover:underline">Log in</Link> to connect
              </p>
            )}

            {/* Endorse Button — only if connected and haven't endorsed yet */}
            {isConnected && !hasEndorsed && user?.id !== member.id && (
              <button
                onClick={() => setShowEndorseForm(!showEndorseForm)}
                className="w-full mt-3 py-2.5 rounded-full border border-[#8bd7c7]/40 text-sm font-semibold text-[#1e6b4e] hover:bg-[#d8f5e5]/50 transition-colors flex items-center justify-center gap-2"
              >
                <Star className="w-4 h-4" />
                Endorse {member.first_name}
              </button>
            )}

            {/* Already Endorsed Badge */}
            {isConnected && hasEndorsed && (
              <div className="w-full mt-3 py-2.5 text-center text-sm text-[#546E5C]">
                You endorsed {member.first_name}
              </div>
            )}
          </div>

          {/* Endorsement Form */}
          {showEndorseForm && (
            <div className="bg-white rounded-[20px] p-6 border border-[#8bd7c7]/20 shadow-sm">
              <h3 className="text-base font-bold text-[#1e6b4e] mb-4">
                Endorse {member.first_name}
              </h3>

              {/* Star Rating */}
              <div className="mb-4">
                <p className="text-sm text-[#546E5C] mb-2">Rating</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setEndorseRating(star)}
                      className="p-1 transition-colors"
                    >
                      <Star
                        className={`w-6 h-6 ${star <= endorseRating
                          ? 'text-[#F59E0B] fill-[#F59E0B]'
                          : 'text-gray-200'
                          }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Relationship */}
              <div className="mb-4">
                <p className="text-sm text-[#546E5C] mb-2">How do you know {member.first_name}?</p>
                <div className="flex flex-wrap gap-2">
                  {['Neighbor', 'Used as caregiver', 'Share a nanny', 'Friend', 'Community member'].map(rel => (
                    <button
                      key={rel}
                      type="button"
                      onClick={() => setEndorseRelationship(rel)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${endorseRelationship === rel
                        ? 'bg-[#1e6b4e] text-white border-[#1e6b4e]'
                        : 'bg-white text-[#546E5C] border-gray-200 hover:border-[#8bd7c7]'
                        }`}
                    >
                      {rel}
                    </button>
                  ))}
                </div>
              </div>

              {/* Written Endorsement */}
              <div className="mb-4">
                <p className="text-sm text-[#546E5C] mb-2">Your recommendation (optional)</p>
                <textarea
                  value={endorseText}
                  onChange={e => setEndorseText(e.target.value)}
                  placeholder={`What makes ${member.first_name} a great member of your village?`}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-[#546E5C] placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1e6b4e] focus:border-transparent resize-none"
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-gray-400 mt-1 text-right">{endorseText.length}/500</p>
              </div>

              {/* Submit */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowEndorseForm(false)}
                  className="flex-1 py-2.5 rounded-full border border-gray-200 text-sm font-medium text-[#546E5C] hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleEndorse}
                  disabled={endorseSaving || endorseRating === 0}
                  className="flex-1 py-2.5 rounded-full bg-[#1e6b4e] text-white text-sm font-semibold hover:bg-[#174f3a] disabled:opacity-50 transition-colors"
                >
                  {endorseSaving ? 'Submitting...' : 'Submit Endorsement'}
                </button>
              </div>
            </div>
          )}

          {/* Endorsements from Village */}
          {endorsements.length > 0 && (
            <div className="bg-white rounded-[20px] p-6 border border-[#8bd7c7]/20 shadow-sm">
              <h3 className="text-base font-bold text-[#1e6b4e] mb-4">
                What Others Say
              </h3>
              <div className="space-y-4">
                {endorsements.map((e: any) => {
                  const author = Array.isArray(e.author) ? e.author[0] : e.author;
                  const authorName = author ? `${author.first_name} ${(author.last_name || '').charAt(0)}.` : 'Member';
                  return (
                    <div key={e.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#d8f5e5] flex items-center justify-center flex-shrink-0">
                        {author?.avatar_url ? (
                          <img src={author.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold text-[#1e6b4e]">{authorName.charAt(0)}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-[#1e6b4e]">{authorName}</span>
                          {e.relationship && (
                            <span className="text-xs text-[#546E5C]">· {e.relationship}</span>
                          )}
                        </div>
                        {e.rating && (
                          <div className="flex gap-0.5 mb-1">
                            {[1, 2, 3, 4, 5].map((s: number) => (
                              <Star key={s} className={`w-3 h-3 ${s <= e.rating ? 'text-[#F59E0B] fill-[#F59E0B]' : 'text-gray-200'}`} />
                            ))}
                          </div>
                        )}
                        {e.text && (
                          <p className="text-sm text-[#546E5C] leading-relaxed">{e.text}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  )
}