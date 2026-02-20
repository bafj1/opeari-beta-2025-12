import { useState, useEffect, useMemo } from 'react';
import { useViewer } from '../hooks/useViewer';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import {
    computeMatchScore,
    filterByShowMe,
    filterByCareTypes,
    filterByAgeGroups,
    filterByLanguages,
    filterByTimeline,
    type MatchResult
} from '../lib/matchingScore';
import { SharedCareTag, getSharedCareTags } from '../components/Shared/SharedCareTag';

// Brand colors
const C = {
    green: '#1e6b4e',
    mint: '#8bd7c7',
    mintLight: '#d8f5e5',
    coral: '#E07A5F',
    cream: '#fffaf5',
    bg: '#f0faf4',
    textDark: '#1e6b4e',
    textMuted: '#5f7c6b',
    border: 'rgba(139,215,199,0.35)',
    white: '#ffffff',
};

const CARE_TYPES = [
    { id: 'babysitter', label: 'Babysitter' },
    { id: 'nanny', label: 'Nanny' },
    { id: 'nanny-share', label: 'Nanny Share' },
    { id: 'mothers-helper', label: "Mother's Helper" },
    { id: 'backup-care', label: 'Backup Care' },
    { id: 'household-manager', label: 'Household Mgr' },
    { id: 'special-needs', label: 'Special Needs' },
];

interface CandidateWithScore {
    candidate: any;
    matchResult: MatchResult;
}





