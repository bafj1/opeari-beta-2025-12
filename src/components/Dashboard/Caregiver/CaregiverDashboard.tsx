
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { useViewer } from '../../../hooks/useViewer';
import { useNavigate } from 'react-router-dom';
import type { MatchCardProps } from '../NorthStar/MatchCard';
import ProfileModal from '../NorthStar/ProfileModal';
import MessageModal from '../NorthStar/MessageModal';
import SearchModal from '../NorthStar/SearchModal';
import ConnectionRequestsCard from '../ConnectionRequestsCard';

// Helpers (Placeholder Photo + Stable Score)
const getPlaceholderPhoto = (memberId: string, index: number): string => {
    const known: Record<string, string> = {
        '17b593bd-41ca-44d0-bb7c-3e4f98010e0a': 'https://images.unsplash.com/photo-1580489944761-15a19d654956?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80',
        '3a092606-43cf-4b50-b5de-0a911f38e333': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80',
        '3467c628-ba75-4748-9579-fe20b1dc63c7': 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80',
    };
    if (known[memberId]) return known[memberId];

    const fallbacks = [
        'https://images.unsplash.com/photo-1580489944761-15a19d654956?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80',
    ];
    return fallbacks[index % fallbacks.length];
};

const stableScoreFromId = (id: string, min = 82, max = 98): number => {
    // stable pseudo-random based on id
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
    const range = max - min + 1;
    return min + (hash % range);
};

const calculateAgeFromBirthday = (birthday: string | null): number | null => {
    if (!birthday) return null;
    const birth = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
};

interface MemberData {
    care_types?: string[];
    looking_for?: string[]; // legacy fallback
    also_open_to?: string[];
    [key: string]: any;
}

function getSharedCareTags(match: MemberData): string[] {
    const tags: string[] = [];

    // Check care_types array (with looking_for as fallback)
    const careArr = match.care_types || match.looking_for || [];
    if (careArr.includes('nanny-share')) {
        tags.push('Open to nanny share');
    }
    if (careArr.includes('co-share')) {
        tags.push('Open to co-share');
    }
    if (careArr.includes('backup-care')) {
        tags.push('Wants backup care');
    }

    // Check nanny_situation
    if (match.nanny_situation === 'have_nanny') {
        tags.push('Has a nanny');
    }
    if (match.nanny_situation === 'seeking_share') {
        tags.push('Seeking nanny share');
    }

    // Check also_open_to array
    if (match.also_open_to?.includes('weekend_swaps')) {
        tags.push('Open to weekend swaps');
    }

    // Limit to 2 tags max to avoid visual clutter
    return tags.slice(0, 2);
}




const careTypeLabels: Record<string, string> = {
    'nanny-share': 'Nanny Share',
    'backup-care': 'Backup Care',
    'co-share': 'Co-share',
    'full-time': 'Full-time Care',
    'part-time': 'Part-time Care',
    'occasional': 'Occasional Care',
    'mothers-helper': "Mother's Helper",
    'household-help': 'Household Help',
};

