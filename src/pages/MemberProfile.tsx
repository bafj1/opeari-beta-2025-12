import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Star, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useViewer } from '../hooks/useViewer'
import { supabase } from '../lib/supabase'
import Toast from '../components/ui/Toast'
import { logAlphaEvent } from '../lib/analytics'
import { createNotification } from '../lib/notifications'


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
  const [endorseRelationship, setEndorseRelationship] = useState<string[]>([])
  const [endorseSaving, setEndorseSaving] = useState(false)
  const [hasEndorsed, setHasEndorsed] = useState(false)
  const [existingEndorsement, setExistingEndorsement] = useState<any>(null)

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
            .select('id, rating, text, relationship')
            .eq('author_id', user.id)
            .eq('recipient_id', id)
            .maybeSingle();
          if (myEndorsement) {
            setHasEndorsed(true);
            setExistingEndorsement(myEndorsement);
          }
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
      if (hasEndorsed && existingEndorsement) {
        // UPDATE existing
        const { error } = await supabase
          .from('endorsements')
          .update({
            rating: endorseRating,
            text: endorseText.trim(),
            relationship: endorseRelationship,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingEndorsement.id);
        if (error) throw error;
        setToast({ message: 'Endorsement updated!', type: 'success' });
      } else {
        // INSERT new
        const { error } = await supabase.from('endorsements').insert({
          author_id: user.id,
          recipient_id: member.id,
          rating: endorseRating,
          text: endorseText.trim(),
          relationship: endorseRelationship,
        });
        if (error) throw error;
        setToast({ message: 'Endorsement submitted!', type: 'success' });
      }
      setHasEndorsed(true);
      setShowEndorseForm(false);
      setTimeout(() => setToast(null), 3000);
      loadMember(); // Refresh data
    } catch (err: any) {
      console.error('Endorse error:', err);
      setToast({ message: 'Could not save endorsement.', type: 'error' });
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



  const isConnected = connectionStatus === 'accepted';

  // Role-aware colors
  const isCaregiver = member.role === 'caregiver';
  const accentDark = isCaregiver ? '#9B4D3A' : COLORS.primary;
  const badgeBg = isCaregiver ? COLORS.coral : COLORS.mint;

  // Schedule overlap
  const viewerDays = (viewer?.member?.availability_days || []).map((d: string) => d.toLowerCase());
  const memberDays = (member.availability_days || []).map((d: string) => d.toLowerCase());
  const overlapDays = viewerDays.filter((d: string) => memberDays.includes(d));
  const DAY_MAP = [
    { key: 'mon', label: 'M', full: 'Mon' },
    { key: 'tue', label: 'T', full: 'Tue' },
    { key: 'wed', label: 'W', full: 'Wed' },
    { key: 'thu', label: 'T', full: 'Thu' },
    { key: 'fri', label: 'F', full: 'Fri' },
    { key: 'sat', label: 'S', full: 'Sat' },
    { key: 'sun', label: 'S', full: 'Sun' },
  ];

  const signals = computeCompatibility() || [];

  return (
    <>
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} duration={3000} />
      )}
      <div className="min-h-screen" style={{ background: '#f0faf4', fontFamily: 'Comfortaa, sans-serif' }}>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '24px 16px' }}>

          {/* Back Link */}
          <Link
            to="/village"
            className="inline-flex items-center gap-1 text-sm hover:underline"
            style={{ color: COLORS.textMuted, marginBottom: 16, display: 'inline-flex' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>

          {/* ===== MAIN CARD ===== */}
          <div style={{ background: '#fff', borderRadius: 24, border: `2px solid ${COLORS.mintDark}20`, overflow: 'hidden' }}>

            {/* Hero — gradient + avatar + name */}
            <div style={{
              background: isCaregiver
                ? 'linear-gradient(135deg, #FFF0EB 0%, #F8C3B3 50%, #FFE4D6 100%)'
                : 'linear-gradient(135deg, #d8f5e5 0%, #8bd7c7 50%, rgba(248,195,179,0.15) 100%)',
              padding: '28px 24px 20px',
            }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                {/* Avatar */}
                <div style={{
                  width: 72, height: 72, borderRadius: '50%', background: '#fff',
                  border: '3px solid #fff', boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, overflow: 'hidden',
                }}>
                  {(member.avatar_url || member.photo_url) ? (
                    <img src={member.avatar_url || member.photo_url} alt={member.first_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: COLORS.mint, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 28, fontWeight: 700, color: COLORS.primary }}>{(member.first_name || '?').charAt(0)}</span>
                    </div>
                  )}
                </div>

                {/* Name + meta */}
                <div style={{ flex: 1 }}>
                  <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: COLORS.primary, fontFamily: 'Comfortaa, sans-serif' }}>
                    {isCaregiver ? member.first_name : `${member.first_name}'s Family`}
                  </h1>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 20, background: badgeBg, color: accentDark }}>
                      {isCaregiver ? 'Caregiver' : member.role === 'both' ? 'Parent & Caregiver' : 'Parent'}
                    </span>
                    {(member.neighborhood || member.zip_code) && (
                      <span style={{ fontSize: 12, color: COLORS.textMuted }}>{member.neighborhood || member.zip_code}</span>
                    )}
                    {member.timeline === 'asap' && (
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#FEF3C7', color: '#92400E' }}>ASAP</span>
                    )}
                  </div>
                  {endorsementCount > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
                      <Star className="w-3.5 h-3.5 text-[#F59E0B] fill-[#F59E0B]" />
                      <span style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: 600 }}>
                        {endorsementCount} endorsement{endorsementCount !== 1 ? 's' : ''}{avgRating > 0 ? ` · ${avgRating} avg` : ''}
                      </span>
                    </div>
                  )}
                  {member.vetting_status === 'verified' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#1e6b4e]" />
                      <span style={{ fontSize: 11, fontWeight: 600, color: COLORS.primary }}>Verified</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Content */}
            <div style={{ padding: '20px 24px 24px' }}>

              {/* Quick stats row */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {[
                  { n: connectionCount, label: 'Connections' },
                  { n: mutualCount, label: 'Mutual' },
                  { n: overlapDays.length, label: 'Days Overlap' },
                ].map((stat, i) => (
                  <div key={i} style={{ flex: 1, textAlign: 'center', padding: '10px 0', borderRadius: 12, background: '#f0faf4', border: `1px solid ${COLORS.mintDark}15` }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.primary }}>{stat.n}</div>
                    <div style={{ fontSize: 10, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 500 }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Why You Match */}
              {signals.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.primary, marginBottom: 8 }}>Why You Might Be a Good Fit</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {signals.map((signal: any, i: number) => (
                      <span key={i} style={{ fontSize: 12, color: COLORS.textMuted, background: '#f0faf4', padding: '5px 12px', borderRadius: 20, border: `1px solid ${COLORS.mintDark}20` }}>
                        {signal.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Bio — 3 lines max */}
              {member.bio && (
                <p style={{
                  fontSize: 13, color: COLORS.textMuted, lineHeight: 1.5, marginBottom: 20,
                  display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden',
                }}>
                  {member.bio.startsWith('Looking for:')
                    ? `Looking for ${humanizeCareType(member.bio.replace('Looking for: ', '').trim())}`
                    : member.bio}
                </p>
              )}

              {/* Schedule Overlap */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.primary, marginBottom: 10 }}>Schedule Overlap</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {DAY_MAP.map((day) => {
                    const theyAvailable = memberDays.includes(day.key);
                    const youAvailable = viewerDays.includes(day.key);
                    const isOverlap = theyAvailable && youAvailable;
                    const theyOnly = theyAvailable && !youAvailable;
                    return (
                      <div key={day.key} style={{ flex: 1, textAlign: 'center' }}>
                        <div
                          style={{
                            width: 36, height: 36, borderRadius: '50%', margin: '0 auto 4px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 12, fontWeight: 600,
                            background: isOverlap ? COLORS.primary : theyOnly ? `${COLORS.mintDark}40` : '#f5f5f5',
                            color: isOverlap ? '#fff' : theyOnly ? COLORS.primary : '#ccc',
                            border: theyOnly ? `2px dashed ${COLORS.mintDark}` : 'none',
                          }}
                          aria-label={`${day.full}${isOverlap ? ' - both available' : theyOnly ? ' - they are available' : ''}`}
                        >
                          {day.label}
                        </div>
                        <div style={{ fontSize: 9, color: COLORS.textMuted }}>{day.full}</div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 10, color: COLORS.textMuted }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS.primary }} />
                    Both available
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: `${COLORS.mintDark}40`, border: `1.5px dashed ${COLORS.mintDark}` }} />
                    They're available
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f5f5f5' }} />
                    Neither
                  </div>
                </div>
              </div>

              {/* Services / Looking For */}
              {member.care_types && member.care_types.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.primary, marginBottom: 8 }}>
                    {isCaregiver ? 'Services Offered' : 'Looking For'}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {member.care_types.map((ct: string, i: number) => (
                      <span key={i} style={{
                        fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 20,
                        background: isCaregiver ? `${COLORS.coral}30` : COLORS.mint,
                        color: accentDark,
                      }}>
                        {ct.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Divider */}
              <div style={{ borderTop: `1px solid ${COLORS.mintDark}20`, margin: '0 -24px', padding: '0 24px' }} />

              {/* CTA buttons */}
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                {connectionStatus === 'pending' ? (
                  <>
                    {incomingRequest ? (
                      <>
                        <button
                          onClick={handleAccept}
                          disabled={connecting}
                          style={{
                            flex: 1, padding: '13px 0', borderRadius: 14, border: 'none', cursor: 'pointer',
                            background: COLORS.primary, color: '#fff', fontSize: 14, fontWeight: 700,
                            fontFamily: 'Comfortaa, sans-serif', opacity: connecting ? 0.5 : 1,
                          }}
                        >
                          {connecting ? '...' : 'Welcome In'}
                        </button>
                        <button
                          onClick={handleDecline}
                          disabled={connecting}
                          style={{
                            flex: 1, padding: '13px 0', borderRadius: 14, cursor: 'pointer',
                            fontFamily: 'Comfortaa, sans-serif', background: 'transparent',
                            color: COLORS.textMuted, border: '1.5px solid #e5e7eb',
                            fontSize: 14, fontWeight: 600, opacity: connecting ? 0.5 : 1,
                          }}
                        >
                          Skip
                        </button>
                      </>
                    ) : (
                      <div style={{ flex: 1, padding: '13px 0', borderRadius: 14, background: '#f0faf4', textAlign: 'center' }}>
                        <span style={{ fontWeight: 600, color: COLORS.primary, fontSize: 14 }}>Connection request sent</span>
                      </div>
                    )}
                  </>
                ) : isConnected ? (
                  <>
                    <Link
                      to={`/messages?to=${member.id}`}
                      style={{
                        flex: 1, padding: '13px 0', borderRadius: 14, border: 'none',
                        textDecoration: 'none', textAlign: 'center',
                        background: COLORS.primary, color: '#fff', fontSize: 14, fontWeight: 700,
                        fontFamily: 'Comfortaa, sans-serif',
                      }}
                    >
                      Message {member.first_name}
                    </Link>
                    <Link
                      to={`/profile/${member.id}`}
                      style={{
                        flex: 1, padding: '13px 0', borderRadius: 14,
                        textDecoration: 'none', textAlign: 'center',
                        fontFamily: 'Comfortaa, sans-serif',
                        background: isCaregiver ? COLORS.coral : 'transparent',
                        color: isCaregiver ? '#9B4D3A' : COLORS.primary,
                        border: isCaregiver ? 'none' : `1.5px solid ${COLORS.mintDark}50`,
                        fontSize: 14, fontWeight: 600,
                      }}
                    >
                      Full Profile
                    </Link>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleConnect}
                      disabled={connecting || !user}
                      style={{
                        flex: 1, padding: '13px 0', borderRadius: 14, border: 'none',
                        cursor: connecting ? 'wait' : 'pointer',
                        background: COLORS.primary, color: '#fff', fontSize: 14, fontWeight: 700,
                        fontFamily: 'Comfortaa, sans-serif', opacity: connecting ? 0.5 : 1,
                      }}
                    >
                      {connecting ? 'Sending...' : 'Request to Chat'}
                    </button>
                    <button
                      disabled
                      style={{
                        flex: 1, padding: '13px 0', borderRadius: 14, cursor: 'default',
                        fontFamily: 'Comfortaa, sans-serif', background: 'transparent',
                        color: COLORS.primary, border: `1.5px solid ${COLORS.mintDark}50`,
                        fontSize: 14, fontWeight: 600,
                      }}
                    >
                      View Profile
                    </button>
                  </>
                )}
              </div>

              {/* Endorse / Edit */}
              {isConnected && user?.id !== member.id && (
                <button
                  onClick={() => {
                    if (hasEndorsed && existingEndorsement) {
                      setEndorseRating(existingEndorsement.rating || 0);
                      setEndorseText(existingEndorsement.text || '');
                      setEndorseRelationship(existingEndorsement.relationship || []);
                    }
                    setShowEndorseForm(!showEndorseForm);
                  }}
                  style={{
                    width: '100%', marginTop: 12, padding: '10px 0', borderRadius: 14,
                    border: `1px solid ${COLORS.mintDark}30`, background: 'transparent',
                    color: COLORS.primary, fontSize: 13, fontWeight: 600,
                    fontFamily: 'Comfortaa, sans-serif', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}
                >
                  <Star className="w-4 h-4" />
                  {hasEndorsed ? 'Edit Your Endorsement' : `Endorse ${member.first_name}`}
                </button>
              )}

              {/* Privacy note */}
              {!isConnected && !user && (
                <p style={{ fontSize: 11, color: COLORS.textMuted, textAlign: 'center', marginTop: 12, opacity: 0.7 }}>
                  <Link to="/login" style={{ color: COLORS.coral, fontWeight: 600, textDecoration: 'none' }}>Log in</Link> to connect
                </p>
              )}
              {!isConnected && user && user.id !== member.id && (
                <p style={{ fontSize: 11, color: COLORS.textMuted, textAlign: 'center', marginTop: 12, opacity: 0.7 }}>
                  Connect to see detailed schedule, contact info, and endorsements
                </p>
              )}
            </div>
          </div>

          {/* Endorsement Form */}
          {showEndorseForm && (
            <div style={{ background: '#fff', borderRadius: 20, padding: 24, marginTop: 16, border: `2px solid ${COLORS.mintDark}20` }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: COLORS.primary, marginBottom: 16 }}>
                {hasEndorsed ? 'Edit Your Endorsement' : `Endorse ${member.first_name}`}
              </h3>

              {/* Stars */}
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 8 }}>Rating</p>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <button key={star} type="button" onClick={() => setEndorseRating(star)} style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer' }}>
                      <Star className={`w-6 h-6 ${star <= endorseRating ? 'text-[#F59E0B] fill-[#F59E0B]' : 'text-gray-200'}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Relationship multi-select */}
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 8 }}>How do you know {member.first_name}? (select all)</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {['Neighbor', 'Used as caregiver', 'Share a nanny', 'Friend', 'Community member', 'Coworker', 'Family friend'].map(rel => {
                    const isSelected = endorseRelationship.includes(rel);
                    return (
                      <button
                        key={rel}
                        type="button"
                        onClick={() => setEndorseRelationship((prev: string[]) => isSelected ? prev.filter((r: string) => r !== rel) : [...prev, rel])}
                        style={{
                          padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                          fontFamily: 'Comfortaa, sans-serif',
                          background: isSelected ? COLORS.primary : '#fff',
                          color: isSelected ? '#fff' : COLORS.textMuted,
                          border: isSelected ? `1.5px solid ${COLORS.primary}` : '1.5px solid #e5e7eb',
                        }}
                      >
                        {rel}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Text */}
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 8 }}>Your recommendation (optional)</p>
                <textarea
                  value={endorseText}
                  onChange={e => setEndorseText(e.target.value)}
                  placeholder={`What makes ${member.first_name} a great member of your village?`}
                  style={{
                    width: '100%', padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: 12,
                    fontSize: 13, color: COLORS.textMuted, fontFamily: 'Comfortaa, sans-serif', resize: 'none', outline: 'none',
                  }}
                  rows={3}
                  maxLength={500}
                />
                <p style={{ fontSize: 11, color: '#aaa', marginTop: 4, textAlign: 'right' }}>{endorseText.length}/500</p>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowEndorseForm(false)}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 14, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                    fontFamily: 'Comfortaa, sans-serif', background: 'transparent', color: COLORS.textMuted, border: '1.5px solid #e5e7eb',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleEndorse}
                  disabled={endorseSaving || endorseRating === 0}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 14, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    fontFamily: 'Comfortaa, sans-serif', background: COLORS.primary, color: '#fff', border: 'none',
                    opacity: (endorseSaving || endorseRating === 0) ? 0.5 : 1,
                  }}
                >
                  {endorseSaving ? 'Saving...' : hasEndorsed ? 'Update Endorsement' : 'Submit Endorsement'}
                </button>
              </div>
            </div>
          )}

          {/* Endorsements from Village */}
          {endorsements.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 20, padding: 24, marginTop: 16, border: `2px solid ${COLORS.mintDark}20` }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: COLORS.primary, marginBottom: 16 }}>What Others Say</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {endorsements.map((e: any) => {
                  const author = Array.isArray(e.author) ? e.author[0] : e.author;
                  const authorName = author ? `${author.first_name} ${(author.last_name || '').charAt(0)}.` : 'Member';
                  return (
                    <div key={e.id} style={{ display: 'flex', gap: 12 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%', background: COLORS.mint,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden',
                      }}>
                        {author?.avatar_url ? (
                          <img src={author.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                        ) : (
                          <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.primary }}>{authorName.charAt(0)}</span>
                        )}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.primary }}>{authorName}</span>
                          {e.relationship && (
                            <span style={{ fontSize: 11, color: COLORS.textMuted }}>
                              · {Array.isArray(e.relationship) ? e.relationship.join(', ') : e.relationship}
                            </span>
                          )}
                        </div>
                        {e.rating && (
                          <div style={{ display: 'flex', gap: 2, marginBottom: 4 }}>
                            {[1, 2, 3, 4, 5].map((s: number) => (
                              <Star key={s} className={`w-3 h-3 ${s <= e.rating ? 'text-[#F59E0B] fill-[#F59E0B]' : 'text-gray-200'}`} />
                            ))}
                          </div>
                        )}
                        {e.text && <p style={{ fontSize: 13, color: COLORS.textMuted, lineHeight: 1.5 }}>{e.text}</p>}
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
