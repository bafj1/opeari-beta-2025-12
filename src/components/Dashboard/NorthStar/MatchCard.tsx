import { MapPin, CheckCircle2, Heart, Users, Clock } from 'lucide-react';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';

export interface MatchCardProps {
    id: string;
    targetMemberId: string; // REQUIRED - UUID from members.id
    onConnect?: (targetMemberId: string) => Promise<void>;
    onViewProfile?: (targetMemberId: string) => void;
    canViewProfile?: boolean;
    isSaved?: boolean;
    isSaving?: boolean;
    onToggleSave?: (targetMemberId: string) => void;
    canMessage?: boolean;
    onMessage?: (targetMemberId: string, name: string) => void;
    unreadCount?: number;
    connectionStatus?: 'none' | 'pending' | 'accepted';
    isConnecting?: boolean;
    name: string;
    photo: string;
    distance: number;

    scheduleOverlap?: number;
    matchDays: string[];

    type: 'parent' | 'caregiver';
    kids?: { age: number; name: string }[];
    availability?: string[];
    bio?: string;
    inNetwork?: boolean;
    inVillage?: boolean;
    verified?: boolean;
    responseRate?: number;
    lastActive?: string;
    interests?: string[];
    mutualConnections?: number;
    mutualConnectionPhotos?: string[];
    contextText?: string;
    tags?: string[];
}

