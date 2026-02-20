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
import { SharedCareTag, getSharedCareTags } from '../../Shared/SharedCareTag';
import DashboardMatchCard from './DashboardMatchCard';
import { CareNeedForm } from '../../care-needs/CareNeedForm';
import { CareNeedCard } from '../../care-needs/CareNeedCard';
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
    X, Check, ChevronDown, Mail, Star, Calendar, Copy, Home, MapPin, CheckCircle2, MessageCircle
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



function formatAvailability(days: string[]): string {
    if (!days || days.length === 0) return 'Flexible';
    if (days.length === 5 &&
        days.includes('mon') &&
        days.includes('tue') &&
        days.includes('wed') &&
        days.includes('thu') &&
        days.includes('fri')) {
        return 'Mon-Fri';
    }
    if (days.length === 7) return 'All Week';
    return days.map(d => d.charAt(0).toUpperCase() + d.slice(1, 3)).join(', ');
}

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

interface NannyCardProps {
    id: string;
    name: string;
    photo: string;
    experience: string;
    rating: number;
    reviewCount: number;
    referredBy: string;
    referralCount: number;
    distance: number;
    available: string;
    verified: boolean;
    inVillage?: boolean;
    referrerNote?: string | null;
}

function NannyCard({
    id, name, photo, experience, rating, reviewCount, referredBy, referralCount,
    distance, available, verified, inVillage, referrerNote, onViewProfile
}: NannyCardProps & { onViewProfile?: (id: string) => void }) {
    return (
        <div className="bg-white rounded-[20px] overflow-hidden shadow-sm hover:shadow-lg transition-shadow border border-gray-100 flex-shrink-0 w-64">
            {/* Photo Section */}
            <div className="relative h-40">
                <img
                    src={photo}
                    alt={`${name} - Professional caregiver`}
                    className="w-full h-full object-cover"
                />
                {inVillage && (
                    <div className="absolute top-3 right-3 bg-[#1e6b4e] text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5">
                        <Users className="w-3 h-3" />
                        In Village
                    </div>
                )}
                {verified && (
                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#1e6b4e]" />
                        <span className="text-xs font-semibold text-[#1e6b4e]">Verified</span>
                    </div>
                )}
            </div>

            {/* Info Section */}
            <div className="p-4">
                <h3 className="font-bold text-[#1e6b4e] mb-1">{name}</h3>
                <p className="text-xs text-[#546E5C] mb-3">{experience}</p>

                {/* Rating */}
                <div className="flex items-center gap-1.5 mb-3">
                    <Star className="w-4 h-4 fill-[#F8C3B3] text-[#F8C3B3]" />
                    <span className="font-semibold text-sm text-[#1e6b4e]">{rating}</span>
                    <span className="text-xs text-[#546E5C]">({reviewCount} reviews)</span>
                </div>

                {/* Referral Info */}
                <div className="bg-[#8bd7c7]/10 rounded-[10px] px-3 py-2 mb-3">
                    <p className="text-xs text-[#546E5C]">
                        Referred by <span className="font-semibold text-[#1e6b4e]">{referredBy}</span>
                        {referralCount > 1 && <span className="text-[#1e6b4e]"> +{referralCount - 1} more</span>}
                    </p>
                    {referrerNote && (
                        <p className="text-xs text-[#546E5C] mt-1 italic line-clamp-2">
                            "{referrerNote}"
                        </p>
                    )}
                </div>

                {/* Distance & Availability */}
                <div className="flex items-center justify-between text-xs text-[#546E5C] mb-4">
                    <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{distance} mi</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{available}</span>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => onViewProfile?.(id)}
                    className="w-full px-4 py-2.5 rounded-[50px] border border-[#1e6b4e] text-[#1e6b4e] font-semibold text-sm hover:bg-[#d8f5e5] transition-all focus:outline-none focus:ring-2 focus:ring-[#1e6b4e] focus:ring-offset-2"
                >
                    View Profile
                </button>
            </div>
        </div>
    );
}







// -----------------------------
// 2. QUICK ACTIONS SIDEBAR COMPONENT
// -----------------------------

// -----------------------------

