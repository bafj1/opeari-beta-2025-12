
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { useViewer } from '../../../hooks/useViewer';
import { useNavigate, Link } from 'react-router-dom';
import MatchCard, { type MatchCardProps } from '../NorthStar/MatchCard';
import ProfileModal from '../NorthStar/ProfileModal';
import MessageModal from '../NorthStar/MessageModal';
import SearchModal from '../NorthStar/SearchModal';
import ConnectionRequestsCard from '../ConnectionRequestsCard';
import {
    Search, Settings, Bell, MessageCircle, User, Calendar, ArrowRight
} from 'lucide-react';

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

function SharedCareTag({ label }: { label: string }) {
    return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#8bd7c7]/20 text-[#1e6b4e] border border-[#8bd7c7]/30">
            {label}
        </span>
    );
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

// ===================================
// Components
// ===================================

function NotificationDropdown({
    notifications,
    unreadCount,
    onClose,
    onMarkRead
}: {
    notifications: any[],
    unreadCount: number,
    onClose: () => void,
    onMarkRead: () => void
}) {
    useEffect(() => {
        // Mark as read after a delay
        const timer = setTimeout(() => {
            onMarkRead();
        }, 2000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div
            className="absolute top-12 right-0 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden"
            role="dialog"
            aria-label="Notifications"
        >
            <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="text-sm font-bold text-[#1e6b4e]">Notifications</h3>
                {unreadCount > 0 && (
                    <span className="text-xs bg-[#c97e6e] text-white px-2 py-0.5 rounded-full">
                        {unreadCount} new
                    </span>
                )}
            </div>
            <div className="max-h-[320px] overflow-y-auto">
                {notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-sm">
                        No notifications yet
                    </div>
                ) : (
                    notifications.map(n => (
                        <div
                            key={n.id}
                            className={`p-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${!n.read ? 'bg-[#d8f5e5]/10' : ''}`}
                            role="article"
                            aria-label={`Notification: ${n.title || n.message || 'New notification'}`}
                        >
                            <div className="flex gap-3">
                                <div className="mt-1">
                                    {n.type?.includes('message') ? (
                                        <div className="p-1.5 bg-blue-100 rounded-full text-blue-600">
                                            <MessageCircle className="w-3.5 h-3.5" />
                                        </div>
                                    ) : (
                                        <div className="p-1.5 bg-[#d8f5e5] rounded-full text-[#1e6b4e]">
                                            <Bell className="w-3.5 h-3.5" />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm text-gray-800 line-clamp-2">{n.title || n.message || 'New notification'}</p>
                                    {n.body && <p className="text-xs text-[#546E5C] mt-0.5 line-clamp-1">{n.body}</p>}
                                    <p className="text-xs text-gray-400 mt-1">
                                        {new Date(n.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
            <Link
                to="/notifications"
                className="block p-3 text-center text-xs font-bold text-[#1e6b4e] hover:bg-gray-50 border-t border-gray-100"
                onClick={onClose}
            >
                View All Notifications
            </Link>
        </div>
    );
}

function MobileQuickActions({ onNavigate }: { onNavigate: (path: string) => void }) {
    return (
        <div className="lg:hidden mt-8 space-y-4">
            {/* Quick Actions - Mobile */}
            <section className="bg-white rounded-[20px] p-5 shadow-sm border border-gray-100">
                <h3 className="text-sm font-bold text-[#1e6b4e] uppercase tracking-wide mb-3">
                    Quick Actions
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={() => onNavigate('/matches')}
                        className="flex flex-col items-center gap-2 p-4 rounded-[15px] border border-gray-100 hover:border-[#8bd7c7] hover:bg-[#d8f5e5]/30 transition-all text-center"
                        aria-label="Browse families near you"
                    >
                        <Search className="w-5 h-5 text-[#6B9080]" />
                        <span className="text-xs font-semibold text-[#1e6b4e]">Browse Families</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => onNavigate('/calendar')}
                        className="flex flex-col items-center gap-2 p-4 rounded-[15px] border border-gray-100 hover:border-[#8bd7c7] hover:bg-[#d8f5e5]/30 transition-all text-center"
                        aria-label="View and update your availability"
                    >
                        <Calendar className="w-5 h-5 text-[#7BA99D]" />
                        <span className="text-xs font-semibold text-[#1e6b4e]">My Availability</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => onNavigate('/settings')}
                        className="flex flex-col items-center gap-2 p-4 rounded-[15px] border border-gray-100 hover:border-[#8bd7c7] hover:bg-[#d8f5e5]/30 transition-all text-center"
                        aria-label="Update your profile"
                    >
                        <User className="w-5 h-5 text-[#D4A59A]" />
                        <span className="text-xs font-semibold text-[#1e6b4e]">Update Profile</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => onNavigate('/settings?tab=safety')}
                        className="flex flex-col items-center gap-2 p-4 rounded-[15px] border border-gray-100 hover:border-[#8bd7c7] hover:bg-[#d8f5e5]/30 transition-all text-center"
                        aria-label="View trust and verification status"
                    >
                        <Settings className="w-5 h-5 text-[#C9A0AB]" />
                        <span className="text-xs font-semibold text-[#1e6b4e]">Verification</span>
                    </button>
                </div>
            </section>
        </div>
    );
}

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
                        care_type,
                        description,
                        schedule_days,
                        schedule_time,
                        start_date,
                        is_active,
                        created_at,
                        member:members!care_needs_member_id_fkey (
                            id, first_name, last_name, neighborhood, avatar_url
                        )
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

    return (
        <div className="min-h-screen font-sans text-opeari-text pb-20 bg-[#d8f5e5]" style={{ fontFamily: 'Comfortaa, sans-serif' }}>

            {/* 1. Sticky Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
                    {/* Logo Section */}
                    <div className="flex items-center gap-3 sm:gap-4">
                        <Link to="/dashboard" className="flex items-center gap-2 group">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#1e6b4e] rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300">
                                <span className="text-white font-bold text-lg sm:text-xl">O</span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-bold text-[#1e6b4e] tracking-tight">opeari</h1>
                        </Link>
                        {/* Role Indicator */}
                        <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-[50px] bg-[#d8f5e5] text-[#1e6b4e]">
                            <User className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                            <span className="text-xs sm:text-sm font-semibold hidden sm:inline">Caregiver</span>
                        </div>
                    </div>

                    {/* Desktop Nav */}
                    <div className="flex items-center gap-2 sm:gap-4">
                        <button
                            onClick={() => setShowSearch(true)}
                            className="p-2 sm:p-2.5 hover:bg-[#d8f5e5]/50 rounded-full text-[#1E6B4E] transition-colors focus:outline-none focus:ring-2 focus:ring-[#8bd7c7] focus:ring-offset-1"
                            aria-label="Search"
                        >
                            <Search className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>

                        <div className="relative">
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="p-2 sm:p-2.5 hover:bg-[#d8f5e5]/50 rounded-full text-[#1E6B4E] transition-colors focus:outline-none focus:ring-2 focus:ring-[#8bd7c7] focus:ring-offset-1"
                                aria-label={unreadNotificationsCount > 0 ? `Notifications, ${unreadNotificationsCount} unread` : 'Notifications'}
                            >
                                <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
                                {unreadNotificationsCount > 0 && (
                                    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#c97e6e] rounded-full border-2 border-white animate-pulse" />
                                )}
                            </button>

                            {/* Notifications Dropdown */}
                            {showNotifications && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                                    <NotificationDropdown
                                        notifications={notifications}
                                        unreadCount={unreadNotificationsCount}
                                        onClose={() => setShowNotifications(false)}
                                        onMarkRead={handleMarkNotificationsRead}
                                    />
                                </>
                            )}
                        </div>

                        <Link
                            to="/messages"
                            className="p-2 sm:p-2.5 hover:bg-[#d8f5e5]/50 rounded-full text-[#1E6B4E] transition-colors relative focus:outline-none focus:ring-2 focus:ring-[#8bd7c7] focus:ring-offset-1"
                            aria-label={unreadMsgCount > 0 ? `Messages, ${unreadMsgCount} unread` : 'Messages'}
                        >
                            <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                            {unreadMsgCount > 0 && (
                                <span className="absolute top-1 sm:top-1.5 right-1 sm:right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#c97e6e] text-[10px] font-bold text-white ring-2 ring-white">
                                    {unreadMsgCount}
                                </span>
                            )}
                        </Link>

                        <button
                            onClick={() => navigate('/settings')}
                            className="hidden sm:block p-2.5 hover:bg-[#d8f5e5]/50 rounded-full text-[#1E6B4E] transition-colors focus:outline-none focus:ring-2 focus:ring-[#8bd7c7] focus:ring-offset-1"
                            aria-label="Settings"
                        >
                            <Settings className="w-6 h-6" />
                        </button>

                        <button
                            onClick={() => navigate('/settings')}
                            className="ml-1 sm:ml-2 h-9 w-9 sm:h-10 sm:w-10 rounded-full overflow-hidden border-2 border-white shadow-sm hover:border-[#8bd7c7] transition-all focus:outline-none focus:ring-2 focus:ring-[#8bd7c7] focus:ring-offset-1"
                            aria-label="Your profile and settings"
                        >
                            {viewer?.member?.avatar_url ? (
                                <img
                                    src={viewer.member.avatar_url}
                                    alt="Profile"
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="h-full w-full bg-[#1e6b4e] flex items-center justify-center text-white font-bold text-lg">
                                    {viewer?.member?.first_name?.[0] || <User className="w-5 h-5" />}
                                </div>
                            )}
                        </button>
                    </div>
                </div>
            </header>

            {/* 2. Greeting Banner */}
            <div className="bg-[#d8f5e5] border-b border-[#8bd7c7]/30">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            {(() => {
                                const acceptedCount = Object.values(statusById).filter(s => s === 'accepted').length;
                                const isNew = acceptedCount === 0;

                                return (
                                    <>
                                        <h2 className="text-2xl sm:text-3xl font-bold text-[#1e6b4e] mb-2 tracking-tight">
                                            {isNew ? 'Families nearby are looking for caregivers like you.' : 'Welcome back — your care circle is growing.'}
                                        </h2>
                                        <p className="text-[#546E5C] text-sm sm:text-base font-medium">
                                            {unreadNotificationsCount > 0
                                                ? `You have ${unreadNotificationsCount} new updates in your village.`
                                                : "Welcome to your village."}
                                        </p>
                                    </>
                                );
                            })()}
                        </div>
                        <Link
                            to="/settings?tab=notifications"
                            className="hidden sm:flex items-center gap-1 text-sm font-bold text-[#1e6b4e] hover:text-[#155a3e] transition-colors group"
                        >
                            {/* Placeholder for View Notifications link behavior if needed */}
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">

                {/* 3. Connection Requests - Full Width */}
                <div className="mb-8">
                    <ConnectionRequestsCard />
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                    {/* Left Column (2/3) */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* 2. Families Near You (Moved Up) */}
                        <section className="bg-white rounded-[20px] p-6 shadow-sm border border-gray-100 mb-8">
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <h2 className="text-lg sm:text-xl font-bold text-[#1e6b4e] tracking-tight mb-1">
                                        Families Near You
                                    </h2>
                                    <p className="text-sm text-[#546E5C]/80">
                                        Families with care needs that match your experience and availability
                                    </p>
                                </div>
                                <Link to="/matches" className="text-sm text-[#1e6b4e] font-semibold hover:underline flex items-center gap-1 mt-1">
                                    View All <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>

                            <div className="flex flex-col gap-6">
                                {loadingMatches ? (
                                    <div className="flex justify-center py-12">
                                        <p className="text-[#1e6b4e] animate-pulse" role="status" aria-live="polite">Loading matches...</p>
                                    </div>
                                ) : matches.length === 0 ? (
                                    <div className="bg-white rounded-2xl p-8 text-center border border-[#8bd7c7]/30">
                                        <h3 className="text-[#1e6b4e] font-bold text-lg mb-2">Your neighborhood is growing</h3>
                                        <p className="text-[#546E5C] text-sm mb-6 max-w-md mx-auto">
                                            Families in your area are joining Opeari. As more families sign up, you'll see matches based on your schedule and experience.
                                        </p>
                                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                                            <button
                                                onClick={() => navigate('/settings?tab=schedule')}
                                                className="px-6 py-2 bg-[#1e6b4e] text-white rounded-full font-semibold text-sm hover:bg-[#155a3e] transition-colors"
                                            >
                                                Update Your Availability
                                            </button>
                                            {/* Optional secondary if Invite modal supported, else link to matches or skip */}
                                            {/* Assuming Invite is not primary for caregiver or just skip for now to save complexity */}
                                        </div>
                                    </div>
                                ) : (
                                    matches.map(match => {
                                        const isSelf = !!effectiveUserId && effectiveUserId === match.targetMemberId;
                                        const dbStatus = statusById[match.targetMemberId];
                                        const localPending = pendingIds[match.targetMemberId];

                                        const connectionStatus: 'none' | 'pending' | 'accepted' =
                                            isSelf ? 'pending' :
                                                dbStatus ? dbStatus :
                                                    localPending ? 'pending' : 'none';

                                        const canViewProfile = connectionStatus === 'accepted';
                                        const connectReady = !!effectiveUserId;

                                        return (
                                            <MatchCard
                                                key={match.id}
                                                {...match}
                                                onConnect={connectReady ? handleConnect : undefined}
                                                connectionStatus={connectionStatus}
                                                isConnecting={connectingTo === match.targetMemberId}
                                                canViewProfile={canViewProfile}
                                                onViewProfile={handleViewProfile}
                                                isSaved={!!savedById[match.targetMemberId]}
                                                isSaving={!!savingById[match.targetMemberId]}
                                                onToggleSave={handleToggleSave}
                                                canMessage={connectionStatus === 'accepted'}
                                                onMessage={() => handleMessage(match.targetMemberId, match.name)}
                                                unreadCount={unreadByMemberId[match.targetMemberId] || 0}
                                            />
                                        );
                                    })
                                )}
                            </div>
                        </section>

                        {/* 3. Shared Care Opportunities (Moved Down) */}
                        <section className="bg-white rounded-[20px] p-6 shadow-sm border border-gray-100">
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <h2 className="text-lg sm:text-xl font-bold text-[#1e6b4e] tracking-tight mb-1">
                                        Shared Care Opportunities
                                    </h2>
                                    <p className="text-sm text-[#546E5C]/80">
                                        Families looking for trusted caregivers to share ongoing care
                                    </p>
                                </div>
                            </div>

                            {loadingOpportunities ? (
                                <div
                                    className="space-y-4"
                                    role="status"
                                    aria-label="Loading care opportunities"
                                >
                                    {[1, 2].map(i => (
                                        <div key={i} className="animate-pulse bg-gray-100 rounded-[15px] h-24" />
                                    ))}
                                </div>
                            ) : careOpportunities.length === 0 ? (
                                <div className="bg-[#d8f5e5]/30 rounded-[15px] p-8 text-center">
                                    <h3 className="text-[#1e6b4e] font-bold text-lg mb-2">Care opportunities are on the way</h3>
                                    <p className="text-[#546E5C] text-sm mb-6 max-w-md mx-auto">
                                        When families near you post shared care needs that match your schedule, they'll appear here.
                                    </p>
                                    <Link
                                        to="/matches"
                                        className="inline-block px-6 py-2 bg-[#1e6b4e] text-white rounded-full font-semibold text-sm hover:bg-[#155a3e] transition-colors"
                                    >
                                        Browse Families
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {careOpportunities.map(opp => {
                                        const member = Array.isArray(opp.member) ? opp.member[0] : opp.member;
                                        const familyName = member
                                            ? `${member.first_name || ''} ${member.last_name?.[0] || ''}.`.trim()
                                            : 'A family';
                                        const careLabel = careTypeLabels[opp.care_type] || opp.care_type || 'Care needed';
                                        const scheduleDays = opp.schedule_days as string[] | null;
                                        const daysText = scheduleDays?.length
                                            ? scheduleDays.map((d: string) => d.charAt(0).toUpperCase() + d.slice(1, 3)).join(', ')
                                            : 'Flexible schedule';
                                        const timeText = opp.schedule_time || '';
                                        const neighborhood = member?.neighborhood || '';
                                        const isShared = opp.care_type === 'nanny-share' || opp.care_type === 'co-share';
                                        const shareLabel = opp.care_type === 'nanny-share' ? 'Open to nanny share' : 'Looking for shared care';

                                        return (
                                            <div
                                                key={opp.id}
                                                className="flex items-start gap-4 p-4 rounded-[15px] border border-gray-100 hover:border-[#8bd7c7] hover:shadow-sm transition-all cursor-pointer relative"
                                                onClick={() => {
                                                    if (member?.id) handleViewProfile(member.id);
                                                }}
                                                role="button"
                                                tabIndex={0}
                                                aria-label={`Care opportunity: ${careLabel} from ${familyName}`}
                                                onKeyDown={(e) => {
                                                    if ((e.key === 'Enter' || e.key === ' ') && member?.id) {
                                                        e.preventDefault();
                                                        handleViewProfile(member.id);
                                                    }
                                                }}
                                            >
                                                {/* Avatar */}
                                                <div className="flex-shrink-0">
                                                    {member?.avatar_url ? (
                                                        <img
                                                            src={member.avatar_url}
                                                            alt={familyName}
                                                            className="w-12 h-12 rounded-full object-cover border-2 border-[#8bd7c7]/30"
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-full bg-[#d8f5e5] flex items-center justify-center text-[#1e6b4e] font-bold text-lg">
                                                            {member?.first_name?.[0] || '?'}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Details */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-semibold text-[#1e6b4e] text-sm">{familyName}</span>
                                                        {neighborhood && (
                                                            <span className="text-xs text-[#546E5C]/70">{neighborhood}</span>
                                                        )}
                                                        {isShared && (
                                                            <span className="bg-[#8bd7c7]/20 text-[#1e6b4e] text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto sm:ml-2">
                                                                {shareLabel}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm font-medium text-[#546E5C] mb-1">{careLabel}</p>
                                                    <div className="flex items-center gap-2 text-xs text-[#546E5C]/70">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        <span>{daysText}{timeText ? ` · ${timeText}` : ''}</span>
                                                    </div>

                                                    {/* Shared care indicators */}
                                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                                        {opp.care_type === 'nanny-share' && (
                                                            <SharedCareTag label="Nanny share" />
                                                        )}
                                                        {opp.care_type === 'co-share' && (
                                                            <SharedCareTag label="Co-share family" />
                                                        )}
                                                        {opp.also_open_to?.includes('nanny-share') && opp.care_type !== 'nanny-share' && (
                                                            <SharedCareTag label="Also open to nanny share" />
                                                        )}
                                                        {opp.also_open_to?.includes('backup-care') && opp.care_type !== 'backup-care' && (
                                                            <SharedCareTag label="Wants backup care" />
                                                        )}
                                                    </div>
                                                    {opp.description && (
                                                        <p className="text-xs text-[#546E5C]/60 mt-1 line-clamp-2">{opp.description}</p>
                                                    )}
                                                </div>

                                                {/* Arrow */}
                                                <ArrowRight className="w-4 h-4 text-[#8bd7c7] flex-shrink-0 mt-1" />
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </section>
                    </div>

                    {/* Right Column - Sidebar (1/3) */}
                    <aside className="hidden lg:block space-y-6 lg:sticky lg:top-24 lg:self-start">
                        {/* Quick Actions */}
                        <section className="bg-white rounded-[20px] p-6 shadow-sm border border-gray-100">
                            <h3 className="text-sm font-bold text-[#1e6b4e] uppercase tracking-wide mb-4">
                                Quick Actions
                            </h3>
                            <div className="space-y-2">
                                <Link
                                    to="/matches"
                                    className="w-full flex items-start gap-3 px-4 py-3 rounded-[15px] border border-[#8bd7c7] bg-[#d8f5e5] hover:bg-[#c0e8d5] shadow-sm transition-all text-left"
                                >
                                    <Search className="w-5 h-5 text-[#1e6b4e] mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-bold text-[#1e6b4e]">Connect with Families</p>
                                        <p className="text-xs text-[#546E5C]">Find your next care partnership</p>
                                    </div>
                                </Link>

                                <button
                                    type="button"
                                    onClick={() => navigate('/calendar')}
                                    className="w-full flex items-start gap-3 px-4 py-3 rounded-[15px] border border-gray-100 hover:border-[#8bd7c7] hover:bg-[#d8f5e5]/30 transition-all text-left"
                                >
                                    <Calendar className="w-5 h-5 text-[#7BA99D] mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-semibold text-[#1e6b4e]">My Availability</p>
                                        <p className="text-xs text-[#546E5C]">View and update your schedule</p>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => navigate('/settings')}
                                    className="w-full flex items-start gap-3 px-4 py-3 rounded-[15px] border border-gray-100 hover:border-[#8bd7c7] hover:bg-[#d8f5e5]/30 transition-all text-left"
                                >
                                    <User className="w-5 h-5 text-[#D4A59A] mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-semibold text-[#1e6b4e]">Update Profile</p>
                                        <p className="text-xs text-[#546E5C]">Keep your info current</p>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => navigate('/settings?tab=safety')}
                                    className="w-full flex items-start gap-3 px-4 py-3 rounded-[15px] border border-gray-100 hover:border-[#8bd7c7] hover:bg-[#d8f5e5]/30 transition-all text-left"
                                >
                                    <Settings className="w-5 h-5 text-[#C9A0AB] mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-semibold text-[#1e6b4e]">Trust & Verification</p>
                                        <p className="text-xs text-[#546E5C]">Build your trust profile</p>
                                    </div>
                                </button>
                            </div>
                        </section>

                        {/* Profile Completeness Card */}
                        <section className="bg-white rounded-[20px] p-6 shadow-sm border border-gray-100">
                            <h3 className="text-sm font-bold text-[#1e6b4e] uppercase tracking-wide mb-3">
                                Your Profile
                            </h3>
                            <div className="flex items-center gap-3 mb-4">
                                {viewer?.member?.avatar_url ? (
                                    <img
                                        src={viewer.member.avatar_url}
                                        alt="Profile"
                                        className="w-14 h-14 rounded-full object-cover border-2 border-[#8bd7c7]/30"
                                    />
                                ) : (
                                    <div className="w-14 h-14 rounded-full bg-[#1e6b4e] flex items-center justify-center text-white font-bold text-xl">
                                        {firstName[0]}
                                    </div>
                                )}
                                <div>
                                    <p className="font-semibold text-[#1e6b4e]">{firstName}</p>
                                    <p className="text-xs text-[#546E5C]">Professional Caregiver</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => navigate('/settings')}
                                className="w-full px-4 py-2.5 rounded-[50px] border border-[#1e6b4e] text-[#1e6b4e] font-semibold text-sm hover:bg-[#d8f5e5] transition-all focus:outline-none focus:ring-2 focus:ring-[#8bd7c7] focus:ring-offset-1"
                            >
                                Edit Profile
                            </button>
                        </section>
                    </aside>

                    {/* Mobile Quick Actions */}
                    <MobileQuickActions onNavigate={navigate} />
                </div>

                {/* Profile Modal */}
                <ProfileModal
                    open={profileOpen}
                    onOpenChange={(open) => {
                        setProfileOpen(open);
                        if (!open) setActiveProfileId(null);
                    }}
                    memberId={activeProfileId}
                />

                {/* Message Modal */}
                <MessageModal
                    open={messageOpen}
                    onOpenChange={(open) => {
                        setMessageOpen(open);
                        if (!open) {
                            setMessageRecipientId(null);
                            setMessageRecipientName('');
                            fetchUnreadCounts(); // Refresh badge counts on close
                        }
                    }}
                    recipientId={messageRecipientId}
                    recipientName={messageRecipientName}
                    currentUserId={effectiveUserId}
                />

                {/* Search Modal */}
                <SearchModal
                    open={showSearch}
                    onClose={() => setShowSearch(false)}
                />

            </div>
        </div>
    );
}