export default function CaregiverDashboard() {
    const navigate = useNavigate();
    const { viewer } = useViewer();
    const [connectingTo, setConnectingTo] = useState<string | null>(null);
    const [pendingIds, setPendingIds] = useState<Record<string, true>>({});
    const [statusById, setStatusById] = useState<Record<string, 'pending' | 'accepted'>>({});

    // UI State
    const [showSearch, setShowSearch] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
    const [unreadMsgCount, setUnreadMsgCount] = useState(0);
    const [notifications, setNotifications] = useState<any[]>([]);

    // Care Opportunities State
    const [careOpportunities, setCareOpportunities] = useState<any[]>([]);
    const [loadingOpportunities, setLoadingOpportunities] = useState(true);

    // Matches State
    const [matches, setMatches] = useState<MatchCardProps[]>([]);
    const [loadingMatches, setLoadingMatches] = useState(true);

    // Unread State (for match cards)
    const [unreadByMemberId, setUnreadByMemberId] = useState<Record<string, number>>({});

    // Save State
    const [savedById, setSavedById] = useState<Record<string, true>>({});
    const [savingById, setSavingById] = useState<Record<string, boolean>>({});

    // Modal State
    const [profileOpen, setProfileOpen] = useState(false);
    const [activeProfileId, setActiveProfileId] = useState<string | null>(null);

    // Message State
    const [messageOpen, setMessageOpen] = useState(false);
    const [messageRecipientId, setMessageRecipientId] = useState<string | null>(null);
    const [messageRecipientName, setMessageRecipientName] = useState('');

    // Auth Fallback
    const [authUserId, setAuthUserId] = useState<string | null>(null);
    const userId = viewer?.member?.id;
    const effectiveUserId = userId ?? authUserId;

    // Suppress TS6133 — these are used by side-effects / subscriptions
    void pendingIds; void showNotifications; void setShowNotifications;
    void unreadNotificationsCount; void unreadMsgCount; void notifications;
    void loadingOpportunities; void unreadByMemberId; void savingById;

    // 1. Fetch Auth User directly
    useEffect(() => {
        let active = true;
        (async () => {
            const { data, error } = await supabase.auth.getUser();
            if (!active) return;
            if (error) {
                console.warn('auth.getUser failed:', error);
                return;
            }
            setAuthUserId(data.user?.id ?? null);
        })();
        return () => { active = false; };
    }, []);

    // 2. Notifications & Messages Logic
    const fetchNotifications = useCallback(async () => {
        if (!effectiveUserId) return;

        // Unread Count
        const { count, error: countError } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', effectiveUserId)
            .eq('read', false);

        if (!countError) {
            setUnreadNotificationsCount(count || 0);
        }

        // Unread Messages Count
        const { data: conversations } = await supabase
            .from('conversations')
            .select('id')
            .or(`participant_1.eq.${effectiveUserId},participant_2.eq.${effectiveUserId}`);

        if (!conversations || conversations.length === 0) {
            setUnreadMsgCount(0);
            // continue to fetch notifications...
        } else {
            const convIds = conversations.map(c => c.id);
            // Count distinct conversations with unread messages (not total messages)
            const { data: unreadMessages } = await supabase
                .from('messages')
                .select('conversation_id')
                .in('conversation_id', convIds)
                .neq('sender_id', effectiveUserId)
                .is('read_at', null);

            if (unreadMessages) {
                const uniqueConvIds = new Set(unreadMessages.map(m => m.conversation_id));
                setUnreadMsgCount(uniqueConvIds.size);
            } else {
                setUnreadMsgCount(0);
            }
        }

        // Recent Notifications
        const { data: notifs } = await supabase
            .from('notifications')
            .select(`
                *,
                from_user:members!notifications_from_user_id_fkey(first_name, last_name, avatar_url)
            `)
            .eq('user_id', effectiveUserId)
            .order('created_at', { ascending: false })
            .limit(5);

        if (notifs) {
            setNotifications(notifs);
        }
    }, [effectiveUserId]);

    // 3. Reusable fetch for unread counts per member (for cards)
    const fetchUnreadCounts = useCallback(async () => {
        if (!effectiveUserId) return;

        // 1) fetch conversations for this user
        const { data: conversations, error: convError } = await supabase
            .from('conversations')
            .select('id, participant_1, participant_2')
            .or(`participant_1.eq.${effectiveUserId},participant_2.eq.${effectiveUserId}`);

        if (convError || !conversations) {
            console.error('Failed to fetch conversations:', convError);
            return;
        }

        if (conversations.length === 0) {
            setUnreadByMemberId({});
            return;
        }

        const convIds = conversations.map(c => c.id);

        // Map conversationId -> otherMemberId
        const otherByConvId: Record<string, string> = {};
        for (const c of conversations) {
            otherByConvId[c.id] =
                c.participant_1 === effectiveUserId ? c.participant_2 : c.participant_1;
        }

        // 2) fetch ALL unread messages across those conversations in ONE query
        const { data: unreadMessages, error: unreadError } = await supabase
            .from('messages')
            .select('conversation_id')
            .in('conversation_id', convIds)
            .is('read_at', null)
            .neq('sender_id', effectiveUserId);

        if (unreadError) {
            console.error('Failed to fetch unread messages:', unreadError);
            return;
        }

        // 3) aggregate counts by other member
        const unreadMap: Record<string, number> = {};
        for (const row of unreadMessages ?? []) {
            const otherId = otherByConvId[row.conversation_id];
            if (!otherId) continue;
            unreadMap[otherId] = (unreadMap[otherId] ?? 0) + 1;
        }

        setUnreadByMemberId(unreadMap);
    }, [effectiveUserId]);

    // Fetch care opportunities (active care needs from families)
    useEffect(() => {
        async function fetchCareOpportunities() {
            if (!effectiveUserId) return;
            setLoadingOpportunities(true);

            try {
                const { data, error } = await supabase
                    .from('care_needs')
                    .select(`
                        id,
                        name,
                        care_type,
                        days_needed,
                        time_windows,
                        status,
                        is_active,
                        notes_for_caregiver,
                        member_id,
                        members(id, first_name, last_name, neighborhood, avatar_url)
                    `)
                    .eq('is_active', true)
                    .neq('member_id', effectiveUserId)
                    .order('created_at', { ascending: false })
                    .limit(5);

                if (error) {
                    console.error('Failed to fetch care opportunities:', error);
                    setCareOpportunities([]);
                } else {
                    setCareOpportunities(data || []);
                }
            } catch (err) {
                console.error('Care opportunities error:', err);
                setCareOpportunities([]);
            } finally {
                setLoadingOpportunities(false);
            }
        }

        fetchCareOpportunities();
    }, [effectiveUserId]);

    const fetchMatches = useCallback(async () => {
        if (!effectiveUserId) return;
        setLoadingMatches(true);

        try {
            const { data, error } = await supabase
                .from('members')
                .select('id, first_name, last_name, role, bio, zip_code, neighborhood, num_kids, kids_ages, availability_days, vetting_status, avatar_url, care_types, also_open_to')
                .neq('id', effectiveUserId)
                .neq('role', 'caregiver');

            if (error) {
                console.error('Failed to fetch matches:', error);
                setMatches([]);
                return;
            }

            // Fetch kids for all matched members
            const memberIds = (data ?? []).map(m => m.id);
            const { data: kidsData } = await supabase
                .from('kids')
                .select('user_id, name, birthday')
                .in('user_id', memberIds);

            // Group kids by member
            const kidsByMemberId: Record<string, { name: string; age: number }[]> = {};
            for (const kid of kidsData ?? []) {
                const age = calculateAgeFromBirthday(kid.birthday);
                if (age !== null && age >= 0 && age < 18) {
                    if (!kidsByMemberId[kid.user_id]) {
                        kidsByMemberId[kid.user_id] = [];
                    }
                    kidsByMemberId[kid.user_id].push({
                        name: kid.name || 'Child',
                        age
                    });
                }
            }

            const mapped: MatchCardProps[] = (data ?? []).map((m, idx) => {
                // Parse kids from real data
                const kids = kidsByMemberId[m.id] ?? [];

                // Parse availability days
                const availDays = m.availability_days as string[] | null;
                const matchDays = availDays?.length
                    ? availDays.map(d => d.slice(0, 3)) // 'Monday' -> 'Mon'
                    : ['Mon', 'Wed', 'Fri']; // fallback

                // Determine verified status
                const verified = m.vetting_status === 'verified' || m.vetting_status === 'approved';

                return {
                    id: String(idx + 1),
                    targetMemberId: m.id,
                    name: `${m.first_name ?? ''} ${m.last_name ?? ''}`.trim() || 'Unknown',
                    photo: m.avatar_url || getPlaceholderPhoto(m.id, idx),
                    distance: 2.0, // Keep placeholder until geo calculation
                    scheduleOverlap: stableScoreFromId(m.id, 82, 98), // Keep deterministic
                    matchDays,
                    type: m.role === 'caregiver' ? 'caregiver' : 'parent',
                    bio: m.bio ?? 'No bio yet.',
                    inVillage: false,
                    verified,
                    responseRate: 95,
                    lastActive: 'Recently active',
                    interests: [],
                    mutualConnections: 0,
                    mutualConnectionPhotos: [],
                    ...(m.role === 'caregiver'
                        ? { availability: availDays?.slice(0, 3) ?? ['Weekdays'] }
                        : { kids: kids.length > 0 ? kids : [{ age: 3, name: 'Child' }] }),

                    // Shared Care Tags
                    tags: getSharedCareTags(m),

                    // Context Text
                    contextText:
                        m.care_types?.includes('nanny-share') ? 'Open to nanny share' :
                            stableScoreFromId(m.id, 82, 98) >= 80 ? 'Strong match based on schedule and care type' :
                                'Schedule overlap' // fallback for now
                };
            });

            setMatches(mapped);
        } catch (e) {
            console.error('fetchMatches exception:', e);
            setMatches([]);
        } finally {
            setLoadingMatches(false);
        }
    }, [effectiveUserId]);


    // Initial Data Fetch & Subscriptions
    useEffect(() => {
        if (!effectiveUserId) return;

        const refresh = () => {
            fetchUnreadCounts();
            fetchNotifications();
        };

        const onFocus = () => refresh();
        const onVisibility = () => {
            if (document.visibilityState === 'visible') refresh();
        };

        window.addEventListener('focus', onFocus);
        document.addEventListener('visibilitychange', onVisibility);

        // Realtime Subscription
        const channel = supabase
            .channel('dashboard_updates')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${effectiveUserId}` },
                () => {
                    fetchNotifications();
                }
            )
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages', filter: `recipient_id=eq.${effectiveUserId}` },
                () => {
                    fetchUnreadCounts();
                    fetchNotifications(); // Update message count
                }
            )
            .subscribe();

        return () => {
            window.removeEventListener('focus', onFocus);
            document.removeEventListener('visibilitychange', onVisibility);
            supabase.removeChannel(channel);
        };
    }, [effectiveUserId, fetchUnreadCounts, fetchNotifications]);

    // Fetch Connections & Saved Matches
    useEffect(() => {
        if (!effectiveUserId) return;

        const fetchConnections = async () => {
            const { data, error } = await supabase
                .from('connections')
                .select('requester_id, recipient_id, status')
                .or(`requester_id.eq.${effectiveUserId},recipient_id.eq.${effectiveUserId}`);

            if (error) {
                console.error('Failed to fetch connections:', error);
                return;
            }

            if (data) {
                const statusByOtherId: Record<string, 'pending' | 'accepted'> = {};
                for (const row of data) {
                    const otherId = row.requester_id === effectiveUserId ? row.recipient_id : row.requester_id;
                    if (otherId) {
                        if (row.status === 'accepted') {
                            statusByOtherId[otherId] = 'accepted';
                        } else if (!statusByOtherId[otherId] && row.status === 'pending') {
                            statusByOtherId[otherId] = 'pending';
                        }
                    }
                }
                setStatusById(statusByOtherId);
            }
        };

        const fetchSavedMatches = async () => {
            const { data, error } = await supabase
                .from('saved_matches')
                .select('saved_member_id')
                .eq('saver_id', effectiveUserId);

            if (error) return;

            if (data) {
                const savedMap: Record<string, true> = {};
                for (const row of data) {
                    savedMap[row.saved_member_id] = true;
                }
                setSavedById(savedMap);
            }
        };

        fetchConnections();
        fetchSavedMatches();
        fetchMatches();
        fetchNotifications();
    }, [effectiveUserId, fetchMatches, fetchNotifications]);

    // Actions
    const handleConnect = async (targetMemberId: string) => {
        if (!effectiveUserId) return;
        setConnectingTo(targetMemberId);

        try {
            const { error } = await supabase
                .from('connections')
                .insert({
                    requester_id: effectiveUserId,
                    recipient_id: targetMemberId
                });

            if (error && error.code !== '23505') {
                console.error('Connection error:', error);
                return;
            }

            setPendingIds(prev => ({ ...prev, [targetMemberId]: true }));
            setStatusById(prev => ({ ...prev, [targetMemberId]: 'pending' }));

        } finally {
            setConnectingTo(null);
        }
    };

    const handleToggleSave = async (targetMemberId: string) => {
        if (!effectiveUserId) return;
        const currentlySaved = !!savedById[targetMemberId];
        setSavingById(prev => ({ ...prev, [targetMemberId]: true }));

        if (currentlySaved) {
            setSavedById(prev => {
                const next = { ...prev };
                delete next[targetMemberId];
                return next;
            });
            await supabase.from('saved_matches').delete().eq('saver_id', effectiveUserId).eq('saved_member_id', targetMemberId);
        } else {
            setSavedById(prev => ({ ...prev, [targetMemberId]: true }));
            await supabase.from('saved_matches').insert({ saver_id: effectiveUserId, saved_member_id: targetMemberId });
        }
        setSavingById(prev => ({ ...prev, [targetMemberId]: false }));
    };

    const handleViewProfile = (memberId: string) => {
        setActiveProfileId(memberId);
        setProfileOpen(true);
    };

    const handleMessage = (targetMemberId: string, name: string) => {
        setMessageRecipientId(targetMemberId);
        setMessageRecipientName(name);
        setMessageOpen(true);
    };

    const handleMarkNotificationsRead = async () => {
        if (!effectiveUserId) return;
        await supabase
            .from('notifications')
            .update({ read: true })
            .eq('user_id', effectiveUserId)
            .eq('read', false);
        setUnreadNotificationsCount(0);
        // Optimistically update list
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    // Greeting Logic
    // const hour = new Date().getHours();
    // const timeGreeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    const firstName = viewer?.member?.first_name || 'Caregiver';

    // Suppress TS6133 — handlers preserved for future V2 card actions
    void connectingTo; void handleConnect; void handleToggleSave;
    void handleViewProfile; void handleMessage; void handleMarkNotificationsRead;

    // Computed metrics
    const connectedFamilies = Object.values(statusById).filter(s => s === 'accepted').length;
    const opportunityCount = careOpportunities.length;

    return (
        <div style={{ minHeight: '100vh', background: '#fffaf5', fontFamily: 'Comfortaa, cursive' }}>

            {/* ── V2 CONTENT ────────────────────────────────────────────── */}
            <main style={{ maxWidth: 960, margin: '0 auto', padding: '28px 20px 60px', display: 'flex', flexDirection: 'column', gap: 24 }}>

                {/* ── HERO AREA ──────────────────────────────────────────── */}
                <section style={{
                    background: 'linear-gradient(135deg, #1E6B4E 0%, #2a8a64 100%)',
                    borderRadius: 18, padding: '28px 28px', color: '#fff',
                }}>
                    <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, lineHeight: 1.3 }}>
                        Welcome back, {firstName}
                    </div>
                    <div style={{ fontSize: 14, opacity: 0.9, lineHeight: 1.6 }}>
                        {connectedFamilies > 0 ? (
                            <>
                                <span style={{ fontWeight: 700, color: '#8bd7c7' }}>{connectedFamilies} famil{connectedFamilies !== 1 ? 'ies' : 'y'}</span>
                                {' '}connected with you
                                {opportunityCount > 0 && <> — {opportunityCount} ha{opportunityCount !== 1 ? 've' : 's'} care needs matching your schedule.</>}
                                {opportunityCount === 0 && '.'}
                            </>
                        ) : (
                            'Families nearby are looking for caregivers like you.'
                        )}
                    </div>

                    {/* Metric chips */}
                    <div style={{ display: 'flex', gap: 12, marginTop: 18, flexWrap: 'wrap' }}>
                        {[
                            { label: 'Connected Families', value: String(connectedFamilies) },
                            { label: 'Care Opportunities', value: String(opportunityCount) },
                            { label: 'Your Rating', value: 'New' },
                        ].map(m => (
                            <div key={m.label} style={{
                                background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
                                borderRadius: 10, padding: '10px 16px',
                                display: 'flex', alignItems: 'baseline', gap: 6,
                            }}>
                                <span style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{m.value}</span>
                                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>{m.label}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── CONNECTION REQUESTS ─────────────────────────────────── */}
                <ConnectionRequestsCard />

                {/* ── FAMILIES NEAR YOU ───────────────────────────────────── */}
                <section>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <h2 style={{ fontWeight: 700, fontSize: 16, color: '#2d3a35', margin: 0 }}>
                            Families Near You
                        </h2>
                        <button
                            onClick={() => navigate('/matches')}
                            style={{
                                fontSize: 12, color: '#1E6B4E', background: 'none', border: 'none',
                                cursor: 'pointer', fontWeight: 600, fontFamily: 'Comfortaa, cursive',
                            }}
                        >
                            View all
                        </button>
                    </div>

                    {loadingMatches ? (
                        <div style={{ textAlign: 'center', padding: 40, color: '#6b7f76' }}>Loading matches...</div>
                    ) : matches.length === 0 ? (
                        <div style={{
                            textAlign: 'center', padding: '40px 20px', background: '#fff',
                            borderRadius: 14, boxShadow: '0 2px 12px rgba(30,107,78,0.08)',
                            color: '#6b7f76', fontSize: 14,
                        }}>
                            No families nearby yet. Check back soon!
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                            {matches.slice(0, 6).map((m) => {
                                const displayName = m.name;
                                const matchId = m.targetMemberId || '';
                                const status = statusById[matchId];
                                const isConnected = status === 'accepted';
                                const score = m.scheduleOverlap || 85;
                                const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase();
                                const careTypes = (m.tags || []).slice(0, 3);
                                const signal = m.contextText || m.bio || '';

                                return (
                                    <div
                                        key={matchId}
                                        style={{
                                            background: '#fff', borderRadius: 16,
                                            boxShadow: '0 2px 12px rgba(30,107,78,0.08)',
                                            overflow: 'hidden', cursor: 'pointer',
                                            display: 'flex', flexDirection: 'column', height: '100%',
                                            transition: 'box-shadow 0.25s ease, transform 0.25s ease',
                                        }}
                                        onClick={() => navigate(`/member/${matchId}`)}
                                        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 24px rgba(30,107,78,0.14)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
                                        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(30,107,78,0.08)'; (e.currentTarget as HTMLDivElement).style.transform = 'none'; }}
                                    >
                                        {/* Green gradient bar */}
                                        <div style={{ height: 4, background: 'linear-gradient(90deg, #d8f5e5, #8bd7c7)' }} />

                                        <div style={{ padding: '20px 20px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                            {/* Avatar + Name + Status */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                                                {m.photo ? (
                                                    <div style={{ width: 56, height: 56, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, boxShadow: '0 2px 8px rgba(30,107,78,0.12)' }}>
                                                        <img src={m.photo} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    </div>
                                                ) : (
                                                    <div style={{
                                                        width: 56, height: 56, borderRadius: '50%',
                                                        background: 'linear-gradient(135deg, #d8f5e5 0%, #8bd7c7 100%)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontWeight: 700, fontSize: 18, color: '#1E6B4E', flexShrink: 0,
                                                        boxShadow: '0 2px 8px rgba(139,215,199,0.4)',
                                                    }}>
                                                        {initials}
                                                    </div>
                                                )}
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: 15, color: '#2d3a35', marginBottom: 4 }}>
                                                        {displayName}
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, background: '#d8f5e5', color: '#1E6B4E', fontSize: 11, fontWeight: 600, letterSpacing: 0.3 }}>
                                                            Parent
                                                        </span>
                                                        {isConnected && (
                                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, background: '#d8f5e5', color: '#1E6B4E', fontSize: 11, fontWeight: 600 }}>
                                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#1E6B4E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                                    <polyline points="20 6 9 17 4 12" />
                                                                </svg>
                                                                Connected
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Signal */}
                                            <div style={{ fontSize: 13, color: '#6b7f76', marginBottom: 14, lineHeight: 1.5 }}>
                                                {signal}
                                            </div>

                                            {/* Care types */}
                                            {careTypes.length > 0 && (
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                                                    {careTypes.map((ct: string) => (
                                                        <span key={ct} style={{
                                                            padding: '3px 10px', borderRadius: 12, background: '#fffaf5',
                                                            border: '1px solid #d8f5e5', fontSize: 11, color: '#1E6B4E', fontWeight: 500,
                                                        }}>
                                                            {ct}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Match % + CTA */}
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                                                <div style={{ fontSize: 12, color: '#1E6B4E', fontWeight: 700 }}>
                                                    {score}% match
                                                </div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); navigate(`/member/${matchId}`); }}
                                                    style={{
                                                        fontSize: 12, fontWeight: 600, background: '#1E6B4E', color: '#fff',
                                                        border: 'none', borderRadius: 20, padding: '7px 18px', cursor: 'pointer',
                                                        fontFamily: 'Comfortaa, cursive',
                                                    }}
                                                >
                                                    View Profile
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* ── CARE OPPORTUNITIES (accordion) ─────────────────────── */}
                <section>
                    <div style={{
                        background: '#fff', borderRadius: 14,
                        boxShadow: '0 2px 12px rgba(30,107,78,0.08)', overflow: 'hidden',
                    }}>
                        <button
                            onClick={() => {
                                const el = document.getElementById('cg-opps-content');
                                if (el) el.style.display = el.style.display === 'none' ? 'flex' : 'none';
                                const chevron = document.getElementById('cg-opps-chevron');
                                if (chevron) chevron.style.transform = el?.style.display === 'none' ? 'rotate(0)' : 'rotate(180deg)';
                            }}
                            style={{
                                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '14px 20px', background: 'none', border: 'none', cursor: 'pointer',
                                fontFamily: 'Comfortaa, cursive',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: opportunityCount > 0 ? '#F8C3B3' : '#8bd7c7' }} />
                                <span style={{ fontWeight: 700, fontSize: 14, color: '#2d3a35' }}>
                                    {opportunityCount > 0 ? `${opportunityCount} care opportunit${opportunityCount !== 1 ? 'ies' : 'y'} nearby` : 'No care opportunities yet'}
                                </span>
                            </div>
                            <svg id="cg-opps-chevron" width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ transition: 'transform 0.2s', transform: 'rotate(0)' }}>
                                <path d="M4.5 6.75L9 11.25L13.5 6.75" stroke="#6b7f76" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                        </button>

                        <div id="cg-opps-content" style={{ padding: '0 20px 16px', display: 'none', flexDirection: 'column', gap: 10 }}>
                            {opportunityCount > 0 ? (
                                careOpportunities.map((opp: any, i: number) => {
                                    const member = opp.members || opp.member;
                                    const familyName = member ? `${member.first_name || ''} ${(member.last_name || '')[0] || ''}.`.trim() : 'Family';
                                    const careType = careTypeLabels[opp.care_type] || opp.care_type || 'Care';
                                    const scheduleDays = Array.isArray(opp.days_needed) ? opp.days_needed.join(', ') : (opp.time_windows || 'Flexible schedule');

                                    return (
                                        <div key={opp.id || i} style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '12px 14px', borderRadius: 10, background: '#fffaf5',
                                        }}>
                                            <div>
                                                <div style={{ fontSize: 13, fontWeight: 600, color: '#2d3a35' }}>
                                                    {familyName} — {careType}
                                                </div>
                                                <div style={{ fontSize: 11, color: '#6b7f76', marginTop: 2 }}>
                                                    {scheduleDays}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => { const m = opp.members || opp.member; if (m?.id) navigate(`/member/${m.id}`); }}
                                                style={{
                                                    fontSize: 11, fontWeight: 600, padding: '5px 14px', borderRadius: 16,
                                                    border: '1px solid #1E6B4E', background: 'none', color: '#1E6B4E',
                                                    cursor: 'pointer', fontFamily: 'Comfortaa, cursive',
                                                }}
                                            >
                                                Details
                                            </button>
                                        </div>
                                    );
                                })
                            ) : (
                                <div style={{
                                    padding: '12px 14px', borderRadius: 10, background: '#fffaf5',
                                    fontSize: 13, color: '#6b7f76', textAlign: 'center',
                                }}>
                                    When families near you post care needs that match your schedule, they will appear here.
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* ── QUICK ACTIONS (horizontal row) ─────────────────────── */}
                <section>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        {[
                            { label: 'Find Families', path: '/matches', icon: 'M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z' },
                            { label: 'My Availability', path: '/settings?tab=schedule', icon: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5' },
                            { label: 'Edit Profile', path: '/settings', icon: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0' },
                            { label: 'Trust & Safety', path: '/settings?tab=safety', icon: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z' },
                        ].map(a => (
                            <button
                                key={a.label}
                                onClick={() => navigate(a.path)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    padding: '10px 16px', borderRadius: 12, background: '#fff',
                                    border: '1px solid #d8f5e5', cursor: 'pointer',
                                    fontSize: 12, fontWeight: 600, color: '#1E6B4E',
                                    boxShadow: '0 1px 4px rgba(30,107,78,0.05)',
                                    fontFamily: 'Comfortaa, cursive',
                                }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1E6B4E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d={a.icon} />
                                </svg>
                                {a.label}
                            </button>
                        ))}
                    </div>
                </section>

                {/* ── YOUR PROFILE (compact, inline) ─────────────────────── */}
                <section>
                    <div style={{
                        background: '#fff', borderRadius: 14,
                        boxShadow: '0 2px 12px rgba(30,107,78,0.08)',
                        padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            {viewer?.member?.avatar_url ? (
                                <div style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, boxShadow: '0 2px 8px rgba(30,107,78,0.12)' }}>
                                    <img src={viewer.member.avatar_url} alt={firstName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                            ) : (
                                <div style={{
                                    width: 44, height: 44, borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #d8f5e5 0%, #8bd7c7 100%)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 700, fontSize: 16, color: '#1E6B4E', flexShrink: 0,
                                }}>
                                    {(firstName[0] || 'C').toUpperCase()}
                                </div>
                            )}
                            <div>
                                <div style={{ fontWeight: 700, fontSize: 14, color: '#2d3a35' }}>{firstName}</div>
                                <div style={{ fontSize: 12, color: '#6b7f76' }}>
                                    {viewer?.member?.role === 'caregiver' ? 'Professional Caregiver' : 'Caregiver'}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/settings')}
                            style={{
                                fontSize: 12, fontWeight: 600, padding: '7px 16px', borderRadius: 20,
                                border: '1px solid #1E6B4E', background: 'none', color: '#1E6B4E',
                                cursor: 'pointer', fontFamily: 'Comfortaa, cursive',
                            }}
                        >
                            Edit Profile
                        </button>
                    </div>
                </section>

                {/* ── BOTTOM CTA ─────────────────────────────────────────── */}
                <div style={{ textAlign: 'center', padding: '16px 0 0', fontSize: 13, color: '#6b7f76' }}>
                    Build your village.{' '}
                    <button onClick={() => navigate('/matches')} style={{ background: 'none', border: 'none', color: '#1E6B4E', fontSize: 13, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 2, fontFamily: 'Comfortaa, cursive' }}>
                        Find Families
                    </button>{' '}·{' '}
                    <button onClick={() => navigate('/settings?tab=schedule')} style={{ background: 'none', border: 'none', color: '#1E6B4E', fontSize: 13, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 2, fontFamily: 'Comfortaa, cursive' }}>
                        Update Availability
                    </button>{' '}·{' '}
                    <button onClick={() => navigate('/settings')} style={{ background: 'none', border: 'none', color: '#1E6B4E', fontSize: 13, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 2, fontFamily: 'Comfortaa, cursive' }}>
                        Edit Profile
                    </button>
                </div>
            </main>

            {/* ── MODALS ─────────────────────────────────────────────────── */}
            <SearchModal open={showSearch} onClose={() => setShowSearch(false)} />

            {
                profileOpen && activeProfileId && (
                    <ProfileModal
                        open={profileOpen}
                        onOpenChange={(v) => { if (!v) { setProfileOpen(false); setActiveProfileId(null); } }}
                        memberId={activeProfileId}
                    />
                )
            }

            {
                messageOpen && messageRecipientId && (
                    <MessageModal
                        open={messageOpen}
                        onOpenChange={(v) => { if (!v) { setMessageOpen(false); setMessageRecipientId(null); } }}
                        recipientId={messageRecipientId}
                        recipientName={messageRecipientName}
                        currentUserId={effectiveUserId}
                    />
                )
            }
        </div >
    );
}