interface QuickActionsProps {
    onShareWithVillage?: () => void;
    onInviteToVillage?: () => void;
    onReferCaregiver?: () => void;
}

function QuickActionsSidebar({
    onShareWithVillage,
    onInviteToVillage,
    onReferCaregiver
}: QuickActionsProps) {
    const navigate = useNavigate();
    return (
        <>
            <section className="bg-white rounded-[20px] p-6 shadow-sm border border-gray-100">
                {/* Quick Actions Header */}
                <h3 className="text-sm font-bold text-[#1e6b4e] uppercase tracking-wide mb-4">
                    Quick Actions
                </h3>

                {/* Action Buttons */}
                {/* Action Buttons */}
                <div className="space-y-2">
                    {/* Invite a Family (Moved to top, styled) */}
                    <button
                        type="button"
                        onClick={onInviteToVillage}
                        className="w-full flex items-start gap-3 px-4 py-3 rounded-[15px] border border-[#8bd7c7] bg-[#d8f5e5] hover:bg-[#c0e8d5] transition-all text-left shadow-sm"
                    >
                        <UserPlus className="w-5 h-5 text-[#1e6b4e] mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-bold text-[#1e6b4e]">Invite a Family</p>
                            <p className="text-xs text-[#546E5C]">Grow your village</p>
                        </div>
                    </button>

                    {/* Post a Care Need */}
                    <button
                        type="button"
                        onClick={onShareWithVillage}
                        className="w-full flex items-start gap-3 px-4 py-3 rounded-[15px] border border-gray-100 hover:border-[#8bd7c7] hover:bg-[#d8f5e5]/30 transition-all text-left"
                    >
                        <Plus className="w-5 h-5 text-[#6B9080] mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-semibold text-[#1e6b4e]">Post a Care Need</p>
                            <p className="text-xs text-[#546E5C]">Share with your village</p>
                        </div>
                    </button>

                    {/* Refer a Caretaker */}
                    <button
                        type="button"
                        onClick={onReferCaregiver}
                        className="w-full flex items-start gap-3 px-4 py-3 rounded-[15px] border border-gray-100 hover:border-[#8bd7c7] hover:bg-[#d8f5e5]/30 transition-all text-left"
                    >
                        <Users className="w-5 h-5 text-[#D4A59A] mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-semibold text-[#1e6b4e]">Refer a Caretaker</p>
                            <p className="text-xs text-[#546E5C]">Help grow the village</p>
                        </div>
                    </button>

                    {/* View My Calendar */}
                    <button
                        type="button"
                        onClick={() => navigate('/calendar')}
                        className="w-full flex items-start gap-3 px-4 py-3 rounded-[15px] border border-gray-100 hover:border-[#8bd7c7] hover:bg-[#d8f5e5]/30 transition-all text-left"
                    >
                        <Calendar className="w-5 h-5 text-[#7BA99D] mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-semibold text-[#1e6b4e]">View My Calendar</p>
                            <p className="text-xs text-[#546E5C]">Check your schedule</p>
                        </div>
                    </button>
                </div>
            </section>

        </>
    );
}