export default function MatchCard({
    targetMemberId,
    onConnect,
    onViewProfile,
    connectionStatus = 'none',
    isConnecting = false,
    canViewProfile = false,
    isSaved = false,
    isSaving = false,
    onToggleSave,
    canMessage = false,
    onMessage,
    unreadCount = 0,
    name,
    photo,
    distance,

    scheduleOverlap,
    matchDays,

    type,
    kids,
    availability,
    inVillage = false,
    verified = false,
    // interests, // Unused in this version per Figma spec
    interests: _interests, // Keeping in props but marked unused
    mutualConnections = 0,
    mutualConnectionPhotos = [],
    contextText,
    tags,
}: MatchCardProps) {
    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const getConnectButtonState = () => {
        if (!onConnect) {
            return {
                label: 'Loading...',
                disabled: true,
                busy: true
            };
        }

        if (isConnecting) {
            return {
                label: 'Connecting...',
                disabled: true,
                busy: true
            };
        }
        if (connectionStatus === 'pending') {
            return {
                label: 'Pending',
                disabled: true,
                busy: false
            };
        }
        if (connectionStatus === 'accepted') {
            return {
                label: 'Connected',
                disabled: true,
                busy: false
            };
        }
        return {
            label: 'Connect',
            disabled: false,
            busy: false
        };
    };

    const connectState = getConnectButtonState();

    return (
        <Card className="overflow-hidden transition-all duration-200 bg-white border-2 border-[#8bd7c7]/30 rounded-[20px] hover:border-[#8bd7c7] hover:shadow-lg">
            <div className="flex flex-col sm:flex-row h-auto sm:h-[280px]">
                {/* Photo Section - Full Height */}
                <div className="relative w-full sm:w-[180px] h-[240px] sm:h-full flex-shrink-0">
                    <img src={photo} alt={name} className="w-full h-full object-cover" />

                    {/* Match Badge - Only Overlay */}
                    {typeof scheduleOverlap === 'number' && (
                        <div className="absolute top-3 left-3">
                            <Badge className="bg-[#1e6b4e] text-white border-0 px-3 py-1.5 rounded-[50px] text-sm font-bold shadow-lg">
                                {scheduleOverlap}% Match
                            </Badge>
                        </div>
                    )}
                </div>

                {/* Content Section */}
                <div className="flex-1 flex flex-col p-5 min-w-0 justify-between">
                    <div className="flex-1">
                        {/* Header Row */}
                        <div className="flex items-start justify-between mb-2.5">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <h3 className="text-xl font-semibold text-[#1e6b4e] truncate">{name}</h3>

                                    {/* Context Text */}
                                    {contextText && (
                                        <p className="text-xs font-medium text-[#E07A5F] mb-1.5 -mt-0.5 truncate">{contextText}</p>
                                    )}

                                    {verified && (
                                        <div title="Verified">
                                            <CheckCircle2
                                                className="size-5 text-[#1e6b4e] fill-[#8bd7c7] flex-shrink-0"
                                            />
                                        </div>
                                    )}

                                    {inVillage && (
                                        <Badge className="bg-[#1e6b4e] text-white border-0 px-2.5 py-1 rounded-[50px] text-xs font-semibold flex-shrink-0">
                                            Village
                                        </Badge>
                                    )}
                                </div>

                                {/* Distance + Type */}
                                <div className="flex items-center gap-2 text-xs mb-2.5">
                                    <MapPin className="size-3.5 text-[#546E5C]" />
                                    <span className="font-semibold text-[#546E5C]">{distance} miles</span>
                                    <span className="text-[#546E5C]">•</span>

                                    <Badge
                                        className={`border-0 px-2.5 py-1 rounded-[50px] text-xs font-semibold ${type === 'parent'
                                            ? 'bg-[#F8C3B3]/30 text-[#1e6b4e]'
                                            : 'bg-[#8bd7c7]/40 text-[#1e6b4e]'
                                            }`}
                                    >
                                        {type === 'parent' ? 'Parent' : 'Caregiver'}
                                    </Badge>
                                </div>

                                {/* Mutual Connections - Facepile */}
                                {mutualConnections > 0 && (
                                    <div className="flex items-center gap-2 mb-2.5">
                                        <div className="flex -space-x-2">
                                            {mutualConnectionPhotos.slice(0, 3).map((photoUrl, idx) => (
                                                <div
                                                    key={idx}
                                                    className="size-6 rounded-full border-2 border-white overflow-hidden bg-[#8bd7c7] shadow-sm"
                                                >
                                                    <img src={photoUrl} alt="" className="w-full h-full object-cover" />
                                                </div>
                                            ))}
                                        </div>
                                        <span className="text-xs text-[#1e6b4e] font-bold">
                                            {mutualConnections} {mutualConnections === 1 ? 'friend' : 'friends'} in common
                                        </span>
                                    </div>
                                )}

                                {/* Children / Availability */}
                                {type === 'parent' && kids && kids.length > 0 && (
                                    <div className="text-xs text-[#546E5C] flex items-center gap-1.5 mb-2.5">
                                        <Users className="size-3.5 text-[#1e6b4e]" />
                                        <span className="font-medium">
                                            {kids.length} {kids.length === 1 ? 'child' : 'children'}, ages{' '}
                                            {kids
                                                .map((k) => k.age)
                                                .sort((a, b) => a - b)
                                                .join(', ')}
                                        </span>
                                    </div>
                                )}

                                {type === 'caregiver' && availability && availability.length > 0 && (
                                    <div className="text-xs text-[#546E5C] flex items-center gap-1.5 mb-2.5">
                                        <Clock className="size-3.5 text-[#1e6b4e]" />
                                        <span className="font-medium">{availability.join(', ')}</span>
                                    </div>
                                )}

                                {/* Schedule Pills */}
                                <div>
                                    <span className="text-xs font-bold text-[#1e6b4e] block mb-1.5">
                                        Schedule Match:
                                    </span>
                                    <div className="flex gap-1">
                                        {daysOfWeek.map((day) => {
                                            const isMatch = matchDays.includes(day);
                                            return (
                                                <div
                                                    key={day}
                                                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-[10px] font-bold transition-all ${isMatch
                                                        ? 'bg-[#8bd7c7] text-[#1e6b4e] shadow-sm'
                                                        : 'bg-gray-100 text-gray-300'
                                                        }`}
                                                >
                                                    {day.slice(0, 1)}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Shared Care Tags */}
                            {tags && tags.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2 mb-1">
                                    {tags.map((tag, i) => (
                                        <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#8bd7c7]/20 text-[#1e6b4e] border border-[#8bd7c7]/30">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Heart */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className={`flex-shrink-0 -mt-1 -mr-2 transition-colors ${isSaved
                                    ? 'text-[#E8998D] hover:text-[#D4847A]'
                                    : 'text-[#d1d5db] hover:text-[#E8998D]'
                                    } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                                aria-label={isSaved ? 'Unsave' : 'Save'}
                                disabled={isSaving || !onToggleSave}
                                aria-busy={isSaving}
                                onClick={() => !isSaving && onToggleSave?.(targetMemberId)}
                            >
                                <Heart className={`size-5 ${isSaved ? 'fill-current' : ''}`} />
                            </Button>
                        </div>
                    </div>

                    {/* CTAs */}
                    <div className="flex flex-col sm:flex-row gap-3 mt-4 flex-shrink-0">
                        {/* CONNECT CTA (WIRED) */}
                        <Button
                            className="flex-1 bg-[#1e6b4e] hover:bg-[#155a3e] text-white border-0 rounded-[50px] shadow-sm transition-all duration-200 font-semibold text-sm h-11 disabled:bg-[#1e6b4e]/70 disabled:cursor-not-allowed"
                            disabled={connectState.disabled}
                            aria-busy={connectState.busy}
                            aria-disabled={connectState.disabled}
                            tabIndex={connectState.disabled ? -1 : 0}
                            onClick={() => !connectState.disabled && onConnect?.(targetMemberId)}
                        >
                            {connectState.label}
                        </Button>

                        <Button
                            className={`flex-1 rounded-[50px] font-semibold text-sm h-11 relative ${canMessage
                                ? 'bg-transparent text-[#1e6b4e] border-2 border-[#8bd7c7] hover:bg-[#8bd7c7]/20'
                                : 'bg-transparent opacity-50 cursor-not-allowed text-[#1e6b4e] border-2 border-[#8bd7c7]'
                                }`}
                            disabled={!canMessage}
                            aria-disabled={!canMessage}
                            tabIndex={!canMessage ? -1 : 0}
                            title={canMessage ? 'Send a message' : 'Messaging opens after connection'}
                            aria-label="Send message"
                            onClick={() => canMessage && onMessage?.(targetMemberId, name)}
                        >
                            Message
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </Button>
                        <Button
                            className={`flex-1 rounded-[50px] font-semibold text-sm h-11 ${canViewProfile
                                ? 'bg-transparent text-[#1e6b4e] border-2 border-[#8bd7c7] hover:bg-[#8bd7c7]/20'
                                : 'bg-transparent opacity-50 cursor-not-allowed text-[#1e6b4e] border-2 border-[#8bd7c7]'
                                }`}
                            disabled={!canViewProfile}
                            aria-disabled={!canViewProfile}
                            tabIndex={!canViewProfile ? -1 : 0}
                            title={canViewProfile ? 'View profile' : 'Available after you connect'}
                            aria-label="View profile"
                            onClick={() => canViewProfile && onViewProfile?.(targetMemberId)}
                        >
                            View Profile
                        </Button>
                    </div>
                </div>
            </div>
        </Card >
    );
}
