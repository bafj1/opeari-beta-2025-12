import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import {
    X, MapPin, Star, Calendar, CheckCircle2,
    MessageSquare, Shield, Heart
} from 'lucide-react';

interface ProfileModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    memberId: string | null;
    onMessage?: (memberId: string, name: string) => void;
}

interface MemberProfile {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    role: string;
    neighborhood: string | null;
    zip_code: string;
    bio: string | null;
    availability_days: string[];
    onboarding_complete: boolean;
    // Caregiver specific
    years_experience?: string;
    certifications?: any[];
    hourly_rate?: string;
    // Family specific
    num_kids?: number;
    kids_ages?: string[];
    care_types?: string[];
}

export default function ProfileModal({
    open,
    onOpenChange,
    memberId,
    onMessage
}: ProfileModalProps) {
    const [profile, setProfile] = useState<MemberProfile | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!open || !memberId) {
            setProfile(null);
            return;
        }

        async function fetchProfile() {
            setLoading(true);
            setError(null);

            try {
                // Fetch member data
                const { data: memberData, error: memberError } = await supabase
                    .from('members')
                    .select('*')
                    .eq('id', memberId)
                    .single();

                if (memberError) throw memberError;

                // If caregiver, also fetch caregiver profile
                let caregiverData = null;
                if (memberData.role === 'caregiver') {
                    const { data } = await supabase
                        .from('caregiver_profiles')
                        .select('*')
                        .eq('user_id', memberId)
                        .single();
                    caregiverData = data;
                }

                setProfile({
                    ...memberData,
                    years_experience: caregiverData?.years_experience,
                    certifications: caregiverData?.certifications,
                    hourly_rate: caregiverData?.hourly_rate,
                });
            } catch (err: any) {
                console.error('Error fetching profile:', err);
                setError('Could not load profile');
            } finally {
                setLoading(false);
            }
        }

        fetchProfile();
    }, [open, memberId]);

    if (!open) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onOpenChange(false);
        }
    };

    const formatDays = (days: string[]) => {
        if (!days || days.length === 0) return 'Flexible schedule';
        if (days.length === 5 && ['mon', 'tue', 'wed', 'thu', 'fri'].every(d => days.includes(d))) {
            return 'Weekdays';
        }
        if (days.length === 7) return 'All week';
        const dayMap: Record<string, string> = {
            mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu',
            fri: 'Fri', sat: 'Sat', sun: 'Sun'
        };
        return days.map(d => dayMap[d] || d).join(', ');
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleBackdropClick}
        >
            <div className="bg-white rounded-[20px] max-w-lg w-full max-h-[90vh] overflow-y-auto">
                {/* Header with close button */}
                <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-[20px]">
                    <h2 className="text-lg font-bold text-[#1e6b4e]">Profile</h2>
                    <button
                        onClick={() => onOpenChange(false)}
                        className="text-[#546E5C] hover:text-[#1e6b4e] transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {loading ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 rounded-full bg-gray-100 animate-pulse" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-6 bg-gray-100 rounded w-32 animate-pulse" />
                                    <div className="h-4 bg-gray-100 rounded w-24 animate-pulse" />
                                </div>
                            </div>
                            <div className="h-20 bg-gray-100 rounded animate-pulse" />
                        </div>
                    ) : error ? (
                        <div className="text-center py-8">
                            <p className="text-red-500">{error}</p>
                            <button
                                onClick={() => onOpenChange(false)}
                                className="mt-4 text-[#1e6b4e] font-semibold"
                            >
                                Close
                            </button>
                        </div>
                    ) : profile ? (
                        <div className="space-y-6">
                            {/* Profile Header */}
                            <div className="flex items-start gap-4">
                                <img
                                    src={profile.avatar_url || 'https://via.placeholder.com/100?text=' + profile.first_name?.[0]}
                                    alt={profile.first_name}
                                    className="w-20 h-20 rounded-full object-cover border-2 border-[#8bd7c7]"
                                />
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-[#1e6b4e]">
                                        {profile.first_name} {profile.last_name?.[0]}.
                                    </h3>
                                    <p className="text-sm text-[#546E5C] capitalize">
                                        {profile.role === 'caregiver' ? 'Caregiver' : 'Family'}
                                    </p>

                                    {/* Location */}
                                    <div className="flex items-center gap-1 mt-2 text-sm text-[#546E5C]">
                                        <MapPin className="w-4 h-4" />
                                        <span>{profile.neighborhood || profile.zip_code}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Badges */}
                            <div className="flex flex-wrap gap-2">
                                {profile.onboarding_complete && (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#d8f5e5] text-[#1e6b4e] text-xs font-semibold">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        Verified Member
                                    </span>
                                )}
                                {profile.role === 'caregiver' && profile.years_experience && (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#F8C3B3]/20 text-[#1e6b4e] text-xs font-semibold">
                                        <Star className="w-3.5 h-3.5" />
                                        {profile.years_experience}
                                    </span>
                                )}
                            </div>

                            {/* Bio */}
                            {profile.bio && (
                                <div>
                                    <h4 className="text-sm font-semibold text-[#1e6b4e] mb-2">About</h4>
                                    <p className="text-sm text-[#546E5C] leading-relaxed">
                                        {profile.bio}
                                    </p>
                                </div>
                            )}

                            {/* Availability */}
                            <div>
                                <h4 className="text-sm font-semibold text-[#1e6b4e] mb-2">Availability</h4>
                                <div className="flex items-center gap-2 text-sm text-[#546E5C]">
                                    <Calendar className="w-4 h-4 text-[#1e6b4e]" />
                                    <span>{formatDays(profile.availability_days)}</span>
                                </div>
                            </div>

                            {/* Family specific: Kids */}
                            {profile.role === 'family' && profile.num_kids && (
                                <div>
                                    <h4 className="text-sm font-semibold text-[#1e6b4e] mb-2">Family</h4>
                                    <div className="flex items-center gap-2 text-sm text-[#546E5C]">
                                        <Heart className="w-4 h-4 text-[#F8C3B3]" />
                                        <span>
                                            {profile.num_kids} {profile.num_kids === 1 ? 'child' : 'children'}
                                            {profile.kids_ages?.length ? ` (ages ${profile.kids_ages.join(', ')})` : ''}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Care Types Looking For */}
                            {profile.care_types && profile.care_types.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold text-[#1e6b4e] mb-2">Looking For</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {profile.care_types.map((type, i) => (
                                            <span
                                                key={i}
                                                className="px-3 py-1 rounded-full bg-gray-100 text-[#546E5C] text-xs"
                                            >
                                                {type}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Certifications for caregivers */}
                            {profile.role === 'caregiver' && profile.certifications && profile.certifications.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold text-[#1e6b4e] mb-2">Certifications</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {profile.certifications.map((cert: any, i: number) => (
                                            <span
                                                key={i}
                                                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#d8f5e5] text-[#1e6b4e] text-xs font-medium"
                                            >
                                                <Shield className="w-3 h-3" />
                                                {cert.name || cert}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4 border-t border-gray-100">
                                <button
                                    onClick={() => {
                                        if (onMessage && profile) {
                                            onMessage(profile.id, `${profile.first_name} ${profile.last_name?.[0] || ''}.`);
                                        }
                                        onOpenChange(false);
                                    }}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-[50px] bg-[#1e6b4e] text-white font-semibold text-sm hover:bg-[#155a3e] transition-all"
                                >
                                    <MessageSquare className="w-4 h-4" />
                                    Send Message
                                </button>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
