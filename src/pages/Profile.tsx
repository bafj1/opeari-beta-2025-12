import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

// --- Shared Components ---

function Card({ children, style = {} }: { children: React.ReactNode, style?: React.CSSProperties }) {
  return (
    <div style={{
      backgroundColor: 'white', borderRadius: '16px', padding: '24px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)', ...style,
    }}>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{
      color: '#1E6B4E', fontSize: '15px', fontWeight: 700,
      margin: '0 0 14px 0', fontFamily: 'Comfortaa, sans-serif',
      textTransform: 'uppercase', letterSpacing: '0.5px',
    }}>
      {children}
    </h3>
  );
}

function Tag({ children, variant = 'teal' }: { children: React.ReactNode, variant?: 'teal' | 'pink' | 'green' | 'gray' }) {
  const styles = {
    teal: { backgroundColor: 'rgba(139,215,199,0.2)', color: '#1E6B4E' },
    pink: { backgroundColor: 'rgba(248,195,179,0.3)', color: '#1E6B4E' },
    green: { backgroundColor: '#1E6B4E', color: 'white' },
    gray: { backgroundColor: '#F3F4F6', color: '#6B7280' },
  };
  return (
    <span style={{
      ...styles[variant],
      padding: '4px 14px', borderRadius: '20px', fontSize: '13px',
      fontWeight: 500, display: 'inline-block', fontFamily: 'Comfortaa, sans-serif',
    }}>
      {children}
    </span>
  );
}

function EmptyState({ message, action }: { message: string, action: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '16px 8px' }}>
      <p style={{ color: '#9CA3AF', fontSize: '14px', margin: '0 0 10px 0', lineHeight: 1.5 }}>{message}</p>
      <Link to="/settings" style={{ color: '#E07A5F', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
        + {action}
      </Link>
    </div>
  );
}