export default function Matches() {
    const { viewer, loading: viewerLoading } = useViewer();
    const [allCandidates, setAllCandidates] = useState<any[]>([]);
    const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set());
    const [connectionPeople, setConnectionPeople] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);

    const [filters, setFilters] = useState({
        showMe: 'both' as string,
        careTypes: [] as string[],
        ageGroups: [] as string[],
        languages: [] as string[],
        asapOnly: false,
        scheduleOnly: false,
    });

    // Default to showing everyone with no filters — users can narrow down via filter panel
    useEffect(() => {
        if (!viewer?.member) return;
        setFilters({
            showMe: 'both',
            careTypes: [],
            ageGroups: [],
            languages: [],
            asapOnly: false,
            scheduleOnly: false,
        });
    }, [viewer?.member?.id]);

    useEffect(() => {
        if (viewer) fetchData();
    }, [viewer]);

    async function fetchData() {
        try {
            setLoading(true);
            if (!viewer?.member) return;
            const myId = viewer.member.id;

            const { data: candidates, error } = await supabase
                .from('members')
                .select(`
                    id, first_name, last_name, role, bio,
                    zip_code, neighborhood, languages,
                    care_types, availability_days, vetting_status, avatar_url,
                    children_age_groups, support_offered,
                    smoke_free_required, comfortable_with_pets, schedule_flexible,
                    timeline,
                    has_transportation, needs_caregiver_driver, max_travel_miles, overnight_available,
                    can_lift_30lbs, comfortable_with_stairs,
                    has_parking, has_stairs, home_type, budget_min, budget_max
                `)
                .neq('id', myId);
            if (error) throw error;

            // Exclude connected + pending
            const { data: connections } = await supabase
                .from('connections')
                .select('requester_id, recipient_id')
                .or(`requester_id.eq.${myId},recipient_id.eq.${myId}`)
                .in('status', ['accepted', 'pending']);

            const connIds = new Set<string>();
            (connections || []).forEach((c: any) => {
                if (c.requester_id !== myId) connIds.add(c.requester_id);
                if (c.recipient_id !== myId) connIds.add(c.recipient_id);
            });

            setAllCandidates(candidates || []);
            setConnectedIds(connIds);

            // Fetch accepted connection people for the empty state grid
            const { data: connData } = await supabase
                .from('connections')
                .select(`
                    id, status,
                    requester:members!connections_requester_id_fkey(id, first_name, last_name, avatar_url, neighborhood, role),
                    recipient:members!connections_recipient_id_fkey(id, first_name, last_name, avatar_url, neighborhood, role)
                `)
                .or(`requester_id.eq.${myId},recipient_id.eq.${myId}`)
                .eq('status', 'accepted')
                .limit(6);

            if (connData) {
                const mapped = connData.map((c: any) => {
                    const req = Array.isArray(c.requester) ? c.requester[0] : c.requester;
                    const rec = Array.isArray(c.recipient) ? c.recipient[0] : c.recipient;
                    return req?.id === myId ? rec : req;
                }).filter(Boolean);
                setConnectionPeople(mapped);
            }
        } catch (err) {
            console.error('Match fetch error:', err);
        } finally {
            setLoading(false);
        }
    }

    const rankedMatches: CandidateWithScore[] = useMemo(() => {
        if (!viewer?.member || allCandidates.length === 0) return [];

        let filtered = allCandidates.filter(c => !connectedIds.has(c.id));
        filtered = filterByShowMe(filtered, filters.showMe);
        filtered = filterByCareTypes(filtered, filters.careTypes);
        filtered = filterByAgeGroups(filtered, filters.ageGroups);
        filtered = filterByLanguages(filtered, filters.languages);
        filtered = filterByTimeline(filtered, filters.asapOnly);

        let scored = filtered.map(candidate => ({
            candidate,
            matchResult: computeMatchScore(viewer.member, candidate),
        }));

        if (filters.scheduleOnly) {
            scored = scored.filter(s => s.matchResult.scheduleOverlap > 0);
        }

        scored.sort((a, b) => b.matchResult.score - a.matchResult.score);
        return scored;
    }, [allCandidates, connectedIds, viewer?.member, filters]);

    const familyMatches = useMemo(() =>
        rankedMatches.filter(({ candidate }) =>
            candidate.role === 'family' || candidate.role === 'both'
        ),
        [rankedMatches]
    );

    const caregiverMatches = useMemo(() =>
        rankedMatches.filter(({ candidate }) =>
            candidate.role === 'caregiver' || candidate.role === 'both'
        ),
        [rankedMatches]
    );

    const toggleFilter = (key: 'careTypes' | 'ageGroups' | 'languages', item: string) => {
        setFilters(prev => ({
            ...prev,
            [key]: prev[key].includes(item)
                ? prev[key].filter(i => i !== item)
                : [...prev[key], item],
        }));
    };

    const clearFilters = () => setFilters({
        showMe: 'both',
        careTypes: [],
        ageGroups: [],
        languages: [],
        asapOnly: false,
        scheduleOnly: false,
    });

    // Count individual active filters
    const activeFilterCount =
        (filters.showMe !== 'both' ? 1 : 0) +
        filters.careTypes.length +
        filters.ageGroups.length +
        filters.languages.length +
        (filters.asapOnly ? 1 : 0) +
        (filters.scheduleOnly ? 1 : 0);

    if (viewerLoading || loading) {
        return (
            <>
                <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '40px', height: '40px', border: `3px solid ${C.green}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                        <p style={{ color: C.green, fontSize: '14px', fontWeight: 500 }}>Finding your matches...</p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <div style={{ minHeight: '100vh', backgroundColor: C.bg }}>
                <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 20px 80px' }}>

                    {/* Back to Village */}
                    <Link
                        to="/village"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '13px',
                            color: C.textMuted,
                            textDecoration: 'none',
                            marginBottom: '16px',
                        }}
                    >
                        ← Back to Village
                    </Link>

                    {/* Page Header */}
                    <div style={{ marginBottom: '24px' }}>
                        <h1 style={{ color: C.green, fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>
                            Discover
                        </h1>
                        <p style={{ color: C.textMuted, fontSize: '14px' }}>
                            Find families and caregivers in your area, ranked by compatibility.
                        </p>
                    </div>

                    {/* Filter Bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            aria-expanded={showFilters}
                            aria-controls="filter-panel"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 16px',
                                borderRadius: '24px',
                                border: `1.5px solid ${showFilters ? C.green : C.border}`,
                                backgroundColor: showFilters ? C.green : C.white,
                                color: showFilters ? C.white : C.green,
                                fontSize: '13px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                            }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="4" y1="6" x2="20" y2="6" />
                                <line x1="8" y1="12" x2="16" y2="12" />
                                <line x1="11" y1="18" x2="13" y2="18" />
                            </svg>
                            Filters
                            {activeFilterCount > 0 && (
                                <span style={{
                                    backgroundColor: showFilters ? C.white : C.coral,
                                    color: showFilters ? C.green : C.white,
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    borderRadius: '10px',
                                    padding: '1px 6px',
                                    minWidth: '16px',
                                    textAlign: 'center',
                                    lineHeight: '16px',
                                }}>
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>

                        <span style={{ color: C.textMuted, fontSize: '13px' }}>
                            {rankedMatches.length} {rankedMatches.length === 1 ? 'match' : 'matches'}
                        </span>

                        {activeFilterCount > 0 && (
                            <button
                                onClick={clearFilters}
                                style={{
                                    marginLeft: 'auto',
                                    fontSize: '12px',
                                    color: C.coral,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    background: 'none',
                                    border: 'none',
                                    padding: 0,
                                }}
                            >
                                Clear all
                            </button>
                        )}
                    </div>

                    {/* Filter Panel */}
                    {showFilters && (
                        <div
                            id="filter-panel"
                            role="region"
                            aria-label="Filter options"
                            style={{
                                backgroundColor: C.white,
                                borderRadius: '16px',
                                padding: '20px',
                                marginBottom: '20px',
                                border: `1px solid ${C.border}`,
                                boxShadow: '0 2px 8px rgba(30,107,78,0.06)',
                            }}
                        >
                            {/* Show Me */}
                            <div style={{ marginBottom: '20px' }}>
                                <p style={{ fontSize: '12px', fontWeight: 700, color: C.textMuted, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Show Me
                                </p>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {[
                                        { id: 'both', label: 'Everyone' },
                                        { id: 'parents', label: 'Parents' },
                                        { id: 'caregivers', label: 'Caregivers' },
                                    ].map(opt => {
                                        const active = filters.showMe === opt.id;
                                        return (
                                            <button
                                                key={opt.id}
                                                onClick={() => setFilters(prev => ({ ...prev, showMe: opt.id }))}
                                                aria-pressed={active}
                                                style={{
                                                    padding: '6px 16px',
                                                    borderRadius: '20px',
                                                    border: `1.5px solid ${active ? C.green : C.border}`,
                                                    backgroundColor: active ? C.mintLight : C.white,
                                                    color: C.green,
                                                    fontSize: '13px',
                                                    fontWeight: active ? 600 : 400,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.15s',
                                                }}
                                            >
                                                {opt.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Care Types */}
                            <div style={{ marginBottom: '20px' }}>
                                <p style={{ fontSize: '12px', fontWeight: 700, color: C.textMuted, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Care Types
                                </p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {CARE_TYPES.map(ct => {
                                        const active = filters.careTypes.includes(ct.id);
                                        return (
                                            <button
                                                key={ct.id}
                                                onClick={() => toggleFilter('careTypes', ct.id)}
                                                aria-pressed={active}
                                                style={{
                                                    padding: '5px 14px',
                                                    borderRadius: '20px',
                                                    border: `1.5px solid ${active ? C.green : C.border}`,
                                                    backgroundColor: active ? C.mintLight : C.white,
                                                    color: C.green,
                                                    fontSize: '12px',
                                                    fontWeight: active ? 600 : 400,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.15s',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {ct.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Toggle Row */}
                            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: C.green, cursor: 'pointer', userSelect: 'none' }}>
                                    <input
                                        type="checkbox"
                                        checked={filters.asapOnly}
                                        onChange={e => setFilters(prev => ({ ...prev, asapOnly: e.target.checked }))}
                                        style={{ accentColor: C.green, width: '16px', height: '16px' }}
                                    />
                                    ASAP only
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: C.green, cursor: 'pointer', userSelect: 'none' }}>
                                    <input
                                        type="checkbox"
                                        checked={filters.scheduleOnly}
                                        onChange={e => setFilters(prev => ({ ...prev, scheduleOnly: e.target.checked }))}
                                        style={{ accentColor: C.green, width: '16px', height: '16px' }}
                                    />
                                    Schedule overlap only
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Results */}
                    {rankedMatches.length === 0 ? (
                        <div style={{
                            backgroundColor: C.white,
                            borderRadius: '20px',
                            padding: '48px 24px',
                            textAlign: 'center',
                            border: `1px solid ${C.border}`,
                        }}>
                            <div style={{
                                width: '56px',
                                height: '56px',
                                borderRadius: '50%',
                                backgroundColor: C.mintLight,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 20px',
                            }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8" />
                                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                </svg>
                            </div>

                            {/* Detect: all connected vs filtered out */}
                            {allCandidates.length > 0 && allCandidates.every(c => connectedIds.has(c.id)) ? (
                                <>
                                    <h3 style={{ color: C.green, fontWeight: 700, fontSize: '18px', marginBottom: '8px' }}>
                                        You're connected with everyone
                                    </h3>
                                    <p style={{ color: C.textMuted, fontSize: '14px', maxWidth: '300px', margin: '0 auto 20px', lineHeight: '1.5' }}>
                                        Great work building your village! Invite more people to expand your care circle.
                                    </p>
                                    <Link
                                        to="/invite-friends"
                                        style={{
                                            display: 'inline-block',
                                            padding: '10px 28px',
                                            borderRadius: '24px',
                                            backgroundColor: C.green,
                                            color: C.white,
                                            fontWeight: 600,
                                            fontSize: '14px',
                                            textDecoration: 'none',
                                        }}
                                    >
                                        Invite a Family
                                    </Link>
                                    <Link
                                        to="/connections"
                                        style={{
                                            display: 'block',
                                            marginTop: '12px',
                                            fontSize: '13px',
                                            color: C.green,
                                            fontWeight: 600,
                                            textDecoration: 'none',
                                        }}
                                    >
                                        View Your Connections →
                                    </Link>

                                    {/* Your Connections Grid */}
                                    {connectionPeople.length > 0 && (
                                        <div style={{ marginTop: '32px', textAlign: 'left' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                                <h2 style={{ fontSize: '16px', fontWeight: 700, color: C.green }}>Your Connections</h2>
                                                <Link to="/connections" style={{ fontSize: '13px', fontWeight: 600, color: C.green, textDecoration: 'none' }}>
                                                    View All →
                                                </Link>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                                                {connectionPeople.map((person: any) => (
                                                    <Link
                                                        key={person.id}
                                                        to={`/member/${person.id}`}
                                                        style={{
                                                            backgroundColor: C.white,
                                                            borderRadius: '16px',
                                                            padding: '16px',
                                                            border: `1px solid ${C.border}`,
                                                            textDecoration: 'none',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '12px',
                                                            transition: 'box-shadow 0.2s, border-color 0.2s',
                                                        }}
                                                    >
                                                        <div style={{
                                                            width: '44px', height: '44px', borderRadius: '50%',
                                                            backgroundColor: C.mintLight,
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            overflow: 'hidden', flexShrink: 0,
                                                        }}>
                                                            {person.avatar_url ? (
                                                                <img src={person.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                                                            ) : (
                                                                <span style={{ fontSize: '16px', fontWeight: 700, color: C.green }}>
                                                                    {(person.first_name || '?').charAt(0)}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div style={{ minWidth: 0 }}>
                                                            <p style={{ fontWeight: 600, color: C.green, fontSize: '13px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                {person.first_name} {(person.last_name || '').charAt(0)}.
                                                            </p>
                                                            {person.neighborhood && (
                                                                <p style={{ fontSize: '11px', color: C.textMuted, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                    {person.neighborhood}
                                                                </p>
                                                            )}
                                                            <p style={{ fontSize: '11px', color: C.textMuted, margin: '2px 0 0', textTransform: 'capitalize' }}>
                                                                {person.role || 'Family'}
                                                            </p>
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    <h3 style={{ color: C.green, fontWeight: 700, fontSize: '18px', marginBottom: '8px' }}>
                                        No matches yet
                                    </h3>
                                    <p style={{ color: C.textMuted, fontSize: '14px', maxWidth: '300px', margin: '0 auto 20px', lineHeight: '1.5' }}>
                                        {activeFilterCount > 0
                                            ? 'Try adjusting your filters to see more people.'
                                            : 'Your village is growing! New families and caregivers are joining. Check back soon.'}
                                    </p>
                                    {activeFilterCount > 0 ? (
                                        <button
                                            onClick={clearFilters}
                                            style={{
                                                padding: '10px 28px',
                                                borderRadius: '24px',
                                                backgroundColor: C.green,
                                                color: C.white,
                                                fontWeight: 600,
                                                fontSize: '14px',
                                                border: 'none',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            Clear Filters
                                        </button>
                                    ) : (
                                        <Link
                                            to="/settings"
                                            style={{
                                                display: 'inline-block',
                                                padding: '10px 28px',
                                                borderRadius: '24px',
                                                backgroundColor: C.green,
                                                color: C.white,
                                                fontWeight: 600,
                                                fontSize: '14px',
                                                textDecoration: 'none',
                                            }}
                                        >
                                            Update Preferences
                                        </Link>
                                    )}
                                </>
                            )}
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                            {/* === Families Near You === */}
                            {familyMatches.length > 0 && (
                                <section>
                                    <div style={{ marginBottom: '16px' }}>
                                        <h2 style={{
                                            color: C.green,
                                            fontSize: '20px',
                                            fontWeight: 700,
                                            marginBottom: '4px',
                                        }}>
                                            Families Near You
                                        </h2>
                                        <p style={{ color: C.textMuted, fontSize: '13px' }}>
                                            {familyMatches.length} {familyMatches.length === 1 ? 'family' : 'families'} matching your preferences
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {familyMatches.map(({ candidate, matchResult }) => (
                                            <DiscoveryCard
                                                key={candidate.id}
                                                candidate={candidate}
                                                matchResult={matchResult}
                                            />
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* === Caregivers Available === */}
                            {caregiverMatches.length > 0 && (
                                <section>
                                    <div style={{ marginBottom: '16px' }}>
                                        <h2 style={{
                                            color: C.green,
                                            fontSize: '20px',
                                            fontWeight: 700,
                                            marginBottom: '4px',
                                        }}>
                                            Caregivers Available
                                        </h2>
                                        <p style={{ color: C.textMuted, fontSize: '13px' }}>
                                            {caregiverMatches.length} {caregiverMatches.length === 1 ? 'caregiver' : 'caregivers'} in your area
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {caregiverMatches.map(({ candidate, matchResult }) => (
                                            <DiscoveryCard
                                                key={candidate.id}
                                                candidate={candidate}
                                                matchResult={matchResult}
                                            />
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Edge case: both sections empty but rankedMatches has items */}
                            {familyMatches.length === 0 && caregiverMatches.length === 0 && rankedMatches.length > 0 && (
                                <div style={{
                                    backgroundColor: C.white,
                                    borderRadius: '16px',
                                    padding: '32px',
                                    textAlign: 'center',
                                    border: `1px solid ${C.border}`,
                                }}>
                                    <p style={{ color: C.textMuted, fontSize: '14px' }}>
                                        No matches in this category. Try adjusting your filters.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

// --- Discovery Card ---

function DiscoveryCard({ candidate, matchResult }: { candidate: any; matchResult: MatchResult }) {
    const roleLabel = candidate.role === 'caregiver' ? 'Caregiver' : 'Family';

    const scoreColor = matchResult.score >= 60 ? C.green
        : matchResult.score >= 30 ? C.mint
            : '#ccc';
    const scoreTextColor = matchResult.score >= 60 ? C.white
        : matchResult.score >= 30 ? C.green
            : C.textMuted;

    return (
        <Link
            to={`/member/${candidate.id}`}
            style={{
                display: 'block',
                backgroundColor: C.white,
                borderRadius: '16px',
                border: `1px solid ${C.border}`,
                textDecoration: 'none',
                transition: 'transform 0.15s, box-shadow 0.15s',
                padding: '16px 20px',
            }}
            className="hover:shadow-md hover:-translate-y-0.5"
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Avatar */}
                <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    backgroundColor: C.mintLight,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    overflow: 'hidden',
                }}>
                    {candidate.avatar_url ? (
                        <img
                            src={candidate.avatar_url}
                            alt={candidate.first_name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    ) : (
                        <span style={{ color: C.green, fontSize: '20px', fontWeight: 700 }}>
                            {candidate.first_name?.charAt(0) || '?'}
                        </span>
                    )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ color: C.green, fontWeight: 700, fontSize: '15px' }}>
                            {candidate.role === 'caregiver'
                                ? candidate.first_name
                                : `${candidate.first_name}'s Family`}
                        </span>
                        <span style={{
                            fontSize: '11px',
                            fontWeight: 500,
                            padding: '2px 8px',
                            borderRadius: '10px',
                            backgroundColor: C.mintLight,
                            color: C.green,
                        }}>
                            {roleLabel}
                        </span>
                        {candidate.timeline === 'asap' && (
                            <span style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: '10px',
                                backgroundColor: '#FEF3C7',
                                color: '#92400E',
                            }}>
                                ASAP
                            </span>
                        )}
                    </div>
                    {/* Care details pills */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                        {candidate.role === 'caregiver' && candidate.care_types?.slice(0, 3).map((ct: string) => (
                            <span
                                key={ct}
                                style={{
                                    fontSize: '10px',
                                    fontWeight: 500,
                                    padding: '2px 8px',
                                    borderRadius: '10px',
                                    backgroundColor: '#FDF2F8',
                                    color: '#9D174D',
                                }}
                            >
                                {ct.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                            </span>
                        ))}
                        {candidate.role !== 'caregiver' && candidate.children_age_groups?.slice(0, 3).map((ag: string) => (
                            <span
                                key={ag}
                                style={{
                                    fontSize: '10px',
                                    fontWeight: 500,
                                    padding: '2px 8px',
                                    borderRadius: '10px',
                                    backgroundColor: C.mintLight,
                                    color: C.green,
                                }}
                            >
                                {ag}
                            </span>
                        ))}
                    </div>
                    <span style={{ color: C.textMuted, fontSize: '12px' }}>
                        {candidate.neighborhood || candidate.zip_code || 'Nearby'}
                    </span>
                </div>

                {/* Score */}
                <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: scoreColor,
                    color: scoreTextColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '14px',
                    flexShrink: 0,
                }}>
                    {matchResult.score}
                </div>
            </div>


            {/* Shared Care Tags */}
            {getSharedCareTags(candidate).length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px' }}>
                    {getSharedCareTags(candidate).map((tag, idx) => (
                        <SharedCareTag key={idx} label={tag} />
                    ))}
                </div>
            )}

            {/* Signals */}
            {matchResult.signals.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px' }}>
                    {matchResult.signals.slice(0, 3).map((signal, idx) => (
                        <span
                            key={idx}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 10px',
                                borderRadius: '12px',
                                backgroundColor: C.mintLight,
                                fontSize: '11px',
                                color: C.green,
                                fontWeight: 500,
                            }}
                        >
                            {signal.icon} {signal.label}
                        </span>
                    ))}
                </div>
            )}

            {/* Bio */}
            {candidate.bio && (
                <p style={{
                    color: C.textMuted,
                    fontSize: '13px',
                    marginTop: '10px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    lineHeight: '1.4',
                }}>
                    {candidate.bio}
                </p>
            )}
        </Link>
    );
}
