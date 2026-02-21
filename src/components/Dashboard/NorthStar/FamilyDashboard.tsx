/**
 * COMPLETE FAMILY DASHBOARD - READY FOR ANTIGRAVITY
 * 
 * This is the production-ready, fully responsive Family Dashboard
 * that matches the North Star Figma design.
 * 
 * INSTRUCTIONS FOR ANTIGRAVITY:
 * 1. Replace your current FamilyDashboard.tsx with this EXACT code
 * 2. Ensure ProfileModal and MessageModal imports point to correct paths
 * 3. Verify supabase import path is correct
 * 4. Test all responsive breakpoints (mobile, tablet, desktop)
 * 5. Verify all Supabase queries work with your schema
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { useViewer } from '../../../hooks/useViewer';
import ProfileModal from './ProfileModal';
import MessageModal from './MessageModal';
import SearchModal from './SearchModal';
import { ReferCaregiverModal } from './ReferCaregiverModal';
import { CreatePostModal } from './CreatePostModal';
// SharedCareTag removed — not used in V2
import DashboardMatchCard from './DashboardMatchCard';
import { CareNeedForm } from '../../care-needs/CareNeedForm';
// CareNeedCard removed — V2 uses accordion
import { useCareNeeds } from '../../../hooks/useCareNeeds';
import ConnectionRequestsCard from '../ConnectionRequestsCard';
import { getTopMatches } from '../../../api/matches';
import { getNearbyPosts, type Post } from '../../../api/posts';
import { getReferredCaregivers, type ReferredCaregiver } from '../../../api/referrals';
import type { MatchResult } from '../../../api/matches';
import type { CareNeed } from '../../../types/careNeed';
import { createNotification } from '../../../lib/notifications';
import {
    Search, Settings, Users, Bell, ArrowRight, Plus, UserPlus,
    X, Check, ChevronDown, Mail, Copy, Home, MessageCircle
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export interface MatchCardProps {
    id: string;
    targetMemberId: string;
    name: string;
    photo: string;
    distance: number;
    scheduleOverlap: number;
    matchDays: string[];
    type: 'parent' | 'caregiver';
    kids?: { age: number; name: string }[];
    availability?: string[];
    availableTime?: string;
    bio?: string;
    inVillage?: boolean;
    verified?: boolean;
    rating?: number;
    reviewCount?: number;
    responseRate?: number;
    lastActive?: string;
    mutualConnections?: number;
    mutualConnectionPhotos?: string[];
    contextText?: string;
}

// Helpers
// const careTypeLabels: Record<string, string> = {
//    'nanny-share': 'Nanny Share Partner',
//    'backup-care': 'Backup Care',
//    'co-share': 'Co-share Family',
//    'full-time': 'Full-time Caregiver',
//    'part-time': 'Part-time Caregiver',
//    'occasional': 'Occasional Babysitter',
//    'mothers-helper': "Mother's Helper",
//    'household-help': 'Household Help',
// };

// function formatCareType(type: string): string {
//    return careTypeLabels[type] || type;
// }



// formatAvailability removed — V2 uses inline signal text

// ============================================================================



// ============================================================================
// MOCK DATA (Use while developing, replace with real data)
// ============================================================================











// ============================================================================
// HELPER FUNCTIONS
// ============================================================================



// ============================================================================
// CARD COMPONENTS
// ============================================================================

function timeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}


// ============================================================================
// MODAL COMPONENTS
// ============================================================================

// CreatePostModal moved to external file

function InviteToVillageModal({ onClose }: { onClose: () => void }) {
    const [email, setEmail] = useState('');
    const [copied, setCopied] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { viewer } = useViewer();

    // Generate invite link with referral code
    const referralCode = viewer?.member?.id?.slice(0, 8) || 'invite';
    const inviteLink = `${window.location.origin}/join?ref=${referralCode}`;

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(inviteLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleEmailInvite = async () => {
        if (!email.trim() || !viewer?.member?.id) return;

        setIsLoading(true);

        try {
            // Store the invite in database for tracking (best effort)
            await supabase.from('invites').insert({
                inviter_id: viewer.member.id,
                invitee_email: email.trim().toLowerCase(),
                status: 'pending'
            }).select().single();
        } catch (err: any) {
            // If it's a duplicate or table missing, that's fine for now
            if (err.code !== '23505') {
                console.error('Error saving invite:', err);
            }
        } finally {
            // Always open email client with pre-filled message
            const subject = encodeURIComponent(`${viewer.member.first_name} invited you to join Opeari`);
            const body = encodeURIComponent(
                `Hi!\n\n${viewer.member.first_name} thinks you'd love Opeari - a trusted community for finding childcare and connecting with other families in your neighborhood.\n\nJoin here: ${inviteLink}\n\nSee you in the village!`
            );

            window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;

            setEmailSent(true);
            setEmail('');
            setIsLoading(false);

            // Auto close after a moment
            setTimeout(() => {
                onClose();
            }, 3000);
        }
    };

    const handleWhatsApp = () => {
        const text = encodeURIComponent(
            `Hey! I've been using Opeari to find trusted childcare in my neighborhood. You should check it out: ${inviteLink}`
        );
        window.open(`https://wa.me/?text=${text}`, '_blank');
    };

    const handleTextMessage = () => {
        const text = encodeURIComponent(
            `Hey! Check out Opeari for finding trusted childcare: ${inviteLink}`
        );
        window.location.href = `sms:?body=${text}`;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white rounded-[20px] shadow-xl w-full max-w-md overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-[#1e6b4e]">
                        Invite to Your Village
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-6 h-6 text-[#546E5C]" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Email Invite */}
                    <div>
                        <label className="block text-sm font-medium text-[#1e6b4e] mb-2">
                            Send via Email
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="friend@example.com"
                                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E6B4E] focus:border-transparent text-sm"
                                onKeyDown={(e) => e.key === 'Enter' && handleEmailInvite()}
                            />
                            <button
                                onClick={handleEmailInvite}
                                disabled={!email.trim() || isLoading}
                                className="px-4 py-2.5 bg-[#1E6B4E] text-white rounded-xl hover:bg-[#155a3e] disabled:opacity-50 transition-colors"
                            >
                                <Mail className="w-5 h-5" />
                            </button>
                        </div>
                        {emailSent && (
                            <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                                <Check className="w-4 h-4" /> Opening your email app...
                            </p>
                        )}
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">or</span>
                        </div>
                    </div>

                    {/* Copy Link */}
                    <div>
                        <label className="block text-sm font-medium text-[#1e6b4e] mb-2">
                            Share Invite Link
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={inviteLink}
                                readOnly
                                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-[#546E5C] text-sm truncate"
                                onClick={(e) => (e.target as HTMLInputElement).select()}
                            />
                            <button
                                onClick={handleCopyLink}
                                className="px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-[#546E5C]"
                            >
                                {copied ? (
                                    <Check className="w-5 h-5 text-green-600" />
                                ) : (
                                    <Copy className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            Share this link with friends, family, or neighbors you trust.
                        </p>
                    </div>

                    {/* Share Buttons */}
                    <div>
                        <label className="block text-sm font-medium text-[#1e6b4e] mb-2">
                            Share via
                        </label>
                        <div className="flex gap-3">
                            <button
                                onClick={handleWhatsApp}
                                className="flex-1 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-[#546E5C] font-medium text-sm"
                            >
                                WhatsApp
                            </button>
                            <button
                                onClick={handleTextMessage}
                                className="flex-1 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-[#546E5C] font-medium text-sm"
                            >
                                Text Message
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}







// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function FamilyDashboard() {
    // State
    const [connectingTo, setConnectingTo] = useState<string | null>(null);
    const [_statusById, setStatusById] = useState<Record<string, 'pending' | 'accepted'>>({});

    // BACKEND DATA STATE
    const { careNeeds, isLoading: _careNeedsLoading, createCareNeed, updateCareNeed, deleteCareNeed: _deleteCareNeed } = useCareNeeds();

    // Derived state for legacy compatibility (matches, etc.)
    const activeCareNeed = careNeeds.length > 0 ? careNeeds[0] : null;
    const [activeCareNeedToEdit, setActiveCareNeedToEdit] = useState<CareNeed | null>(null);

    const [topMatches, setTopMatches] = useState<MatchResult[]>([]);
    const [matchesLoading, setMatchesLoading] = useState(true);

    // Modals
    const [profileOpen, setProfileOpen] = useState(false);
    const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
    const [messageOpen, setMessageOpen] = useState(false);
    const [messageRecipientId, setMessageRecipientId] = useState<string | null>(null);
    const [messageRecipientName, setMessageRecipientName] = useState('');
    const [showCreatePost, setShowCreatePost] = useState(false);
    const [isInviteModalOpen, setInviteModalOpen] = useState(false);
    const [showEditNeed, setShowEditNeed] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
    const [pendingConnectionsCount, setPendingConnectionsCount] = useState(0);
    const [unreadMsgCount, setUnreadMsgCount] = useState(0);
    const [showReferCaregiverModal, setShowReferCaregiverModal] = useState(false);

    // Filter Controls
    const [matchFilter, setMatchFilter] = useState<'all' | 'caregivers' | 'families'>('all');

    // Responsive UI State
    // postsRadius and radiusDropdownOpen removed — V2 doesn't use radius UI

    // Posts State
    const [posts, setPosts] = useState<Post[]>([]);
    const [postsLoading, setPostsLoading] = useState(true);

    // radiusOptions removed — V2 doesn't use radius UI

    // For now, show all posts (radius filtering requires lat/lng data)
    const filteredPosts = posts;


    // Suggestion State
    const [suggestedConnections, setSuggestedConnections] = useState<any[]>([]);
    const [_connectionsLoading, setConnectionsLoading] = useState(true);

    // Referral State
    const [referredCaregivers, setReferredCaregivers] = useState<ReferredCaregiver[]>([]);
    const [_caregiversLoading, setCaregiversLoading] = useState(true);

    const [authUserId, setAuthUserId] = useState<string | null>(null);
    const { viewer } = useViewer();
    const userId = viewer?.member?.id;
    const effectiveUserId = userId ?? authUserId;

    // Effects
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







    // Fetch Matches (when user, filter, or active care need changes)
    useEffect(() => {
        async function fetchMatches() {
            if (!effectiveUserId) return;
            try {
                setMatchesLoading(true);
                let result: MatchResult[] = [];
                try {
                    result = await getTopMatches(effectiveUserId, matchFilter, 10);
                } catch (rpcError) {
                    console.warn('get_top_matches RPC failed, using fallback:', rpcError);
                }

                // Fallback: if RPC returns empty or failed, query members directly
                if (result.length === 0) {
                    const { data: members } = await supabase
                        .from('members')
                        .select('id, first_name, last_name, role, avatar_url, availability_days, care_types, also_open_to, neighborhood, zip_code')
                        .neq('id', effectiveUserId)
                        .eq('onboarding_complete', true);

                    if (members && members.length > 0) {
                        const myMember = viewer?.member;
                        result = members
                            .filter(m => {
                                if (matchFilter === 'caregivers') return m.role === 'caregiver';
                                if (matchFilter === 'families') return m.role === 'family' || m.role === 'parent' || m.role === 'both';
                                return true; // 'all'
                            })
                            .map(m => ({
                                member_id: m.id,
                                display_name: `${m.first_name || ''} ${(m.last_name || '').charAt(0)}.`.trim(),
                                role: m.role,
                                avatar_url: m.avatar_url,
                                match_score: (
                                    (m.neighborhood === myMember?.neighborhood ? 25 : 0) +
                                    (m.zip_code === myMember?.zip_code ? 10 : 0) +
                                    10 // base score
                                ),
                                distance_miles: 0,
                                availability_days: m.availability_days || [],
                                care_types: m.care_types || [],
                                also_open_to: m.also_open_to || [],
                                neighborhood: m.neighborhood,
                            }))
                            .sort((a, b) => b.match_score - a.match_score)
                            .slice(0, 10);
                    }
                }

                setTopMatches(result);
            } catch (error) {
                console.error('Error fetching matches:', error);
            } finally {
                setMatchesLoading(false);
            }
        }
        fetchMatches();
    }, [effectiveUserId, matchFilter, activeCareNeed?.id]);

    // Fetch suggested members (includes connected — people you may know)
    useEffect(() => {
        async function fetchNearbyMembers() {
            if (!effectiveUserId) return;

            try {
                setConnectionsLoading(true);

                // Fetch all other members
                const { data: members, error } = await supabase
                    .from('members')
                    .select('id, first_name, last_name, role, zip_code, neighborhood, care_types, availability_days, avatar_url')
                    .neq('id', effectiveUserId)
                    .eq('onboarding_complete', true);

                if (error) throw error;

                // Get connection status for each
                const { data: connections } = await supabase
                    .from('connections')
                    .select('requester_id, recipient_id, status')
                    .or(`requester_id.eq.${effectiveUserId},recipient_id.eq.${effectiveUserId}`)
                    .in('status', ['accepted', 'pending']);

                const connStatusMap: Record<string, string> = {};
                (connections || []).forEach(c => {
                    const otherId = c.requester_id === effectiveUserId ? c.recipient_id : c.requester_id;
                    connStatusMap[otherId] = c.status;
                });

                // Only show unconnected members in "People You May Know"
                const nearby = (members || [])
                    .filter(m => !connStatusMap[m.id])
                    .map(m => ({
                        member_id: m.id,
                        display_name: `${m.first_name || ''} ${(m.last_name || '').charAt(0)}.`.trim(),
                        avatar_url: m.avatar_url,
                        neighborhood: m.neighborhood,
                        zip_code: m.zip_code,
                        role: m.role,
                        care_types: m.care_types,
                        mutual_connection_count: 0,
                        connection_status: 'none' as const,
                    }));

                setSuggestedConnections(nearby);
            } catch (error) {
                console.error('Error fetching nearby members:', error);
            } finally {
                setConnectionsLoading(false);
            }
        }

        fetchNearbyMembers();
    }, [effectiveUserId, viewer?.member?.id]);

    // Fetch referred caregivers
    const fetchReferredCaregivers = useCallback(async () => {
        if (!effectiveUserId) return;

        try {
            setCaregiversLoading(true);
            const result = await getReferredCaregivers(effectiveUserId, 10);
            setReferredCaregivers(result);
        } catch (error) {
            console.error('Error fetching referred caregivers:', error);
        } finally {
            setCaregiversLoading(false);
        }
    }, [effectiveUserId]);

    useEffect(() => {
        fetchReferredCaregivers();
    }, [fetchReferredCaregivers]);

    // Fetch nearby posts
    useEffect(() => {
        async function fetchPosts() {
            try {
                setPostsLoading(true);
                const result = await getNearbyPosts(effectiveUserId || '', 10);
                setPosts(result);
            } catch (error) {
                console.error('Error fetching posts:', error);
            } finally {
                setPostsLoading(false);
            }
        }

        fetchPosts();
    }, [effectiveUserId]);

    const handleSaveCareNeed = async (data: Partial<CareNeed>) => {
        if (!effectiveUserId) return;
        try {
            if (activeCareNeedToEdit) {
                await updateCareNeed(activeCareNeedToEdit.id, data);
            } else {
                await createCareNeed({
                    ...data,
                    member_id: effectiveUserId,
                    is_active: true,
                    area_bucket: 'local',
                } as any);

                // Sync schedule back to member for regular care needs
                if (data.duration_type === 'regular' && data.days_needed && data.days_needed.length > 0) {
                    await supabase
                        .from('members')
                        .update({
                            availability_days: data.days_needed,
                            schedule: {
                                days: data.days_needed,
                                start_time: data.start_time || '09:00',
                                end_time: data.end_time || '17:00',
                                flexible: false,
                            },
                        })
                        .eq('id', effectiveUserId);
                }
            }
            setShowEditNeed(false);
            setActiveCareNeedToEdit(null);
        } catch (error) {
            console.error('Error saving care need:', error);
        }
    };

    // Connections
    const fetchConnections = useCallback(async () => {
        if (!effectiveUserId) return;
        const { data } = await supabase
            .from('connections')
            .select('requester_id, recipient_id, status') // Added recipient_id to select
            .or(`requester_id.eq.${effectiveUserId},recipient_id.eq.${effectiveUserId}`); // Updated recipient_id to recipient_id

        if (data) {
            const statusByOtherId: Record<string, 'pending' | 'accepted'> = {};
            let pendingCount = 0;
            for (const row of data) {
                // Logic for statusById (legacy?)
                // statusByOtherId...
                // Count pending requests received by me
                if (row.recipient_id === effectiveUserId && row.status === 'pending') {
                    pendingCount++;
                }

                // Map for "Connect" buttons
                const otherId = (row.requester_id === effectiveUserId) ? row.recipient_id : row.requester_id;
                if (otherId && (row.status === 'accepted' || row.status === 'pending')) {
                    statusByOtherId[otherId] = row.status as any;
                }
            }
            setStatusById(statusByOtherId);
            setPendingConnectionsCount(pendingCount);
        }
    }, [effectiveUserId]);

    useEffect(() => {
        if (!effectiveUserId) return;
        fetchConnections();
    }, [effectiveUserId, fetchConnections]);

    // Notifications
    useEffect(() => {
        if (!effectiveUserId) return;

        const fetchNotifications = async () => {
            try {
                // Fetch unread count
                const { count } = await supabase
                    .from('notifications')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', effectiveUserId)
                    .eq('read', false);

                setUnreadNotificationsCount(count || 0);

                // Fetch unread messages (2-step: get conversations -> count unread messages)
                const { data: conversations } = await supabase
                    .from('conversations')
                    .select('id')
                    .or(`participant_1.eq.${effectiveUserId},participant_2.eq.${effectiveUserId}`);

                if (conversations && conversations.length > 0) {
                    const convIds = conversations.map(c => c.id);
                    const { data: unreadMsgs } = await supabase
                        .from('messages')
                        .select('conversation_id')
                        .in('conversation_id', convIds)
                        .neq('sender_id', effectiveUserId)
                        .is('read_at', null);

                    if (unreadMsgs) {
                        const uniqueConvIds = new Set(unreadMsgs.map(m => m.conversation_id));
                        setUnreadMsgCount(uniqueConvIds.size);
                    } else {
                        setUnreadMsgCount(0);
                    }
                } else {
                    setUnreadMsgCount(0);
                }

                // Fetch recent notifications
                const { data } = await supabase
                    .from('notifications')
                    .select(`
                        id,
                        type,
                        title,
                        body,
                        read,
                        created_at,
                        from_user:members!notifications_from_user_id_fkey (
                            first_name,
                            last_name,
                            avatar_url
                        )
                    `)
                    .eq('user_id', effectiveUserId)
                    .order('created_at', { ascending: false })
                    .limit(5);

                setNotifications(data?.map(n => ({
                    ...n,
                    from_user: Array.isArray(n.from_user) ? n.from_user[0] : n.from_user
                })) || []);

            } catch (err) {
                console.error('Error fetching notifications:', err);
            }
        };

        fetchNotifications();

        // Realtime subscription
        const channel = supabase
            .channel('dashboard_notifications')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${effectiveUserId}`
            }, () => {
                fetchNotifications();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [effectiveUserId]);

    const handleOpenNotifications = async () => {
        setShowNotifications(!showNotifications);

        if (!showNotifications && unreadNotificationsCount > 0 && effectiveUserId) {
            // Mark as read after delay
            setTimeout(async () => {
                const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
                if (unreadIds.length > 0) {
                    await supabase
                        .from('notifications')
                        .update({ read: true, read_at: new Date().toISOString() })
                        .in('id', unreadIds)
                        .eq('user_id', effectiveUserId);

                    setNotifications(notifications.map(n => ({ ...n, read: true })));
                    setUnreadNotificationsCount(0);
                }
            }, 2000);
        }
    };

    const navigate = useNavigate();



    const handleConnect = async (targetId: string) => {
        if (!effectiveUserId || connectingTo) return;
        setConnectingTo(targetId);
        try {
            const { error } = await supabase.from('connections').insert({
                requester_id: effectiveUserId,
                recipient_id: targetId,
                status: 'pending'
            });
            if (error) throw error;

            // Notify target user
            await createNotification({
                userId: targetId,
                type: 'connection_request',
                title: `${viewer?.member?.first_name || 'A neighbor'} wants to connect`,
                body: 'You have a new connection request',
                fromUserId: effectiveUserId
            });

            // Update connection status
            setStatusById(prev => ({ ...prev, [targetId]: 'pending' }));
            // Remove from suggested connections
            setSuggestedConnections(prev =>
                prev.filter(c => c.member_id !== targetId)
            );
        } catch (err: any) {
            if (err.code !== '23505') {
                console.error('Connect failed:', err);
                alert('Failed to connect. Please try again.');
            }
        } finally {
            setConnectingTo(null);
        }
    };

    // V2 helper: greeting based on time
    const getGreeting = () => {
        const h = new Date().getHours();
        if (h < 12) return 'Good morning';
        if (h < 17) return 'Good afternoon';
        return 'Good evening';
    };

    // V2 helper: dynamic insight line
    const getInsightLine = () => {
        const matchCount = topMatches.length;
        if (matchCount > 0) {
            const caregiverMatches = topMatches.filter((m: any) => m.role === 'caregiver');
            if (caregiverMatches.length > 0) {
                return (
                    <>You have <span style={{ fontWeight: 700, color: '#8bd7c7' }}>{matchCount} match{matchCount > 1 ? 'es' : ''}</span> nearby — {caregiverMatches.length} caregiver{caregiverMatches.length > 1 ? 's' : ''} with overlapping schedules.</>
                );
            }
            return <>You have <span style={{ fontWeight: 700, color: '#8bd7c7' }}>{matchCount} new match{matchCount > 1 ? 'es' : ''}</span> in your area.</>;
        }
        return <>We're finding the best matches for you. Your village is growing.</>;
    };

    // V2: care needs count from Supabase (is_active = true)
    const [careNeedsCount, setCareNeedsCount] = useState(0);

    // V2: village members count from accepted connections
    const [villageMemberCount, setVillageMemberCount] = useState(0);

    // V2 Care Needs Accordion state
    const [careNeedsExpanded, setCareNeedsExpanded] = useState(false);

    useEffect(() => {
        if (!effectiveUserId) return;
        (async () => {
            // Care needs count
            const { count } = await supabase
                .from('care_needs')
                .select('*', { count: 'exact', head: true })
                .eq('member_id', effectiveUserId)
                .eq('is_active', true);
            setCareNeedsCount(count ?? 0);

            // Village members (accepted connections)
            const { data: connections } = await supabase
                .from('connections')
                .select('id')
                .or(`requester_id.eq.${effectiveUserId},recipient_id.eq.${effectiveUserId}`)
                .eq('status', 'accepted');
            setVillageMemberCount(connections?.length ?? 0);
        })();
    }, [effectiveUserId]);

    return (
        <div className="min-h-screen" style={{ background: '#fffaf5', fontFamily: 'Comfortaa, sans-serif' }}>
            {/* ========== HEADER ========== */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 sm:gap-8">
                        <h1 className="text-xl sm:text-2xl font-bold text-[#1e6b4e]">Opeari</h1>
                        <Link
                            to="/connections"
                            aria-label="My Village"
                            className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-[50px] bg-[#d8f5e5] hover:bg-[#8bd7c7]/30 transition-colors focus:outline-none focus:ring-2 focus:ring-[#1e6b4e] focus:ring-offset-2"
                        >
                            <Home className="w-4 h-4 sm:w-5 sm:h-5 text-[#1e6b4e]" />
                            <span className="text-xs sm:text-sm font-semibold text-[#1e6b4e] hidden sm:inline">My Village</span>
                        </Link>
                        {/* Core Navigation */}
                        <nav className="hidden md:flex items-center gap-5">
                            <Link
                                to="/matches"
                                className="text-sm font-semibold text-[#546E5C] hover:text-[#1e6b4e] transition-colors"
                            >
                                Discover
                            </Link>
                        </nav>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-2">
                        <button
                            type="button"
                            aria-label="Search"
                            onClick={() => setShowSearch(true)}
                            className="relative p-2 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#1e6b4e] focus:ring-offset-2"
                        >
                            <Search className="w-5 h-5 text-[#1E6B4E]" />
                        </button>

                        <div className="relative flex items-center">
                            <button
                                type="button"
                                aria-label={`Notifications (${unreadNotificationsCount + pendingConnectionsCount} new)`}
                                onClick={handleOpenNotifications}
                                className="relative p-2 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#1e6b4e] focus:ring-offset-2"
                            >
                                <Bell className="w-5 h-5 text-[#1E6B4E]" />
                                {(unreadNotificationsCount + pendingConnectionsCount) > 0 && (
                                    <span className="absolute top-0 right-0 min-w-[10px] h-[10px] bg-[#E07A5F] rounded-full border border-white flex items-center justify-center text-[8px] text-white p-0.5" />
                                )}
                            </button>

                            {/* Notifications Dropdown */}
                            {showNotifications && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setShowNotifications(false)}
                                    />
                                    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-[15px] shadow-lg border border-gray-100 z-50 overflow-hidden">
                                        <div className="px-4 py-3 border-b border-gray-100">
                                            <h3 className="font-semibold text-[#1e6b4e]">Notifications</h3>
                                        </div>
                                        <div className="max-h-80 overflow-y-auto">
                                            {notifications.length === 0 ? (
                                                <div className="p-4 text-center text-gray-500 text-sm">
                                                    No notifications yet
                                                </div>
                                            ) : (
                                                notifications.map(notification => (
                                                    <div key={notification.id} className={`p-4 hover:bg-gray-50 border-b border-gray-50 ${!notification.read ? 'bg-[#1E6B4E]/5' : ''}`}>
                                                        <p className="text-sm text-[#1e6b4e] font-medium">{notification.title}</p>
                                                        <p className="text-xs text-[#546E5C]">{notification.body}</p>
                                                        <p className="text-xs text-gray-400 mt-1">
                                                            {new Date(notification.created_at).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                        <div className="px-4 py-3 border-t border-gray-100 text-center">
                                            <button
                                                onClick={() => {
                                                    setShowNotifications(false);
                                                    navigate('/notifications');
                                                }}
                                                className="text-sm text-[#1e6b4e] font-semibold hover:underline"
                                            >
                                                View All Notifications
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <Link
                            to="/messages"
                            className="relative p-2 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#1e6b4e] focus:ring-offset-2"
                        >
                            <MessageCircle className="w-5 h-5 text-[#1E6B4E]" />
                            {unreadMsgCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold"
                                    style={{ backgroundColor: '#E07A5F', color: 'white', padding: '0 4px', border: '1.5px solid white' }}>
                                    {unreadMsgCount > 9 ? '9+' : unreadMsgCount}
                                </span>
                            )}
                        </Link>

                        {/* Connections icon */}
                        <Link
                            to="/connections"
                            className="relative p-2 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#1e6b4e] focus:ring-offset-2"
                            aria-label="My connections"
                        >
                            <Users className="w-5 h-5 text-[#1E6B4E]" />
                        </Link>

                        <button
                            type="button"
                            aria-label="Settings"
                            onClick={() => navigate('/settings')}
                            className="relative p-2 hover:bg-gray-100 rounded-full transition-colors hidden sm:block focus:outline-none focus:ring-2 focus:ring-[#1e6b4e] focus:ring-offset-2"
                        >
                            <Settings className="w-5 h-5 text-[#1E6B4E]" />
                        </button>
                        <button
                            type="button"
                            aria-label="Profile"
                            onClick={() => navigate('/settings')}
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#1e6b4e] text-white font-bold flex items-center justify-center hover:bg-[#155a3e] transition-colors text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#1e6b4e] focus:ring-offset-2"
                        >
                            {viewer?.member?.first_name?.[0] || 'U'}
                        </button>
                    </div>
                </div>
            </header>


            {/* ========== V2 MAIN CONTENT ========== */}
            <div style={{ maxWidth: 960, margin: '0 auto', padding: '28px 20px 60px' }}>

                {/* Pending Connections */}
                <div style={{ marginBottom: 24 }}>
                    <ConnectionRequestsCard />
                </div>

                {/* ── HERO ── */}
                <section
                    style={{
                        background: 'linear-gradient(135deg, #1E6B4E 0%, #2a8a64 100%)',
                        borderRadius: 18,
                        padding: '28px 28px',
                        color: '#fff',
                        marginBottom: 24,
                    }}
                >
                    <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, lineHeight: 1.3 }}>
                        {getGreeting()}, {viewer?.member?.first_name || 'there'}
                    </div>
                    <div style={{ fontSize: 14, opacity: 0.9, lineHeight: 1.6 }}>
                        {getInsightLine()}
                    </div>

                    {/* Metric chips */}
                    <div style={{ display: 'flex', gap: 12, marginTop: 18, flexWrap: 'wrap' }}>
                        {[
                            { label: 'Top Matches', value: topMatches.length.toString() },
                            { label: 'Care Needs', value: careNeedsCount.toString() },
                            { label: 'Village Members', value: villageMemberCount.toString() },
                        ].map((m) => (
                            <div
                                key={m.label}
                                style={{
                                    background: 'rgba(255,255,255,0.15)',
                                    backdropFilter: 'blur(8px)',
                                    borderRadius: 10,
                                    padding: '10px 16px',
                                    display: 'flex',
                                    alignItems: 'baseline',
                                    gap: 6,
                                }}
                            >
                                <span style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{m.value}</span>
                                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>{m.label}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── TOP MATCHES ── */}
                <section style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <h2 style={{ fontWeight: 700, fontSize: 16, color: '#2d3a35' }}>Your Top Matches</h2>
                        <Link to="/matches" style={{ fontSize: 12, color: '#1E6B4E', fontWeight: 600, textDecoration: 'none' }}>
                            See all
                        </Link>
                    </div>

                    {/* Filter Toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                        <span style={{ fontSize: 12, color: '#6b7f76' }}>Show:</span>
                        <div style={{ display: 'flex', background: '#f0f0f0', borderRadius: 20, padding: 3 }}>
                            {(['all', 'caregivers', 'families'] as const).map((filter) => (
                                <button
                                    key={filter}
                                    type="button"
                                    onClick={() => setMatchFilter(filter)}
                                    style={{
                                        padding: '4px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                                        fontSize: 11, fontWeight: matchFilter === filter ? 700 : 500,
                                        background: matchFilter === filter ? '#fff' : 'transparent',
                                        color: matchFilter === filter ? '#1E6B4E' : '#6b7f76',
                                        boxShadow: matchFilter === filter ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                                        textTransform: 'capitalize',
                                        fontFamily: 'Comfortaa, sans-serif',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>
                    </div>

                    {matchesLoading ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                            {[1, 2, 3].map(i => (
                                <div key={i} style={{ height: 220, background: '#f5f5f5', borderRadius: 16, animation: 'pulse 2s infinite' }} />
                            ))}
                        </div>
                    ) : topMatches.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '32px 0' }}>
                            <p style={{ fontSize: 13, color: '#6b7f76', marginBottom: 8 }}>
                                We're finding the best matches for you.
                            </p>
                            <p style={{ fontSize: 12, color: '#aaa' }}>
                                As more families and caregivers join, your matches will appear here.
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                            {topMatches.slice(0, 6).map((match: any) => (
                                <div key={match.member_id} style={{ height: '100%' }}>
                                    <DashboardMatchCard match={match} viewerId={viewer?.member?.id || ''} />
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* ── CARE NEEDS ACCORDION ── */}
                {careNeeds.length > 0 && (
                    <section style={{ marginBottom: 24 }}>
                        <div
                            style={{
                                background: '#fff',
                                borderRadius: 14,
                                boxShadow: '0 2px 12px rgba(30,107,78,0.08)',
                                overflow: 'hidden',
                            }}
                        >
                            <button
                                onClick={() => setCareNeedsExpanded(!careNeedsExpanded)}
                                type="button"
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '14px 20px',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontFamily: 'Comfortaa, sans-serif',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#8bd7c7' }} />
                                    <span style={{ fontWeight: 700, fontSize: 14, color: '#2d3a35' }}>
                                        {careNeedsCount} care need{careNeedsCount !== 1 ? 's' : ''}
                                    </span>
                                </div>
                                <ChevronDown
                                    className="w-4 h-4"
                                    style={{
                                        color: '#6b7f76',
                                        transition: 'transform 0.2s',
                                        transform: careNeedsExpanded ? 'rotate(180deg)' : 'rotate(0)',
                                    }}
                                />
                            </button>

                            {careNeedsExpanded && (
                                <div style={{ padding: '0 20px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {careNeeds.map((need: any) => (
                                        <div
                                            key={need.id}
                                            style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                padding: '10px 14px', borderRadius: 10, background: '#fffaf5',
                                                cursor: 'pointer',
                                            }}
                                            onClick={() => { setActiveCareNeedToEdit(need); setShowEditNeed(true); }}
                                        >
                                            <div>
                                                <div style={{ fontSize: 13, fontWeight: 600, color: '#2d3a35' }}>
                                                    {need.title || need.care_type?.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Care Need'}
                                                </div>
                                                <div style={{ fontSize: 11, color: '#6b7f76', marginTop: 2 }}>
                                                    {need.schedule_text || need.frequency || 'Flexible schedule'}
                                                </div>
                                            </div>
                                            <span
                                                style={{
                                                    padding: '3px 10px', borderRadius: 12,
                                                    background: need.status === 'active' || !need.status ? '#d8f5e5' : '#f0f0f0',
                                                    fontSize: 11, fontWeight: 600,
                                                    color: need.status === 'active' || !need.status ? '#1E6B4E' : '#6b7f76',
                                                    fontFamily: 'Comfortaa, sans-serif',
                                                }}
                                            >
                                                {need.status === 'active' || !need.status ? 'Active' : 'Draft'}
                                            </span>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => { setActiveCareNeedToEdit(null); setShowEditNeed(true); }}
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                            padding: '10px', borderRadius: 10,
                                            background: 'none', border: '1px dashed #8bd7c7',
                                            color: '#1E6B4E', fontSize: 12, fontWeight: 600,
                                            cursor: 'pointer', fontFamily: 'Comfortaa, sans-serif',
                                        }}
                                    >
                                        <Plus className="w-3.5 h-3.5" /> Create Care Need
                                    </button>
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* ── REFERRED CARETAKERS (compact) ── */}
                {referredCaregivers.length > 0 && (
                    <section style={{ marginBottom: 24 }}>
                        <div
                            style={{
                                background: '#fff',
                                borderRadius: 14,
                                boxShadow: '0 2px 12px rgba(30,107,78,0.08)',
                                padding: 20,
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                                <div style={{ fontWeight: 700, fontSize: 14, color: '#2d3a35' }}>Referred Caretakers</div>
                                <Link to="/matches?show=caregivers" style={{ fontSize: 12, color: '#1E6B4E', fontWeight: 600, textDecoration: 'none' }}>
                                    View All <ArrowRight className="w-3.5 h-3.5 inline" />
                                </Link>
                            </div>
                            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                {referredCaregivers.map((cg) => (
                                    <Link
                                        key={cg.caregiver_id}
                                        to={`/member/${cg.caregiver_id}`}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 10,
                                            padding: '10px 14px', borderRadius: 12,
                                            background: '#fffaf5', flex: '1 1 200px',
                                            textDecoration: 'none', color: 'inherit',
                                            transition: 'box-shadow 0.2s',
                                        }}
                                    >
                                        {/* Warm gradient avatar */}
                                        <div
                                            style={{
                                                width: 36, height: 36, borderRadius: '50%',
                                                background: cg.avatar_url ? undefined : `linear-gradient(135deg, #F8C3B3 0%, #f5a08a 50%, #f0c4b8 100%)`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontWeight: 700, fontSize: 12, color: '#1E6B4E', flexShrink: 0,
                                                overflow: 'hidden',
                                                boxShadow: '0 2px 8px rgba(248,195,179,0.4)',
                                            }}
                                        >
                                            {cg.avatar_url ? (
                                                <img src={cg.avatar_url} alt={cg.display_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                cg.display_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
                                            )}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: '#2d3a35' }}>{cg.display_name}</div>
                                            <div style={{ fontSize: 11, color: '#6b7f76' }}>Endorsed by {cg.referrer_name}</div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* ── PEOPLE YOU MAY KNOW ── */}
                {suggestedConnections.length > 0 && (
                    <section style={{ marginBottom: 24 }}>
                        <div
                            style={{
                                background: '#fff',
                                borderRadius: 14,
                                boxShadow: '0 2px 12px rgba(30,107,78,0.08)',
                                padding: 20,
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                                <h2 style={{ fontWeight: 700, fontSize: 14, color: '#2d3a35' }}>People You May Know</h2>
                                <Link to="/matches" style={{ fontSize: 12, color: '#1E6B4E', fontWeight: 600, textDecoration: 'none' }}>
                                    View All
                                </Link>
                            </div>
                            <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
                                {suggestedConnections.map((person: any) => (
                                    <div
                                        key={person.member_id}
                                        style={{
                                            flexShrink: 0, width: 140,
                                            background: '#fff', borderRadius: 15,
                                            padding: 16, border: '1px solid #f0f0f0',
                                            textAlign: 'center',
                                            transition: 'border-color 0.2s, box-shadow 0.2s',
                                        }}
                                    >
                                        <img
                                            src={person.avatar_url || 'https://via.placeholder.com/100'}
                                            alt={person.display_name}
                                            style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', margin: '0 auto 10px', border: '2px solid #8bd7c7' }}
                                        />
                                        <p style={{ fontWeight: 600, fontSize: 13, color: '#1E6B4E', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {person.display_name}
                                        </p>
                                        <p style={{ fontSize: 11, color: '#6b7f76', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {person.neighborhood || 'Nearby'}
                                        </p>
                                        {person.connection_status === 'accepted' ? (
                                            <Link
                                                to={`/member/${person.member_id}`}
                                                style={{
                                                    display: 'block', padding: '5px 12px', borderRadius: 20,
                                                    background: '#d8f5e5', color: '#1E6B4E',
                                                    fontSize: 11, fontWeight: 600, textDecoration: 'none',
                                                }}
                                            >
                                                Connected
                                            </Link>
                                        ) : person.connection_status === 'pending' ? (
                                            <span style={{ display: 'block', padding: '5px 12px', borderRadius: 20, border: '1px solid #e5e5e5', color: '#6b7f76', fontSize: 11, fontWeight: 500 }}>
                                                Pending
                                            </span>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => handleConnect(person.member_id)}
                                                disabled={connectingTo === person.member_id}
                                                style={{
                                                    display: 'block', width: '100%', padding: '5px 12px', borderRadius: 20,
                                                    border: '1px solid #ccc', background: 'none',
                                                    color: '#6b7f76', fontSize: 11, fontWeight: 500,
                                                    cursor: 'pointer', fontFamily: 'Comfortaa, sans-serif',
                                                    transition: 'all 0.2s',
                                                }}
                                            >
                                                {connectingTo === person.member_id ? 'Sending...' : 'Connect'}
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {/* Invite friends card */}
                                <div
                                    style={{
                                        flexShrink: 0, width: 140,
                                        background: 'linear-gradient(135deg, #d8f5e5, rgba(139,215,199,0.2))',
                                        borderRadius: 15, padding: 16,
                                        border: '1px dashed #8bd7c7',
                                        textAlign: 'center',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                    }}
                                >
                                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                                        <UserPlus className="w-5 h-5 text-[#1e6b4e]" />
                                    </div>
                                    <p style={{ fontSize: 11, color: '#1E6B4E', fontWeight: 500, marginBottom: 10 }}>Invite friends</p>
                                    <button
                                        type="button"
                                        onClick={() => setInviteModalOpen(true)}
                                        style={{
                                            padding: '5px 14px', borderRadius: 20,
                                            background: '#1E6B4E', color: '#fff',
                                            fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer',
                                            fontFamily: 'Comfortaa, sans-serif',
                                        }}
                                    >
                                        Invite
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* ── QUICK ACTIONS (horizontal row) ── */}
                <section style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        {[
                            { label: 'Refer a Caregiver', onClick: () => setShowReferCaregiverModal(true), icon: 'M12 4.5v15m7.5-7.5h-15' },
                            { label: 'Invite a Friend', onClick: () => setInviteModalOpen(true), icon: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0' },
                            { label: 'Post to Village', onClick: () => setShowCreatePost(true), icon: 'M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z' },
                            { label: 'Discover', onClick: () => navigate('/matches'), icon: 'M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z' },
                        ].map((a) => (
                            <button
                                key={a.label}
                                type="button"
                                onClick={a.onClick}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    padding: '10px 16px', borderRadius: 12,
                                    background: '#fff', border: '1px solid #d8f5e5',
                                    cursor: 'pointer', fontFamily: 'Comfortaa, sans-serif',
                                    fontSize: 12, fontWeight: 600, color: '#1E6B4E',
                                    boxShadow: '0 1px 4px rgba(30,107,78,0.05)',
                                    transition: 'all 0.2s',
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

                {/* ── VILLAGE BOARD (secondary placement) ── */}
                <section style={{ marginBottom: 24 }}>
                    <div
                        style={{
                            background: '#fafffe',
                            borderRadius: 14,
                            boxShadow: '0 2px 12px rgba(30,107,78,0.08)',
                            padding: 20,
                            borderLeft: '3px solid #8bd7c7',
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                            <div style={{ fontWeight: 700, fontSize: 15, color: '#2d3a35', display: 'flex', alignItems: 'center' }}><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: '#8bd7c7', marginRight: 8 }} />Village Board</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <button
                                    type="button"
                                    onClick={() => setShowCreatePost(true)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 4,
                                        padding: '5px 12px', borderRadius: 20,
                                        background: '#d8f5e5', border: 'none',
                                        color: '#1E6B4E', fontSize: 11, fontWeight: 600,
                                        cursor: 'pointer', fontFamily: 'Comfortaa, sans-serif',
                                    }}
                                >
                                    <Plus className="w-3 h-3" /> New Post
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigate('/posts')}
                                    style={{
                                        background: 'none', border: 'none',
                                        color: '#1E6B4E', fontSize: 12, fontWeight: 600,
                                        cursor: 'pointer', fontFamily: 'Comfortaa, sans-serif',
                                    }}
                                >
                                    View All
                                </button>
                            </div>
                        </div>

                        {postsLoading ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {[1, 2].map(i => (
                                    <div key={i} style={{ height: 48, background: '#f5f5f5', borderRadius: 10, animation: 'pulse 2s infinite' }} />
                                ))}
                            </div>
                        ) : filteredPosts.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '24px 0' }}>
                                <p style={{ fontSize: 13, color: '#6b7f76', marginBottom: 4 }}>No posts yet</p>
                                <p style={{ fontSize: 11, color: '#aaa' }}>Be the first to share something!</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {filteredPosts.slice(0, 4).map((post) => (
                                    <button
                                        key={post.id}
                                        type="button"
                                        onClick={() => navigate('/posts')}
                                        style={{
                                            display: 'block', width: '100%', textAlign: 'left',
                                            padding: '12px 14px', borderRadius: 10, background: '#fffaf5',
                                            border: 'none', cursor: 'pointer',
                                            fontFamily: 'Comfortaa, sans-serif',
                                            transition: 'background 0.2s',
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                            <span style={{ fontWeight: 700, fontSize: 12, color: '#1E6B4E' }}>{post.author_name}</span>
                                            <span style={{ fontSize: 11, color: '#6b7f76' }}>{timeAgo(post.created_at)}</span>
                                        </div>
                                        <div style={{ fontSize: 13, color: '#2d3a35', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {post.content}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* ── BOTTOM CTA ── */}
                <div style={{ textAlign: 'center', padding: '16px 0 0', fontSize: 13, color: '#6b7f76' }}>
                    Know someone great?{' '}
                    <button
                        type="button"
                        onClick={() => setShowReferCaregiverModal(true)}
                        style={{ background: 'none', border: 'none', color: '#1E6B4E', fontSize: 13, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 2, fontFamily: 'Comfortaa, sans-serif' }}
                    >
                        Refer a Caregiver
                    </button>
                    {' · '}
                    <button
                        type="button"
                        onClick={() => setInviteModalOpen(true)}
                        style={{ background: 'none', border: 'none', color: '#1E6B4E', fontSize: 13, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 2, fontFamily: 'Comfortaa, sans-serif' }}
                    >
                        Invite a Friend
                    </button>
                    {' · '}
                    <button
                        type="button"
                        onClick={() => navigate('/matches')}
                        style={{ background: 'none', border: 'none', color: '#1E6B4E', fontSize: 13, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 2, fontFamily: 'Comfortaa, sans-serif' }}
                    >
                        Discover More
                    </button>
                </div>
            </div>

            {/* ========== MODALS ========== */}
            <ProfileModal
                open={profileOpen}
                onOpenChange={(open) => {
                    setProfileOpen(open);
                    if (!open) setActiveProfileId(null);
                }}
                memberId={activeProfileId}
                onMessage={(memberId, name) => {
                    setMessageRecipientId(memberId);
                    setMessageRecipientName(name);
                    setMessageOpen(true);
                }}
            />
            <MessageModal
                open={messageOpen}
                onOpenChange={(open) => {
                    setMessageOpen(open);
                    if (!open) {
                        setMessageRecipientId(null);
                        setMessageRecipientName('');
                    }
                }}
                recipientId={messageRecipientId}
                recipientName={messageRecipientName}
                currentUserId={effectiveUserId}
            />
            {showSearch && <SearchModal open={showSearch} onClose={() => setShowSearch(false)} />}
            {showCreatePost && <CreatePostModal onClose={() => setShowCreatePost(false)} onPostCreated={(newPost) => setPosts(prev => [newPost, ...prev])} />}
            {isInviteModalOpen && <InviteToVillageModal onClose={() => setInviteModalOpen(false)} />}
            {showEditNeed && (
                <CareNeedForm
                    careNeed={activeCareNeedToEdit}
                    onClose={() => {
                        setShowEditNeed(false);
                        setActiveCareNeedToEdit(null);
                    }}
                    onSave={handleSaveCareNeed}
                />
            )}

            {/* Refer Caregiver Modal */}
            <ReferCaregiverModal
                isOpen={showReferCaregiverModal}
                onClose={() => setShowReferCaregiverModal(false)}
                userId={effectiveUserId || ''}
                onSuccess={() => {
                    fetchReferredCaregivers();
                }}
            />
        </div >
    );
}