function CollapsedEmptyState({ label, linkText, link }: { label: string, linkText: string, link?: string }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '14px 20px', backgroundColor: 'white', borderRadius: '12px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      <span style={{ color: '#6B7280', fontSize: '14px', fontWeight: 600 }}>{label}</span>
      <Link to={link || "/settings"} style={{ color: '#E07A5F', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
        + {linkText}
      </Link>
    </div>
  );
}

function CheckItem({ checked, label }: { checked: boolean, label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0' }}>
      <div style={{
        width: 20, height: 20, borderRadius: '50%',
        backgroundColor: checked ? '#1E6B4E' : 'transparent',
        border: checked ? 'none' : '2px solid #D1D5DB',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {checked && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
      <span style={{ color: checked ? '#374151' : '#9CA3AF', fontSize: '14px' }}>{label}</span>
    </div>
  );
}

// --- Constants ---

const statusColors: Record<string, string> = { open: '#F8C3B3', covered: '#1E6B4E', closed: '#D1D5DB' };
const statusLabels: Record<string, string> = { open: 'Looking', covered: 'Covered', closed: 'Past' };

const dayAbbr: Record<string, string> = { mon: 'M', tue: 'T', wed: 'W', thu: 'T', fri: 'F', sat: 'S', sun: 'S' };
const dayFull: Record<string, string> = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' };
const allDays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

// --- Main Component ---

export default function Profile() {
  const { id: routeId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [careNeeds, setCareNeeds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'own' | 'public'>('own');
  const [connectionCount, setConnectionCount] = useState(0);
  const [isOwnProfile, setIsOwnProfile] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const targetId = routeId && routeId !== user.id ? routeId : user.id;
      const viewingOther = targetId !== user.id;
      setIsOwnProfile(!viewingOther);

      if (viewingOther) {
        // VIEWING SOMEONE ELSE: Check connection first
        const { data: statusData } = await supabase.rpc('get_connection_status', {
          user_a: user.id,
          user_b: targetId
        });

        if (statusData !== 'accepted') {
          // Not connected — redirect to preview page
          navigate(`/member/${targetId}`, { replace: true });
          return;
        }

        // Connected — fetch from members_connected view
        setViewMode('public'); // Force read-only mode
        const { data, error } = await supabase
          .from('members_connected')
          .select('*')
          .eq('id', targetId)
          .single();

        if (error || !data) {
          navigate(`/member/${targetId}`, { replace: true });
          return;
        }

        setProfile(data);

        // Fetch their care needs
        const { data: needs } = await supabase
          .from('care_needs')
          .select('*')
          .eq('member_id', targetId)
          .eq('is_active', true);
        if (needs) setCareNeeds(needs);

        // Fetch their connection count
        const { data: countData } = await supabase.rpc('get_connection_count', { user_id: targetId });
        setConnectionCount(countData || 0);

      } else {
        // VIEWING OWN PROFILE: Existing logic (unchanged)
        setViewMode('own');
        const { data, error } = await supabase
          .from('members')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!error && data) setProfile(data);

        const { data: needs } = await supabase
          .from('care_needs')
          .select('*')
          .eq('member_id', user.id)
          .eq('is_active', true);
        if (needs) setCareNeeds(needs);

        const { data: countData } = await supabase.rpc('get_connection_count', { user_id: user.id });
        setConnectionCount(countData || 0);
      }

      setLoading(false);
    };
    load();
  }, [routeId]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fffaf5' }}>
        <div style={{ width: 40, height: 40, border: '4px solid #F8C3B3', borderTopColor: '#1E6B4E', borderRadius: '50%', animation: 'spin 1s linear infinite' }}>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#fffaf5', minHeight: '100vh' }}>
        <h2 style={{ color: '#1E6B4E', fontFamily: 'Comfortaa, sans-serif' }}>Profile not found</h2>
        <Link to="/settings" style={{ color: '#E07A5F', fontWeight: 600 }}>Go to Settings</Link>
      </div>
    );
  }

  // Completeness Calculation
  const fields = [
    { done: !!profile.avatar_url, label: "Add a profile photo", link: "/settings#profile" },
    { done: !!profile.bio && profile.bio.length > 10, label: "Write your bio", link: "/settings#profile" },
    { done: profile.languages?.length > 0, label: "Add languages", link: "/settings#profile" },
    { done: profile.children_age_groups?.length > 0, label: "Add children info", link: "/settings#profile" },
    { done: !!profile.phone, label: "Add phone number", link: "/settings#profile" },
    { done: profile.care_types?.length > 0, label: "Set care preferences", link: "/settings#matching" },
    { done: !!profile.instagram_handle || !!profile.linkedin_url, label: "Add social links", link: "/settings#profile" },
  ];
  const completed = fields.filter(f => f.done).length;
  const pct = Math.round((completed / fields.length) * 100);

  // Helper to format role
  const getRoleLabel = (role: string) => {
    if (role === 'family') return 'Parent';
    if (role === 'caregiver') return 'Caregiver';
    if (role === 'both') return 'Parent & Caregiver';
    return 'Member';
  };

  const p = profile;

  // Filter stats for public view
  const statsDataRaw = [
    { label: 'Care Needs', value: careNeeds.length },
    { label: 'Connections', value: connectionCount },
    { label: 'References', value: '—' },
  ];

  const visibleStats = viewMode === 'public'
    ? statsDataRaw.filter(s => s.value !== '—' && s.value !== 0)
    : statsDataRaw;

  // Fix 2: If public view and only care needs has data, maybe show just that. 
  // Spec: "If public view, only show stats with real numeric values." (Done above)
  const showStatsBar = visibleStats.length > 0;

  // Helper for Offer Section visibility
  const hasOffers = p.support_offered?.length > 0;
  const showOfferSection = !((p.role === 'family') && !hasOffers) && (viewMode === 'own' || hasOffers);

  return (
    <div style={{ backgroundColor: '#fffaf5', minHeight: '100vh', fontFamily: 'Comfortaa, sans-serif', paddingBottom: '48px' }}>
      <style>{`
        @media (max-width: 768px) {
          .profile-grid { grid-template-columns: 1fr !important; }
          .profile-header-content { flex-direction: column !important; align-items: center !important; text-align: center; }
          .profile-stats { grid-template-columns: repeat(${Math.max(1, Math.min(3, visibleStats.length))}, 1fr) !important; }
          .profile-availability { flex-direction: column !important; gap: 16px !important; }
          .profile-availability-divider { display: none !important; }
        }
      `}</style>

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '0 16px' }}>

        {/* === SECTION 1: GRADIENT BANNER + HEADER === */}
        {!isOwnProfile && (
          <button
            onClick={() => navigate(-1)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              color: '#4A6163', fontSize: '14px', marginBottom: '12px',
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'Comfortaa, sans-serif',
            }}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        )}
        <div style={{ position: 'relative', marginBottom: '24px' }}>
          {/* Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #1E6B4E 0%, #3a8f72 40%, #8bd7c7 100%)',
            borderRadius: '0 0 20px 20px',
            height: '140px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.06) 0%, transparent 50%)',
            }} />

            {/* View toggle */}
            {isOwnProfile && (
              <div style={{ position: 'absolute', top: 16, right: 20, display: 'flex', gap: '8px' }}>
                <button onClick={() => setViewMode('own')} style={{
                  padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                  border: 'none', cursor: 'pointer', fontFamily: 'Comfortaa',
                  backgroundColor: viewMode === 'own' ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.2)',
                  color: viewMode === 'own' ? '#1E6B4E' : 'white',
                }}>My View</button>
                <button onClick={() => setViewMode('public')} style={{
                  padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                  border: 'none', cursor: 'pointer', fontFamily: 'Comfortaa',
                  backgroundColor: viewMode === 'public' ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.2)',
                  color: viewMode === 'public' ? '#1E6B4E' : 'white',
                }}>Public View</button>
              </div>
            )}
          </div>

          {/* Header Card */}
          <div style={{
            backgroundColor: 'white', borderRadius: '16px',
            padding: '0 32px 28px', marginTop: '-50px', position: 'relative',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginLeft: '16px', marginRight: '16px',
          }}>
            <div className="profile-header-content" style={{ display: 'flex', alignItems: 'flex-end', gap: '20px', flexWrap: 'wrap' }}>
              {/* Avatar */}
              <div style={{
                width: 96, height: 96, borderRadius: '50%',
                border: '4px solid white', overflow: 'hidden',
                backgroundColor: '#e6f4f1', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                marginTop: '-24px', flexShrink: 0,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}>
                {p.avatar_url ? (
                  <img src={p.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '36px', fontWeight: 700, color: '#1E6B4E' }}>{p.first_name?.[0]}</span>
                )}
              </div>

              <div style={{ flex: 1, minWidth: '200px', paddingTop: '28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', width: '100%' }}>
                  <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', flexWrap: 'wrap', gap: '12px' }}>
                      <div>
                        <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#1E6B4E', margin: 0 }}>
                          {p.first_name} {p.privacy_show_full_name ? (p.last_name?.[0] || "") + "." : ""}
                          {viewMode === 'own' && <span style={{ color: '#9CA3AF', fontSize: '16px', fontWeight: 400, marginLeft: '8px' }}>(You)</span>}
                        </h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px', flexWrap: 'wrap', justifyContent: 'inherit' }}>
                          <span style={{
                            backgroundColor: p.role === 'caregiver' ? '#8bd7c7' : '#1E6B4E',
                            color: p.role === 'caregiver' ? '#1E6B4E' : 'white',
                            padding: '3px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                          }}>
                            {getRoleLabel(p.role)}
                          </span>
                          {p.privacy_show_location && (p.neighborhood || p.zip_code) && (
                            <span style={{ color: '#6B7280', fontSize: '14px' }}>{p.neighborhood || p.zip_code}</span>
                          )}
                          <span style={{ color: '#D1D5DB' }}>·</span>
                          <span style={{ color: '#9CA3AF', fontSize: '13px' }}>
                            Since {new Date(p.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                          </span>
                        </div>
                      </div>

                      {/* Header Buttons */}
                      <div style={{ marginTop: '4px' }}>
                        {viewMode === 'own' ? (
                          <Link to="/settings" style={{
                            backgroundColor: '#8bd7c7', color: '#1E6B4E',
                            padding: '10px 24px', borderRadius: '10px', fontWeight: 700,
                            border: 'none', cursor: 'pointer', fontSize: '14px', fontFamily: 'Comfortaa',
                            textDecoration: 'none', display: 'inline-block'
                          }}>
                            Edit Profile
                          </Link>
                        ) : (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => !isOwnProfile && navigate(`/messages/${routeId}`)}
                              style={{
                                backgroundColor: '#1E6B4E', color: 'white',
                                padding: '10px 24px', borderRadius: '10px', fontWeight: 700,
                                border: 'none', cursor: isOwnProfile ? 'default' : 'pointer', fontSize: '14px', fontFamily: 'Comfortaa',
                                opacity: isOwnProfile ? 0.7 : 1,
                              }}
                            >
                              Message
                            </button>
                            {/* Save button — Phase 2 */}
                            {/* <button style={{...}}>Save</button> */}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Verification Badges */}
                    <div style={{ display: 'flex', gap: '16px', marginTop: '10px', flexWrap: 'wrap', justifyContent: 'inherit' }}>
                      {[
                        { verified: true, label: 'Email' },
                        { verified: p.phone_verified, label: 'Phone' },
                      ].filter(v => v.verified).map(v => (
                        <span key={v.label} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#1E6B4E', fontSize: '13px' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="#1E6B4E" stroke="none">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                          </svg>
                          {v.label} Verified
                        </span>
                      ))}

                      {/* Background Check Badge */}
                      {/* Hidden in public view per strict rules "Background Check 'Coming soon' — hide it entirely" */}
                      {(viewMode === 'own') && (
                        <Link to="/settings" style={{
                          textDecoration: 'none',
                          pointerEvents: viewMode === 'own' ? 'auto' : 'none'
                        }}>
                          <span style={{
                            display: 'flex', alignItems: 'center', gap: '5px',
                            backgroundColor: 'rgba(209,213,219,0.3)',
                            padding: '3px 12px', borderRadius: '20px', fontSize: '12px',
                            color: '#9CA3AF', fontWeight: 600,
                          }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            </svg>
                            {viewMode === 'own' ? 'Get Verified' : 'Not Verified'}
                          </span>
                        </Link>
                      )}
                    </div>

                    {/* Bio */}
                    {p.bio ? (
                      <p style={{ color: '#4B5563', fontSize: '14px', lineHeight: 1.6, margin: '14px 0 0', maxWidth: '600px', whiteSpace: 'pre-wrap' }}>
                        {p.bio}
                      </p>
                    ) : viewMode === 'own' ? (
                      <Link to="/settings" style={{ display: 'block', color: '#9CA3AF', fontSize: '14px', margin: '14px 0 0', textDecoration: 'none' }}>
                        + Add a bio to introduce yourself to your village
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* === SECTION 2: STATS BAR === */}
        {showStatsBar && (
          <div className="profile-stats" style={{
            display: 'grid', gridTemplateColumns: `repeat(${visibleStats.length}, 1fr)`, gap: '16px',
            marginBottom: '24px',
          }}>
            {visibleStats.map(stat => (
              <Card key={stat.label} style={{ textAlign: 'center', padding: '16px' }}>
                <div style={{ fontSize: '22px', fontWeight: 700, color: '#1E6B4E' }}>{stat.value}</div>
                <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>{stat.label}</div>
              </Card>
            ))}
          </div>
        )}

        {/* === SECTION 3: CARE NEEDS === */}
        {(careNeeds.length > 0 || viewMode === 'own') && (
          <Card style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <SectionTitle>Care Needs</SectionTitle>
                {viewMode === 'public' && (
                  <p style={{ color: '#6B7280', fontSize: '13px', margin: '-8px 0 0 0' }}>What this family is looking for</p>
                )}
              </div>
              {viewMode === 'own' && (
                <Link to="/settings" style={{
                  backgroundColor: '#8bd7c7', color: '#1E6B4E',
                  padding: '8px 18px', borderRadius: '8px', fontWeight: 600,
                  border: 'none', cursor: 'pointer', fontSize: '13px', fontFamily: 'Comfortaa',
                  textDecoration: 'none'
                }}>
                  + Add New
                </Link>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {careNeeds.length > 0 ? (
                careNeeds.map(need => (
                  <div key={need.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '14px 18px', borderRadius: '12px',
                    border: '1px solid #f0f0f0',
                    borderLeft: `4px solid ${statusColors[need.status] || '#D1D5DB'}`,
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#1E6B4E', fontSize: '15px', marginBottom: '4px' }}>
                        {(need.name === 'mothers-helper' ? "Mother's Helper" : need.name) || need.care_type || 'Care Need'}
                      </div>
                      <div style={{ color: '#6B7280', fontSize: '13px', marginTop: '3px' }}>
                        {need.days_needed?.length > 0
                          ? need.days_needed.map((d: string) => d.charAt(0).toUpperCase() + d.slice(1, 3)).join(", ")
                          : "Flexible"
                        }
                        {" · "}
                        {need.duration_type === 'ongoing' ? 'Ongoing' : 'Short-term'}
                        {need.start_time && need.end_time && ` · ${need.start_time.slice(0, 5)} - ${need.end_time.slice(0, 5)}`}
                      </div>
                    </div>
                    <Tag variant={need.status === 'covered' ? 'green' : need.status === 'open' ? 'pink' : 'gray'}>
                      {statusLabels[need.status] || need.status}
                    </Tag>
                  </div>
                ))
              ) : (
                <EmptyState message="Post what you're looking for so your village can help." action="Create a care need" />
              )}
            </div>
          </Card>
        )}

        {/* === SECTION 4: AVAILABILITY === */}
        {/* Always visible as per spec (or should follow same rules? Assuming always helpful) */}
        <Card style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <SectionTitle>Availability</SectionTitle>
            {viewMode === 'own' && (
              <Link to="/settings" style={{ color: '#E07A5F', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>Edit</Link>
            )}
          </div>
          <div className="profile-availability" style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
            {/* Day circles */}
            <div style={{ display: 'flex', gap: '8px' }}>
              {allDays.map(d => {
                const isAvailable = p.availability_days?.some((day: string) => day.toLowerCase().startsWith(d));
                return (
                  <div key={d} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%',
                      backgroundColor: isAvailable ? '#1E6B4E' : '#F3F4F6',
                      color: isAvailable ? 'white' : '#D1D5DB',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '13px', fontWeight: 600,
                    }}>
                      {dayAbbr[d]}
                    </div>
                    <span style={{
                      fontSize: '10px',
                      color: isAvailable ? '#1E6B4E' : '#D1D5DB',
                      fontWeight: 500,
                    }}>
                      {dayFull[d].slice(0, 3)}
                    </span>
                  </div>
                )
              })}
            </div>
            {/* Divider */}
            <div className="profile-availability-divider" style={{ width: '1px', height: '40px', backgroundColor: '#E5E7EB' }} />
            {/* Time blocks */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {p.availability_blocks?.length > 0 ? (
                p.availability_blocks.map((b: string) => (
                  <Tag key={b} variant="teal">{b.charAt(0).toUpperCase() + b.slice(1)}</Tag>
                ))
              ) : (
                <span style={{ color: '#9CA3AF', fontSize: '14px' }}>Times not specified</span>
              )}
            </div>
          </div>
        </Card>

        {/* === SECTION 5: TWO-COLUMN GRID === */}
        {/* === SECTION 5: GRID LAYOUT === */}
        {(() => {
          const hasLeftData =
            (p.children_age_groups?.length > 0) ||
            (p.languages?.length > 0) ||
            (p.support_offered?.length > 0);

          const useSingleColStack = viewMode === 'own' && !hasLeftData;

          if (useSingleColStack) {
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* 1. Profile Strength (Full Width) */}
                <Card style={{ border: '1px solid rgba(139,215,199,0.3)' }}>
                  <SectionTitle>Profile Strength</SectionTitle>
                  {pct < 100 && (
                    <p style={{ color: '#6B7280', fontSize: '12px', margin: '0 0 12px 0', lineHeight: 1.4 }}>
                      Complete profiles get 5x more connections from families in your area.
                    </p>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', color: '#6B7280' }}>{completed}/{fields.length} complete</span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#1E6B4E' }}>{pct}%</span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: '#f0f0f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${pct}%`,
                      background: 'linear-gradient(90deg, #1E6B4E, #8bd7c7)',
                      borderRadius: '4px', transition: 'width 0.5s ease',
                    }} />
                  </div>
                  {fields.filter(f => !f.done).length > 0 && (
                    <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {fields.filter(f => !f.done).map(f => (
                        <Link key={f.label} to={f.link} style={{
                          color: '#E07A5F', fontSize: '13px', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none'
                        }}>
                          <span style={{ fontSize: '16px', lineHeight: 1 }}>+</span> {f.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </Card>

                {/* 2. Grouped Collapsed Empty Rows */}
                <div style={{
                  backgroundColor: 'white', borderRadius: '16px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden',
                }}>
                  {[
                    { label: 'Children', action: 'Add children info', link: '/settings#profile', visible: true },
                    { label: 'Languages', action: 'Add languages', link: '/settings#profile', visible: true },
                    { label: 'References', action: 'Request an endorsement', link: '/settings#reviews', visible: true },
                    // Only show "What I Can Offer" if NOT family
                    { label: 'What I Can Offer', action: 'Add what you can offer', link: '/settings#matching', visible: p.role !== 'family' },
                  ].filter(item => item.visible).map((item, i, arr) => (
                    <div key={item.label} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '16px 24px',
                      borderBottom: i < arr.length - 1 ? '1px solid #f0f0f0' : 'none',
                    }}>
                      <span style={{ color: '#6B7280', fontSize: '14px', fontWeight: 600 }}>{item.label}</span>
                      <Link to={item.link} style={{ color: '#E07A5F', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
                        + {item.action}
                      </Link>
                    </div>
                  ))}
                </div>

                {/* 3. Preferences (Full Width) */}
                <Card>
                  <SectionTitle>Preferences</SectionTitle>
                  <CheckItem checked={!!p.comfortable_with_pets} label="Comfortable with pets" />
                  <CheckItem checked={!!p.smoke_free_required} label="Smoke-free environment" />
                  <CheckItem checked={!!p.willing_to_travel} label="Willing to travel" />
                  <CheckItem checked={!!p.available_overnight} label="Available overnight" />
                </Card>

                {/* 4. Trust & Verification (Full Width) */}
                <Card>
                  <SectionTitle>Trust & Verification</SectionTitle>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f5f5f5' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: 'rgba(30,107,78,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="#1E6B4E" stroke="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', color: '#374151', fontWeight: 500 }}>Email Verification</div>
                          <div style={{ fontSize: '12px', color: '#1E6B4E' }}>Verified</div>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f5f5f5' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: p.phone_verified ? 'rgba(30,107,78,0.1)' : '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {p.phone_verified ? <svg width="14" height="14" viewBox="0 0 24 24" fill="#1E6B4E" stroke="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2"><circle cx="12" cy="12" r="10" /></svg>}
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', color: '#374151', fontWeight: 500 }}>Phone Verification</div>
                          <div style={{ fontSize: '12px', color: p.phone_verified ? '#1E6B4E' : '#9CA3AF' }}>{p.phone_verified ? 'Verified' : 'Not verified'}</div>
                        </div>
                      </div>
                      {!p.phone_verified && <Link to="/settings#safety" style={{ color: '#1E6B4E', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>Verify</Link>}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f5f5f5' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2"><circle cx="12" cy="12" r="10" /></svg>
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', color: '#374151', fontWeight: 500 }}>Background Check</div>
                          <div style={{ fontSize: '12px', color: '#9CA3AF' }}>Not verified</div>
                        </div>
                      </div>
                      <span style={{ color: '#9CA3AF', fontSize: '13px', fontWeight: 600 }}>Coming soon</span>
                    </div>
                  </div>
                </Card>

                {/* 5. Social Connections */}
                {(p.instagram_handle || p.linkedin_url || p.facebook_url) ? (
                  <Card>
                    <SectionTitle>Social Connections</SectionTitle>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {p.instagram_handle && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: 28, height: 28, borderRadius: '8px', backgroundColor: 'rgba(139,215,199,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: '14px', color: '#1E6B4E', fontWeight: 700 }}>IG</span>
                          </div>
                          <a href={`https://instagram.com/${p.instagram_handle.replace('@', '')}`} target="_blank" rel="noopener noreferrer" style={{ color: '#1E6B4E', fontSize: '14px', textDecoration: 'none' }}>
                            @{p.instagram_handle.replace("@", "")}
                          </a>
                        </div>
                      )}
                      {p.linkedin_url && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: 28, height: 28, borderRadius: '8px', backgroundColor: 'rgba(139,215,199,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: '14px', color: '#1E6B4E', fontWeight: 700 }}>in</span>
                          </div>
                          <a href={p.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ color: '#1E6B4E', fontSize: '14px', textDecoration: 'none' }}>LinkedIn</a>
                        </div>
                      )}
                      {p.facebook_url && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: 28, height: 28, borderRadius: '8px', backgroundColor: 'rgba(139,215,199,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: '14px', color: '#1E6B4E', fontWeight: 700 }}>FB</span>
                          </div>
                          <a href={p.facebook_url} target="_blank" rel="noopener noreferrer" style={{ color: '#1E6B4E', fontSize: '14px', textDecoration: 'none' }}>Facebook</a>
                        </div>
                      )}
                    </div>
                  </Card>
                ) : (
                  // Collapsed Social
                  <CollapsedEmptyState label="Social Connections" linkText="Add social connections" link="/settings#profile" />
                )}
              </div>
            )
          }

          return (
            <div className="profile-grid" style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '24px' }}>

              {/* LEFT COLUMN */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* Card A: What I Can Offer */}
                {/* Logic: Show if own view, OR (public view AND non-family-only role AND has data) */}
                {/* "What I Can Offer" section if role is 'family' (only show for 'caregiver' or 'both') */}
                {((viewMode === 'own') || (p.role !== 'family' && p.support_offered?.length > 0)) && (
                  (showOfferSection) && (
                    (p.support_offered?.length > 0) ? (
                      <Card>
                        <SectionTitle>What I Can Offer</SectionTitle>
                        <p style={{ color: '#6B7280', fontSize: '13px', margin: '0 0 12px 0' }}>
                          Ways I can help other families in the village
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {p.support_offered.map((t: string) => (
                            <Tag key={t} variant="teal">{t}</Tag>
                          ))}
                        </div>
                      </Card>
                    ) : (
                      // Own view and empty checked by showOfferSection
                      viewMode === 'own' && (
                        <CollapsedEmptyState label="What I Can Offer" linkText="Add what you can offer" link="/settings#matching" />
                      )
                    )
                  )
                )}

                {/* Card B: Children */}
                {(p.children_age_groups?.length > 0) ? (
                  <Card>
                    <SectionTitle>Children</SectionTitle>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {p.children_age_groups.map((a: string) => <Tag key={a} variant="pink">{a.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</Tag>)}
                    </div>
                  </Card>
                ) : (
                  viewMode === 'own' && (
                    <CollapsedEmptyState label="Children" linkText="Add children info" link="/settings#profile" />
                  )
                )}

                {/* Card C: Languages */}
                {(p.languages?.length > 0) ? (
                  <Card>
                    <SectionTitle>Languages</SectionTitle>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {p.languages.map((l: string) => <Tag key={l}>{l}</Tag>)}
                    </div>
                  </Card>
                ) : (
                  viewMode === 'own' && (
                    <CollapsedEmptyState label="Languages" linkText="Add languages" link="/settings#profile" />
                  )
                )}

                {/* Card D: References (Placeholder) */}
                {(viewMode === 'own') && (
                  <CollapsedEmptyState label="References" linkText="Request an endorsement" link="/settings#reviews" />
                )}

              </div>

              {/* RIGHT COLUMN */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* Card E: Profile Strength (Own View Only) */}
                {viewMode === 'own' && (
                  <Card style={{ border: '1px solid rgba(139,215,199,0.3)' }}>
                    <SectionTitle>Profile Strength</SectionTitle>
                    {pct < 100 && (
                      <p style={{ color: '#6B7280', fontSize: '12px', margin: '0 0 12px 0', lineHeight: 1.4 }}>
                        Complete profiles get 5x more connections from families in your area.
                      </p>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', color: '#6B7280' }}>{completed}/{fields.length} complete</span>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#1E6B4E' }}>{pct}%</span>
                    </div>
                    <div style={{ height: '8px', backgroundColor: '#f0f0f0', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${pct}%`,
                        background: 'linear-gradient(90deg, #1E6B4E, #8bd7c7)',
                        borderRadius: '4px', transition: 'width 0.5s ease',
                      }} />
                    </div>
                    {fields.filter(f => !f.done).length > 0 && (
                      <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {fields.filter(f => !f.done).map(f => (
                          <Link key={f.label} to={f.link} style={{
                            color: '#E07A5F', fontSize: '13px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none'
                          }}>
                            <span style={{ fontSize: '16px', lineHeight: 1 }}>+</span> {f.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </Card>
                )}

                {/* Card F: Preferences */}
                {/* PUBLIC VIEW: Hide Preferences if all unchecked */}
                {(() => {
                  const hasAnyPref = p.comfortable_with_pets || p.smoke_free_required || p.willing_to_travel || p.available_overnight;
                  if (viewMode === 'public' && !hasAnyPref) return null;

                  return (
                    <Card>
                      <SectionTitle>Preferences</SectionTitle>
                      <CheckItem checked={!!p.comfortable_with_pets} label="Comfortable with pets" />
                      <CheckItem checked={!!p.smoke_free_required} label="Smoke-free environment" />
                      <CheckItem checked={!!p.willing_to_travel} label="Willing to travel" />
                      <CheckItem checked={!!p.available_overnight} label="Available overnight" />
                      {(p.role === 'caregiver' || p.role === 'both') && (
                        <CheckItem checked={!!p.transportation_required} label="Has own transportation" />
                      )}
                    </Card>
                  );
                })()}

                {/* Card G: Trust & Verification */}
                {(viewMode === 'own' || p.phone_verified) && (
                  <Card>
                    <SectionTitle>Trust & Verification</SectionTitle>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f5f5f5' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: 'rgba(30,107,78,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="#1E6B4E" stroke="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
                          </div>
                          <div>
                            <div style={{ fontSize: '14px', color: '#374151', fontWeight: 500 }}>Email Verification</div>
                            <div style={{ fontSize: '12px', color: '#1E6B4E' }}>Verified</div>
                          </div>
                        </div>
                      </div>

                      {(viewMode === 'own' || p.phone_verified) && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f5f5f5' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: p.phone_verified ? 'rgba(30,107,78,0.1)' : '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {p.phone_verified ? <svg width="14" height="14" viewBox="0 0 24 24" fill="#1E6B4E" stroke="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2"><circle cx="12" cy="12" r="10" /></svg>}
                            </div>
                            <div>
                              <div style={{ fontSize: '14px', color: '#374151', fontWeight: 500 }}>Phone Verification</div>
                              <div style={{ fontSize: '12px', color: p.phone_verified ? '#1E6B4E' : '#9CA3AF' }}>{p.phone_verified ? 'Verified' : 'Not verified'}</div>
                            </div>
                          </div>
                          {!p.phone_verified && viewMode === 'own' && <Link to="/settings#safety" style={{ color: '#1E6B4E', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>Verify</Link>}
                        </div>
                      )}

                      {viewMode === 'own' && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f5f5f5' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2"><circle cx="12" cy="12" r="10" /></svg>
                            </div>
                            <div>
                              <div style={{ fontSize: '14px', color: '#374151', fontWeight: 500 }}>Background Check</div>
                              <div style={{ fontSize: '12px', color: '#9CA3AF' }}>Not verified</div>
                            </div>
                          </div>
                          <span style={{ color: '#9CA3AF', fontSize: '13px', fontWeight: 600 }}>Coming soon</span>
                        </div>
                      )}
                    </div>
                  </Card>
                )}

                {/* Card H: Social Connections */}
                {(p.instagram_handle || p.linkedin_url || p.facebook_url) ? (
                  <Card>
                    <SectionTitle>Social Connections</SectionTitle>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {p.instagram_handle && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: 28, height: 28, borderRadius: '8px', backgroundColor: 'rgba(139,215,199,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: '14px', color: '#1E6B4E', fontWeight: 700 }}>IG</span>
                          </div>
                          <a href={`https://instagram.com/${p.instagram_handle.replace('@', '')}`} target="_blank" rel="noopener noreferrer" style={{ color: '#1E6B4E', fontSize: '14px', textDecoration: 'none' }}>
                            @{p.instagram_handle.replace("@", "")}
                          </a>
                        </div>
                      )}
                      {p.linkedin_url && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: 28, height: 28, borderRadius: '8px', backgroundColor: 'rgba(139,215,199,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: '14px', color: '#1E6B4E', fontWeight: 700 }}>in</span>
                          </div>
                          <a href={p.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ color: '#1E6B4E', fontSize: '14px', textDecoration: 'none' }}>LinkedIn</a>
                        </div>
                      )}
                      {p.facebook_url && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: 28, height: 28, borderRadius: '8px', backgroundColor: 'rgba(139,215,199,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: '14px', color: '#1E6B4E', fontWeight: 700 }}>FB</span>
                          </div>
                          <a href={p.facebook_url} target="_blank" rel="noopener noreferrer" style={{ color: '#1E6B4E', fontSize: '14px', textDecoration: 'none' }}>Facebook</a>
                        </div>
                      )}
                    </div>
                  </Card>
                ) : (
                  // Collapsed when empty in own view
                  viewMode === 'own' && (
                    <CollapsedEmptyState label="Social Connections" linkText="Add social connections" link="/settings#profile" />
                  )
                )}

              </div>
            </div>
          );
        })()}
      </div>
    </div >
  );
}