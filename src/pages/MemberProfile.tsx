import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Star, Calendar, MapPin, Globe, Sparkles, Baby, Car, Handshake, Wind, PawPrint, CircleParking } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useViewer } from '../hooks/useViewer'
import { supabase } from '../lib/supabase'
import Header from '../components/common/Header'
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
  const { viewer } = useViewer()
  const navigate = useNavigate()

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

      // Fetch Endorsements
      try {
        const { data: endorseData } = await supabase
          .from('endorsements')
          .select('rating')
          .eq('recipient_id', id)
          .eq('is_visible', true);
        if (endorseData) {
          setEndorsementCount(endorseData.length);
          const ratings = endorseData.filter((e: any) => e.rating).map((e: any) => e.rating as number);
          if (ratings.length > 0) {
            setAvgRating(Math.round((ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length) * 10) / 10);
          }
        }
      } catch { /* endorsements table might not exist yet */ }

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
  const isConnected = connectionStatus === 'accepted';

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
            to="/village"
            style={{ color: COLORS.textMuted }}
            className="inline-flex items-center gap-1 text-sm mb-4 hover:underline"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Village
          </Link>

          {/* Main Card */}
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: COLORS.cream, border: `1px solid ${COLORS.mintDark} ` }}>

            {/* Header Section */}
            <div className="p-6" style={{ borderBottom: `1px solid ${COLORS.mintDark} ` }}>
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0" style={{ backgroundColor: COLORS.mint }}>
                  {(member.avatar_url || member.photo_url) ? (
                    <img src={member.avatar_url || member.photo_url} alt={member.first_name} className="w-full h-full object-cover" />
                  ) : (
                    <span style={{ color: COLORS.primary }} className="text-3xl font-bold">
                      {member.first_name?.charAt(0)}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h1 style={{ color: COLORS.primary }} className="text-2xl font-bold">
                      {member.role === 'caregiver'
                        ? `${member.first_name} ${member.first_name ? 'G.' : ''} `
                        : `${member.first_name} 's Family`
                      }
                    </h1 >
                  </div >
                  <p style={{ color: COLORS.textMuted }} className="mt-1">
                    {member.neighborhood || member.zip_code || 'Location not shared'}
                  </p>

                  <div className="flex flex-wrap gap-2 mt-3">
                    {member.timeline === 'asap' && (
                      <span className="px-3 py-1.5 rounded-full text-sm font-bold bg-[#FEF3C7] text-[#92400E] border border-[#d97706]/20 flex items-center gap-1">
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

                  {/* Endorsement Badge */}
                  {
                    endorsementCount > 0 && (
                      <div className="flex items-center gap-1.5 mt-2" style={{ display: 'inline-flex', padding: '4px 12px', borderRadius: '20px', backgroundColor: COLORS.mint }}>
                        <span style={{ color: '#F59E0B', fontSize: '14px' }}>★</span>
                        <span className="text-xs font-semibold" style={{ color: COLORS.primary }}>
                          {endorsementCount} {endorsementCount === 1 ? 'endorsement' : 'endorsements'}
                        </span>
                        {avgRating > 0 && (
                          <span className="text-xs" style={{ color: COLORS.textMuted }}>· {avgRating} avg</span>
                        )}
                      </div>
                    )
                  }
                </div >
              </div >
            </div >

            {/* STATS BAR */}
            < div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1px',
              backgroundColor: COLORS.mintDark,
              borderBottom: `1px solid ${COLORS.mintDark}`
            }}>
              <div style={{ backgroundColor: COLORS.cream, padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 700, color: COLORS.primary }}>
                  {member.care_types?.length || 0}
                </div>
                <div style={{ fontSize: '11px', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>
                  Care Needs
                </div>
              </div>
              <div style={{ backgroundColor: COLORS.cream, padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 700, color: COLORS.primary }}>
                  {connectionCount}
                </div>
                <div style={{ fontSize: '11px', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>
                  Connections
                </div>
              </div>
              <div style={{ backgroundColor: COLORS.cream, padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 700, color: COLORS.primary }}>
                  {mutualCount}
                </div>
                <div style={{ fontSize: '11px', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>
                  Mutual
                </div>
              </div>
            </div >

            {/* Compatibility Signals (Connected Only) */}
            {
              (() => {
                const signals = computeCompatibility();
                if (!signals || signals.length === 0) return null;
                return (
                  <div className="p-6" style={{ borderBottom: `1px solid ${COLORS.mintDark}`, backgroundColor: 'rgba(139,215,199,0.06)' }}>
                    <h3 style={{ color: COLORS.textMuted }} className="text-sm font-semibold tracking-wide mb-3">
                      Why You Might Be A Good Fit
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {signals.map((signal, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 14px',
                            borderRadius: '20px',
                            backgroundColor: 'white',
                            border: '1px solid rgba(139,215,199,0.4)',
                            fontSize: '13px',
                            color: COLORS.primary,
                            fontWeight: 500,
                          }}
                        >
                          {(() => {
                            const iconMap: Record<string, React.FC<any>> = {
                              'calendar': Calendar,
                              'sparkles': Sparkles,
                              'baby': Baby,
                              'location': MapPin,
                              'language': Globe,
                              'transport': Car,
                              'handshake': Handshake,
                              'smoke-free': Wind,
                              'pets': PawPrint,
                              'parking': CircleParking,
                            };
                            const IconComp = iconMap[signal.icon] || Star;
                            return <IconComp className="w-4 h-4 text-[#1e6b4e] flex-shrink-0" />;
                          })()}
                          {signal.label}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()
            }

            {/* FULL PROFILE CONTENT (Unlocked) */}
            {
              isConnected && (
                <div className="animate-fade-in">

                  {/* Languages */}
                  {member.languages && member.languages.length > 0 && (
                    <div className="p-6" style={{ borderBottom: `1px solid ${COLORS.mintDark}` }}>
                      <h3 style={{ color: COLORS.textMuted }} className="text-sm font-semibold tracking-wide mb-4">
                        Languages
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {member.languages.map(lang => (
                          <div key={lang} className="px-3 py-1 rounded-full bg-white border border-[#E5E7EB] text-sm text-[#374151]">
                            {lang}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Preferences */}
                  <div className="p-6" style={{ borderBottom: `1px solid ${COLORS.mintDark}` }}>
                    <h3 style={{ color: COLORS.textMuted }} className="text-sm font-semibold tracking-wide mb-4">
                      Preferences & Lifestyle
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { key: 'comfortable_with_pets', label: 'Comfortable with pets' },
                        { key: 'smoke_free_required', label: 'Smoke-free environment' },
                        { key: 'transportation_required', label: 'Own transportation' },
                        { key: 'willing_to_travel', label: 'Willing to travel' },
                        { key: 'available_overnight', label: 'Available overnight' },
                      ].map(pref => {
                        // Check if property is true on member object (using any for index access simplicity)
                        const val = (member as any)[pref.key];
                        if (!val) return null;
                        return (
                          <div key={pref.key} className="flex items-center gap-2 text-[#374151] text-sm">
                            <span className="text-[#1E6B4E]">✓</span> {pref.label}
                          </div>
                        )
                      })}
                      {/* If no preferences set */}
                      {!member.comfortable_with_pets && !member.smoke_free_required && !member.transportation_required &&
                        !member.willing_to_travel && !member.available_overnight && (
                          <p className="text-sm text-gray-400 italic">No specific preferences listed.</p>
                        )}
                    </div>
                  </div>

                </div>
              )
            }

            {/* Schedule Section */}
            <div className="p-6" style={{ borderBottom: `1px solid ${COLORS.mintDark}` }}>
              <h3 style={{ color: COLORS.textMuted }} className="text-sm font-semibold tracking-wide mb-4">
                Care Schedule
              </h3>

              {member.availability_days.length > 0 ? (
                <>
                  {(!isConnected && user?.id !== member.id) ||
                    (isConnected && member.schedule && !Object.values(member.schedule).some(slots => Array.isArray(slots) && slots.length > 0)) ? (
                    /* Public View OR Connected with No Data: Day Summary Only (Pills) */
                    <div className="flex gap-2 mb-2">
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
                        // Only show slot rows where *someone* has availability, or show all? 
                        // Show only rows with data to save space, or show all for completeness?
                        // Let's show all for clarity if schedule exists.
                        const hasAnyForSlot = WEEKDAYS.some(d => (member.schedule[d.id] || []).includes(slot.id))
                        if (!hasAnyForSlot) return null

                        return (
                          <div key={slot.id} className="flex gap-1 mb-1">
                            <div className="w-16 text-xs flex items-center leading-none" style={{ color: COLORS.textMuted }}>{slot.time}</div>
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
                      {member.schedule_notes && (
                        <div className="mt-4 p-3 bg-[#f0faf6] rounded-lg text-sm text-[#1E6B4E]">
                          <span className="font-semibold">Note:</span> {member.schedule_notes}
                        </div>
                      )}
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
              <h3 style={{ color: COLORS.textMuted }} className="text-sm font-semibold tracking-wide mb-4">
                Children
              </h3>

              {(member.num_kids > 0 || member.kids.length > 0) ? (
                /* Gating Logic */
                !isConnected && user?.id !== member.id ? (
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
                      const age = kid.birth_year
                        ? (() => {
                          const now = new Date();
                          const birthYear = kid.birth_year;
                          const birthMonth = (kid.birth_month || 1) - 1; // 0-indexed
                          const ageMonths = (now.getFullYear() - birthYear) * 12 + (now.getMonth() - birthMonth);
                          if (ageMonths < 0) return null;
                          if (ageMonths < 12) return `${ageMonths}mo`;
                          return `${Math.floor(ageMonths / 12)}y`;
                        })()
                        : null;
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
                          <div>
                            <span style={{ color: genderColors.text }} className="font-medium mr-2">
                              {name}
                            </span>
                            {age && (
                              <span style={{ color: genderColors.text }} className="text-sm opacity-75">
                                {age}
                              </span>
                            )}
                          </div>
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
            {
              member.bio && (
                <div className="p-6" style={{ borderBottom: `1px solid ${COLORS.mintDark}` }}>
                  <h3 style={{ color: COLORS.textMuted }} className="text-sm font-semibold tracking-wide mb-4">
                    About
                  </h3>
                  <p style={{ color: COLORS.primary }} className="text-sm leading-relaxed">
                    {member.bio?.startsWith('Looking for:')
                      ? `Looking for ${humanizeCareType(member.bio.replace('Looking for: ', '').trim())}`
                      : member.bio
                    }
                  </p>
                </div>
              )
            }

            {/* Privacy Note (Only if NOT connected) */}
            {
              !isConnected && user?.id !== member.id && (
                <div className="p-6" style={{ backgroundColor: `${COLORS.mint}50` }}>
                  <div className="flex items-start gap-3">
                    <svg style={{ color: COLORS.coral }} className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                    <p style={{ color: COLORS.textMuted }} className="text-sm">
                      <strong style={{ color: COLORS.primary }}>Connect to see more:</strong> Kids' names, detailed schedules, preferences, and contact info are shared once you connect.
                    </p>
                  </div>
                </div>
              )
            }

            {/* CTAs */}
            <div className="p-6">
              {/* STATUS: PENDING */}
              {connectionStatus === 'pending' ? (
                <>
                  {incomingRequest ? (
                    <div className="flex flex-col gap-3">
                      <div style={{
                        backgroundColor: '#FFF7ED',
                        border: '1px solid #F8C3B3',
                        borderRadius: '12px',
                        padding: '16px',
                        textAlign: 'center',
                        marginBottom: '12px'
                      }}>
                        <p style={{ fontSize: '15px', fontWeight: 600, color: '#1E6B4E', margin: 0 }}>
                          {member.first_name} asked to join your village
                        </p>
                        <p style={{ fontSize: '13px', color: '#6B7280', margin: '4px 0 0' }}>
                          Accept to share full profiles and start messaging
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={handleAccept}
                          disabled={connecting}
                          className="flex-1 py-3 rounded-xl font-bold text-white shadow-sm transition-all hover:-translate-y-0.5"
                          style={{ backgroundColor: COLORS.primary }}
                        >
                          {connecting ? '...' : 'Welcome In'}
                        </button>
                        <button
                          onClick={handleDecline}
                          disabled={connecting}
                          className="flex-1 py-3 rounded-xl font-bold transition-all bg-white border"
                          style={{ color: COLORS.textMuted, borderColor: '#e5e7eb' }}
                        >
                          Skip
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full py-4 rounded-full text-center" style={{ backgroundColor: COLORS.mint, color: COLORS.primary }}>
                      <span className="font-semibold">Connection request sent</span>
                    </div>
                  )}
                </>
              ) : connectionStatus === 'accepted' ? (
                /* STATUS: ACCEPTED (Dual Buttons) */
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => navigate(`/profile/${member.id}`)}
                    style={{
                      flex: 1,
                      padding: '14px',
                      backgroundColor: '#d8f5e5',
                      border: '2px solid #1E6B4E',
                      color: '#1E6B4E',
                      borderRadius: '12px',
                      fontWeight: 600,
                      fontSize: '15px',
                      cursor: 'pointer'
                    }}
                  >
                    View Full Profile
                  </button>
                  <button
                    onClick={() => navigate(`/messages/${member.id}`)}
                    style={{ flex: 1, padding: '14px', backgroundColor: '#1E6B4E', color: 'white', borderRadius: '12px', fontWeight: 600, fontSize: '15px', cursor: 'pointer' }}
                  >
                    Message {member.first_name}
                  </button>
                </div>
              ) : (
                /* STATUS: NONE (Connect) */
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
          </div >
        </div >
      </div >
    </>
  )
}