function MobileQuickActionsBar({ onShareWithVillage }: { onShareWithVillage: () => void }) {
    return (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-40 shadow-lg">
            <button
                type="button"
                onClick={onShareWithVillage}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-[50px] bg-[#1e6b4e] text-white hover:bg-[#155a3e] font-semibold text-sm shadow-md focus:outline-none focus:ring-2 focus:ring-[#1e6b4e] focus:ring-offset-2"
            >
                <Plus className="w-5 h-5" />
                Share with Village
            </button>
        </div>
    );
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
    const [statusById, setStatusById] = useState<Record<string, 'pending' | 'accepted'>>({});

    // BACKEND DATA STATE
    const { careNeeds, isLoading: careNeedsLoading, createCareNeed, updateCareNeed, deleteCareNeed } = useCareNeeds();

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
    const [postsRadius, setPostsRadius] = useState('5');
    const [radiusDropdownOpen, setRadiusDropdownOpen] = useState(false);

    // Posts State
    const [posts, setPosts] = useState<Post[]>([]);
    const [postsLoading, setPostsLoading] = useState(true);

    const radiusOptions = [
        { value: '1', label: '1 mile' },
        { value: '5', label: '5 miles' },
        { value: '10', label: '10 miles' },
        { value: '25', label: '25 miles' },
    ];

    // For now, show all posts (radius filtering requires lat/lng data)
    const filteredPosts = posts;


    // Suggestion State
    const [suggestedConnections, setSuggestedConnections] = useState<any[]>([]);
    const [connectionsLoading, setConnectionsLoading] = useState(true);

    // Referral State
    const [referredCaregivers, setReferredCaregivers] = useState<ReferredCaregiver[]>([]);
    const [caregiversLoading, setCaregiversLoading] = useState(true);

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

    const handleViewProfile = (memberId: string) => {
        setActiveProfileId(memberId);
        setProfileOpen(true);
    };

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

    return (
        <div className="min-h-screen bg-[#d8f5e5]" style={{ fontFamily: 'Comfortaa, sans-serif' }}>
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

            {/* ========== VILLAGE ACTIVITY BANNER ========== */}
            <div className="bg-[#d8f5e5] border-b border-[#8bd7c7]/30">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-[#1e6b4e]">
                                {(() => {
                                    // const hour = new Date().getHours();
                                    // Removed time-based greeting for specific copy requests, or prepend it?
                                    // Prompt says: "Welcome Line... Current: Good evening! Welcome to your village."
                                    // New: "Your village starts with one connection." or "Welcome back — your village is growing."
                                    // It doesn't explicitly say to keep the time-based greeting, but "Welcome Line" headers usually replace the whole line.
                                    // However, the current code has: {greeting} {notification/welcome message}
                                    // I'll replace the whole block to match the prompt exactly.

                                    const acceptedCount = Object.values(statusById).filter(s => s === 'accepted').length;
                                    // Note: suggestedConnections might be empty if not loaded yet, but we have a loading state? 
                                    // Actually we are in the render, so if it's loading, it might be 0.
                                    // But the prompt says "0 accepted connections AND 0 suggested connections".
                                    const hasConnections = acceptedCount > 0;
                                    const hasSuggestions = suggestedConnections.length > 0;

                                    if (!hasConnections && !hasSuggestions) {
                                        return <span className="font-semibold">Your village starts with one connection.</span>;
                                    } else {
                                        return <span className="font-semibold">Welcome back — your village is growing.</span>;
                                    }
                                })()}
                            </span>
                        </div>
                        <button
                            onClick={() => navigate('/notifications')}
                            className="text-sm text-[#1e6b4e] font-semibold hover:underline"
                        >
                            View →
                        </button>
                    </div>
                </div>
            </div>

            {/* ========== MAIN CONTENT ========== */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
                {/* Pending Connections Section */}
                <div className="mb-6">
                    <ConnectionRequestsCard />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                    {/* LEFT COLUMN (2/3) */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Top Matches for You */}
                        <section className="bg-white rounded-[20px] p-6 shadow-sm border border-gray-100">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h2 className="text-xl font-bold text-[#1e6b4e] tracking-tight mb-1">Top Matches for You</h2>
                                    <p className="text-sm text-[#546E5C]/80">
                                        Families and caregivers with overlapping schedules and care needs
                                    </p>
                                </div>
                                <Link to="/matches" className="text-sm text-[#1e6b4e] font-semibold hover:underline flex items-center gap-1">
                                    View All <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>

                            {/* Filter Toggle */}
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-sm text-[#546E5C]">Show:</span>
                                <div className="flex bg-gray-100 rounded-full p-1">
                                    {(['all', 'caregivers', 'families'] as const).map((filter) => (
                                        <button
                                            key={filter}
                                            type="button"
                                            onClick={() => setMatchFilter(filter)}
                                            className={`
                            px-4 py-1.5 rounded-full text-xs font-semibold transition-all capitalize
                            ${matchFilter === filter
                                                    ? 'bg-white text-[#1e6b4e] shadow-sm'
                                                    : 'text-[#546E5C] hover:text-[#1e6b4e]'
                                                }
                        `}
                                        >
                                            {filter}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Match Cards — horizontal scroll */}
                            <div>
                                {matchesLoading ? (
                                    <div
                                        className="flex gap-4 overflow-x-auto pb-4 -mx-1 px-1"
                                    >
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="flex-shrink-0 animate-pulse bg-gray-100 rounded-[20px] h-[200px]" style={{ width: '380px' }} />
                                        ))}
                                    </div>
                                ) : topMatches.length === 0 ? (
                                    <div className="text-center py-8">
                                        <p className="text-sm text-[#546E5C] mb-2">
                                            We're finding the best matches for you.
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            As more families and caregivers join, your matches will appear here.
                                        </p>
                                    </div>
                                ) : (
                                    <div
                                        className="flex gap-4 overflow-x-auto pb-4 -mx-1 px-1"
                                        style={{ scrollSnapType: 'x mandatory' }}
                                    >
                                        {topMatches.slice(0, 6).map(match => (
                                            <div
                                                key={match.member_id}
                                                className="flex-shrink-0 snap-start"
                                                style={{ width: '380px' }}
                                            >
                                                <DashboardMatchCard
                                                    memberId={match.member_id}
                                                    name={match.display_name}
                                                    role={match.role ?? 'parent'}
                                                    neighborhood={(match as any).neighborhood}
                                                    matchScore={match.match_score}
                                                    distance={match.distance_miles}
                                                    avatarUrl={match.avatar_url ?? undefined}
                                                    availabilityDays={match.availability_days ?? undefined}
                                                    careTypes={match.care_types ?? undefined}
                                                    connectionStatus={statusById[match.member_id] || 'none'}
                                                    isConnecting={connectingTo === match.member_id}
                                                    onConnect={() => handleConnect(match.member_id)}
                                                    onViewProfile={() => handleViewProfile(match.member_id)}
                                                    onMessage={(id, name) => {
                                                        setMessageRecipientId(id);
                                                        setMessageRecipientName(name);
                                                        setMessageOpen(true);
                                                    }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Active Care Need */}
                        <section className="bg-white rounded-[20px] p-6 shadow-sm border border-gray-100">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                                <div>
                                    <h2 className="text-lg sm:text-xl font-bold text-[#1e6b4e] tracking-tight mb-1">Your Care Needs</h2>
                                    <p className="text-sm text-[#546E5C]/80 mt-1">Manage your scheduling requirements</p>
                                </div>

                                <div className="flex items-center gap-3">

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setActiveCareNeedToEdit(null);
                                            setShowEditNeed(true);
                                        }}
                                        className="px-4 py-2 rounded-full bg-[#1e6b4e] text-white text-sm font-semibold hover:bg-[#155a3e] transition-colors flex items-center gap-1.5 shadow-sm"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add New
                                    </button>
                                </div>
                            </div>

                            {careNeedsLoading ? (
                                <div className="space-y-4">
                                    {[1, 2].map(i => (
                                        <div key={i} className="animate-pulse bg-gray-100 rounded-[15px] h-32 w-full" />
                                    ))}
                                </div>
                            ) : careNeeds.length > 0 ? (
                                <div className="space-y-4">
                                    {careNeeds.map(need => (
                                        <CareNeedCard
                                            key={need.id}
                                            careNeed={need}
                                            onEdit={(need) => {
                                                setActiveCareNeedToEdit(need);
                                                setShowEditNeed(true);
                                            }}
                                            onDelete={deleteCareNeed}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-[#d8f5e5]/30 rounded-[15px] p-6 text-center">
                                    <p className="text-[#546E5C] mb-3">No active care needs</p>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setActiveCareNeedToEdit(null);
                                            setShowEditNeed(true);
                                        }}
                                        className="px-4 py-2 rounded-full bg-[#1e6b4e] text-white text-sm font-semibold hover:bg-[#155a3e] transition-colors"
                                    >
                                        Create Care Need
                                    </button>
                                </div>
                            )}
                        </section>

                        {/* Referred Caretakers */}
                        <section className="mb-6">
                            <div className="flex items-center justify-between mb-4 px-2">
                                <div>
                                    <h2 className="text-lg sm:text-xl font-bold text-[#1e6b4e] tracking-tight mb-1">
                                        Referred Caretakers
                                    </h2>
                                    <p className="text-sm text-[#546E5C]/80">Vetted by your village</p>
                                </div>
                                <button
                                    type="button"
                                    className="text-sm text-[#1e6b4e] hover:underline font-medium flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-[#1e6b4e] focus:ring-offset-2 rounded-lg px-2 py-1"
                                >
                                    View All
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="overflow-x-auto hide-scrollbar -mx-4 px-4 pb-2">
                                {caregiversLoading ? (
                                    // Loading State
                                    <div className="flex gap-4">
                                        {[1, 2, 3].map(i => (
                                            <div
                                                key={i}
                                                className="flex-shrink-0 w-64 h-80 bg-gray-100 rounded-[20px] animate-pulse"
                                            />
                                        ))}
                                    </div>
                                ) : referredCaregivers.length === 0 ? (
                                    // Empty State
                                    <div className="bg-white rounded-[20px] p-8 text-center border border-gray-100">
                                        <div className="w-16 h-16 rounded-full bg-[#d8f5e5] flex items-center justify-center mx-auto mb-4">
                                            <Users className="w-8 h-8 text-[#1e6b4e]" />
                                        </div>
                                        <h3 className="font-semibold text-[#1e6b4e] mb-2">Trusted recommendations from your village</h3>
                                        <p className="text-sm text-[#546E5C] mb-4 max-w-md mx-auto">
                                            As your village grows, families here will share caregivers they trust. You can also refer someone you know.
                                        </p>
                                        <button
                                            onClick={() => setShowReferCaregiverModal(true)}
                                            className="px-6 py-2 bg-[#1e6b4e] text-white rounded-full font-medium hover:bg-[#155a3e] transition-colors shadow-sm"
                                        >
                                            Refer a Caregiver
                                        </button>
                                    </div>
                                ) : (
                                    // Caregivers List
                                    <div className="flex gap-4">
                                        {referredCaregivers.map(caregiver => (
                                            <NannyCard
                                                key={caregiver.caregiver_id}
                                                id={caregiver.caregiver_id}
                                                name={caregiver.display_name}
                                                photo={caregiver.avatar_url || 'https://via.placeholder.com/400x300?text=No+Photo'}
                                                experience={caregiver.experience}
                                                rating={caregiver.rating}
                                                reviewCount={caregiver.review_count}
                                                referredBy={caregiver.referrer_name}
                                                referralCount={caregiver.referrer_count}
                                                distance={caregiver.distance_miles}
                                                available={formatAvailability(caregiver.availability_days)}
                                                verified={caregiver.verified}
                                                inVillage={true}
                                                referrerNote={caregiver.referrer_note}
                                                onViewProfile={handleViewProfile}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* People You May Know / Invite Banner — Bottom of left column */}
                        <section className="bg-white rounded-[20px] p-6 shadow-sm border border-gray-100 mb-6">
                            {suggestedConnections.length > 0 && (
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold text-[#1e6b4e]">People You May Know</h2>
                                    <Link to="/matches" className="text-sm text-[#1e6b4e] font-semibold hover:underline">
                                        View All →
                                    </Link>
                                </div>
                            )}

                            {connectionsLoading ? (
                                <div className="flex gap-4 overflow-x-auto pb-2">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="flex-shrink-0 w-36 h-48 bg-gray-100 rounded-[15px] animate-pulse" />
                                    ))}
                                </div>
                            ) : suggestedConnections.length === 0 ? (
                                <div className="flex items-center justify-between py-1">
                                    <p className="text-sm text-[#546E5C]" style={{ fontFamily: 'Comfortaa, sans-serif' }}>
                                        Know someone who'd love Opeari?
                                    </p>
                                    <div className="flex items-center gap-4">
                                        <Link to="/invite-friends" className="text-sm font-semibold text-[#1E6B4E] hover:underline" style={{ fontFamily: 'Comfortaa, sans-serif' }}>
                                            Invite a Friend
                                        </Link>
                                        <Link to="/matches" className="text-sm text-[#546E5C] hover:text-[#1E6B4E]" style={{ fontFamily: 'Comfortaa, sans-serif' }}>
                                            Discover More →
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-none">
                                    {suggestedConnections.map(person => (
                                        <div
                                            key={person.member_id}
                                            className="flex-shrink-0 w-36 bg-white rounded-[15px] p-4 border border-gray-100 hover:border-[#8bd7c7] hover:shadow-md transition-all text-center group"
                                        >
                                            <img
                                                src={person.avatar_url || 'https://via.placeholder.com/100'}
                                                alt={person.display_name}
                                                className="w-16 h-16 rounded-full object-cover mx-auto mb-3 border-2 border-[#8bd7c7] group-hover:scale-105 transition-transform"
                                            />
                                            <p className="font-semibold text-sm text-[#1e6b4e] truncate mb-0.5">
                                                {person.display_name}
                                            </p>
                                            <p className="text-xs text-[#546E5C] mb-1 truncate">
                                                {person.neighborhood || 'Nearby'}
                                            </p>
                                            <p className="text-xs text-[#546E5C] mb-1">
                                                {person.mutual_connection_count} mutual
                                            </p>
                                            <div className="flex flex-wrap gap-1 mt-2 mb-1">
                                                {getSharedCareTags(person).map((tag, idx) => (
                                                    <SharedCareTag key={idx} label={tag} />
                                                ))}
                                            </div>
                                            {!person.care_types?.includes('nanny-share') && (
                                                <div className="mb-3"></div>
                                            )}
                                            {person.connection_status === 'accepted' ? (
                                                <Link
                                                    to={`/messages?to=${person.member_id}`}
                                                    className="w-full px-3 py-1.5 rounded-full bg-[#1e6b4e] text-white text-xs font-medium text-center block"
                                                >
                                                    Message
                                                </Link>
                                            ) : person.connection_status === 'pending' ? (
                                                <span className="w-full px-3 py-1.5 rounded-full border border-gray-200 text-[#546E5C] text-xs font-medium text-center block">
                                                    Pending
                                                </span>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => handleConnect(person.member_id)}
                                                    disabled={connectingTo === person.member_id}
                                                    className="w-full px-3 py-1.5 rounded-full border border-gray-300 text-[#546E5C] text-xs font-medium hover:border-[#1e6b4e] hover:text-[#1e6b4e] transition-all disabled:opacity-50"
                                                >
                                                    {connectingTo === person.member_id ? 'Sending...' : 'Connect'}
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <div className="flex-shrink-0 w-36 bg-gradient-to-br from-[#d8f5e5] to-[#8bd7c7]/20 rounded-[15px] p-4 border border-dashed border-[#8bd7c7] text-center flex flex-col items-center justify-center">
                                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mb-3 shadow-sm">
                                            <UserPlus className="w-6 h-6 text-[#1e6b4e]" />
                                        </div>
                                        <p className="text-xs text-[#1e6b4e] font-medium mb-3">
                                            Invite friends
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => setInviteModalOpen(true)}
                                            className="px-3 py-1.5 rounded-full bg-[#1e6b4e] text-white text-xs font-semibold hover:bg-[#155a3e] transition-all"
                                        >
                                            Invite
                                        </button>
                                    </div>
                                </div>
                            )}
                        </section>


                    </div >

                    {/* RIGHT COLUMN - Sidebar */}
                    < aside className="hidden lg:block space-y-6 lg:sticky lg:top-24 lg:self-start" >
                        {/* Village Feed (Moved from Left Column) */}
                        < section className="bg-white rounded-[20px] p-6 shadow-sm border border-gray-100 mb-6" >
                            <h3 className="text-xs font-bold text-[#546E5C] uppercase tracking-wide mb-4">
                                Posts Near You
                            </h3>

                            {/* Create Post Button */}
                            <button
                                type="button"
                                onClick={() => setShowCreatePost(true)}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-[50px] bg-[#1e6b4e] text-white font-semibold text-sm hover:bg-[#155a3e] transition-all mb-4"
                            >
                                <Plus className="w-4 h-4" />
                                Create Post
                            </button>

                            {/* Radius Selector */}
                            <div className="relative mb-3 z-10">
                                <button
                                    type="button"
                                    onClick={() => setRadiusDropdownOpen(!radiusDropdownOpen)}
                                    className="flex items-center gap-1 text-xs text-[#546E5C] hover:text-[#1e6b4e] transition-colors"
                                >
                                    <span>Within</span>
                                    <span className="font-semibold text-[#1e6b4e]">
                                        {radiusOptions.find(o => o.value === postsRadius)?.label}
                                    </span>
                                    <ChevronDown className={`w-3 h-3 text-[#1e6b4e] transition-transform ${radiusDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Dropdown */}
                                {radiusDropdownOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-10"
                                            onClick={() => setRadiusDropdownOpen(false)}
                                        />
                                        <div className="absolute top-full left-0 mt-1 bg-white rounded-[10px] shadow-lg border border-gray-100 py-1 z-20 min-w-[100px]">
                                            {radiusOptions.map(option => (
                                                <button
                                                    key={option.value}
                                                    type="button"
                                                    onClick={() => {
                                                        setPostsRadius(option.value);
                                                        setRadiusDropdownOpen(false);
                                                    }}
                                                    className={`
                                                      w-full px-3 py-2 text-left text-xs transition-colors
                                                      ${postsRadius === option.value
                                                            ? 'bg-[#d8f5e5] text-[#1e6b4e] font-semibold'
                                                            : 'text-[#546E5C] hover:bg-gray-50'
                                                        }
                                                    `}
                                                >
                                                    {option.label}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Divider */}
                            <div className="border-t border-gray-100 mb-4"></div>

                            {/* Posts List */}
                            {/* Posts List */}
                            {postsLoading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="animate-pulse">
                                            <div className="h-4 bg-gray-100 rounded w-24 mb-1" />
                                            <div className="h-3 bg-gray-100 rounded w-full mb-1" />
                                            <div className="h-3 bg-gray-100 rounded w-16" />
                                        </div>
                                    ))}
                                </div>
                            ) : filteredPosts.length === 0 ? (
                                <div className="text-center py-6">
                                    <p className="text-sm text-[#546E5C] mb-2">No posts yet</p>
                                    <p className="text-xs text-gray-400">Be the first to share something!</p>
                                </div>
                            ) : (
                                <div className="space-y-4 max-h-[280px] overflow-y-auto">
                                    {filteredPosts.map(post => (
                                        <button
                                            key={post.id}
                                            type="button"
                                            className="w-full text-left p-3 -mx-3 rounded-[10px] hover:bg-[#d8f5e5]/50 transition-all cursor-pointer group"
                                        >
                                            {/* Author Name */}
                                            <p className="font-semibold text-sm text-[#1e6b4e] mb-0.5 group-hover:underline">
                                                {post.author_name}
                                            </p>

                                            {/* Content - truncate to 2 lines */}
                                            <p className="text-sm text-gray-500 line-clamp-2 mb-0.5">
                                                {post.content}
                                            </p>

                                            {/* Meta */}
                                            <p className="text-xs text-gray-400">
                                                {post.neighborhood || 'Nearby'} • {timeAgo(post.created_at)}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* View All Link */}
                            {/* View All Link */}
                            <button
                                onClick={() => navigate('/posts')}
                                className="w-full text-center text-sm text-[#1e6b4e] font-semibold mt-4 hover:underline"
                            >
                                View All Posts
                            </button>
                        </section >

                        <QuickActionsSidebar
                            onShareWithVillage={() => setShowEditNeed(true)} // Or correct handler
                            onInviteToVillage={() => setInviteModalOpen(true)}
                            onReferCaregiver={() => setShowReferCaregiverModal(true)}
                        />
                    </aside >
                </div >



                {/* Mobile Quick Actions Bar */}
                <MobileQuickActionsBar onShareWithVillage={() => setShowCreatePost(true)} />
            </div >

            {/* Modals */}
            {/* Modals */}
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
            {
                showEditNeed && (
                    <CareNeedForm
                        careNeed={activeCareNeedToEdit}
                        onClose={() => {
                            setShowEditNeed(false);
                            setActiveCareNeedToEdit(null);
                        }}
                        onSave={handleSaveCareNeed}
                    />
                )
            }

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
