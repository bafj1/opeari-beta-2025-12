import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Award, User, ChevronRight, AlertCircle, Check, X } from 'lucide-react';
import { normalizeArea, normalizeVisibility } from '../../utils/location';

interface Interest {
    interest_id: string;
    care_type: string;
    expressed_at: string;
    caregiver_first_name: string;
    caregiver_last_name: string;
    caregiver_type?: string;
    years_experience?: string;
    certifications?: unknown;
    interest_status?: string;
    area_bucket?: string;
    request_visibility?: string;
}

const CERT_LABEL_MAP: Record<string, string> = {
    cpr: 'CPR',
    first_aid: 'First Aid',
    background_check: 'Background Check',
    infant_care: 'Infant Care',
    toddler_care: 'Toddler Care',
    newborn_care: 'Newborn Care',
    special_needs: 'Special Needs',
    early_childhood: 'Early Childhood',
    lifeguard: 'Lifeguard Certified',
    water_safety: 'Water Safety',
    teaching: 'Teaching Experience',
    nursing: 'Nursing Background'
};

const formatCertLabel = (raw: string): string => {
    const key = raw.toLowerCase().replace(/\s+/g, '_');
    return CERT_LABEL_MAP[key]
        ?? raw
            .replace(/_/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase());
};

const normalizeCertifications = (raw: unknown): string[] => {
    if (!raw) return [];

    let values: string[] = [];

    if (Array.isArray(raw)) {
        values = raw.map(v => String(v));
    } else if (typeof raw === 'string') {
        const trimmed = raw.trim();
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            try {
                return normalizeCertifications(JSON.parse(trimmed));
            } catch {
                values = trimmed.split(',');
            }
        } else {
            values = trimmed.split(',');
        }
    } else if (typeof raw === 'object') {
        const obj = raw as Record<string, unknown>;
        values = Object.entries(obj)
            .filter(([_, v]) => !!v)
            .map(([k]) => k);
    }

    return values
        .map(v => formatCertLabel(v.trim()))
        .filter(Boolean);
};

export default function IncomingInterests() {
    const { user } = useAuth();
    const [interests, setInterests] = useState<Interest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    useEffect(() => {
        if (!user) return;

        async function fetchInterests() {
            try {
                const { data, error } = await supabase.rpc('get_incoming_interests');
                if (error) throw error;
                setInterests(data || []);
            } catch (err) {
                console.error('Error fetching interests:', err);
                setError('Unable to load incoming interests.');
            } finally {
                setLoading(false);
            }
        }

        fetchInterests();
    }, [user]);

    // Toast auto-hide
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const handleUpdateStatus = async (interestId: string, newStatus: 'accepted' | 'declined') => {
        if (!user || processingId === interestId) return;

        setProcessingId(interestId);

        // Optimistic update
        const previousInterests = [...interests];
        setInterests(prev => prev.map(i =>
            i.interest_id === interestId ? { ...i, interest_status: newStatus } : i
        ));

        try {
            const { error } = await supabase.rpc('update_incoming_interest_status', {
                p_interest_id: interestId,
                p_new_status: newStatus
            });

            if (error) throw error;

            setToast({
                type: 'success',
                message: newStatus === 'accepted' ? 'Intro accepted' : 'Passed'
            });

        } catch (err) {
            console.error('Error updating status:', err);
            // Revert on error
            setInterests(previousInterests);
            setToast({
                type: 'error',
                message: "Couldn't update — please retry"
            });
        } finally {
            setProcessingId(null);
        }
    };

    const isRecent = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        return diff < 24 * 60 * 60 * 1000;
    };

    const getStatusPill = (status?: string) => {
        switch (status) {
            case 'accepted':
                return <span className="px-2.5 py-0.5 bg-opeari-mint text-opeari-heading text-[10px] font-bold uppercase tracking-wide rounded-full">Accepted</span>;
            case 'declined':
                return <span className="px-2.5 py-0.5 bg-stone-100 text-stone-500 text-[10px] font-bold uppercase tracking-wide rounded-full">Passed</span>;
            case 'pending':
            default:
                return <span className="px-2.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wide rounded-full">Pending</span>;
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm animate-pulse mb-8">
                <div className="h-6 bg-gray-100 rounded w-1/3 mb-4"></div>
                <div className="h-24 bg-gray-50 rounded-xl"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-2xl p-6 border border-red-100 shadow-sm mb-8 flex items-start gap-4">
                <div className="p-2 bg-red-50 text-red-600 rounded-full shrink-0">
                    <AlertCircle size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-gray-800 text-lg mb-1">Couldn't load incoming interests</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">
                        Please refresh. If it keeps happening, the app may be pointed at the wrong Supabase project.
                    </p>
                </div>
            </div>
        );
    }

    if (interests.length === 0) {
        return (
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center mb-8">
                <div className="w-12 h-12 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-3 text-stone-400">
                    <User size={20} />
                </div>
                <h3 className="font-bold text-gray-700">No incoming interests yet</h3>
                <p className="text-sm text-gray-500 mt-1">When a caregiver expresses interest, you'll see it here.</p>
            </div>
        );
    }

    return (
        <div className="mb-8 relative">
            <h2 className="text-lg font-bold text-opeari-heading mb-4 flex items-center gap-2">
                Incoming Interests
                <span className="bg-opeari-mint text-opeari-green text-xs px-2 py-0.5 rounded-full">
                    {interests.length}
                </span>
            </h2>

            {/* Toast Notification */}
            {toast && (
                <div className={`absolute top-0 right-0 z-10 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold shadow-md transition-all animate-fade-in ${toast.type === 'success' ? 'bg-opeari-heading text-white' : 'bg-red-50 text-red-600 border border-red-100'
                    }`}>
                    {toast.type === 'success' ? <Check size={16} /> : <X size={16} />}
                    {toast.message}
                </div>
            )}

            <div className="grid gap-4">
                {interests.map((interest) => {
                    const certs = normalizeCertifications(interest.certifications);
                    const isPending = !interest.interest_status || interest.interest_status === 'pending';
                    const isAccepted = interest.interest_status === 'accepted';
                    const isDeclined = interest.interest_status === 'declined';
                    const isProcessing = processingId === interest.interest_id;

                    // Dynamic card classes
                    let cardClasses = "bg-white rounded-2xl p-5 border border-gray-200 shadow-sm relative overflow-hidden transition-all duration-300";
                    if (isPending) {
                        cardClasses += " hover:shadow-md hover:-translate-y-[1px]";
                    } else if (isAccepted) {
                        cardClasses += " ring-1 ring-opeari-mint/40";
                    } else if (isDeclined) {
                        cardClasses += " opacity-80 grayscale-[0.15]";
                    }

                    return (
                        <div key={interest.interest_id} className={cardClasses}>

                            {/* Status & Date Top Row */}
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    {/* Opeari Avatar */}
                                    <div className="w-10 h-10 bg-opeari-mint text-opeari-heading rounded-full flex items-center justify-center font-bold text-lg relative">
                                        {interest.caregiver_first_name[0]}
                                        {isRecent(interest.expressed_at) && (
                                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-opeari-coral border-2 border-white rounded-full animate-pulse"></div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                            {interest.caregiver_first_name} {interest.caregiver_last_name ? `${interest.caregiver_last_name[0]}.` : ''}
                                        </h3>
                                        <div className="text-xs text-gray-500 font-medium flex items-center gap-1.5">
                                            {interest.caregiver_type || 'Caregiver'}
                                            {interest.years_experience ? `• ${interest.years_experience}` : ''}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-1">
                                    {getStatusPill(interest.interest_status)}
                                    <span className="text-[10px] text-gray-400 font-medium">
                                        {new Date(interest.expressed_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>

                            {/* Care Type Badge & Subline */}
                            {/* Care Type Badge & Subline */}
                            <div className="mb-4">
                                <span className="inline-block px-3 py-1 bg-stone-100 text-stone-600 rounded-lg text-xs font-bold capitalize">
                                    Interested in: {interest.care_type.replace(/_/g, ' ')}
                                </span>

                                {/* Area & Visibility Subline */}
                                {(interest.area_bucket || interest.request_visibility) && (
                                    <div className="mt-1.5 px-1 text-xs text-stone-400 font-medium flex items-center gap-1.5">
                                        <span className="text-stone-500">
                                            {normalizeArea(interest.area_bucket)}
                                        </span>
                                        <span>•</span>
                                        <span>
                                            {normalizeVisibility(interest.request_visibility)}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Certifications (if present) */}
                            {certs.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mb-5">
                                    {certs.map((cert, i) => (
                                        <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 border border-stone-200 bg-stone-50 text-stone-600 text-[10px] font-bold rounded uppercase tracking-wide">
                                            <Award size={10} /> {cert}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Action Buttons (Show only if Pending) */}
                            {isPending && (
                                <div className="flex gap-3 pt-3 border-t border-gray-100">
                                    <button
                                        onClick={() => handleUpdateStatus(interest.interest_id, 'accepted')}
                                        disabled={isProcessing}
                                        className="flex-1 bg-opeari-heading text-white py-2 rounded-xl font-bold text-sm shadow-sm hover:bg-opeari-green transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Accept Intro <ChevronRight size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleUpdateStatus(interest.interest_id, 'declined')}
                                        disabled={isProcessing}
                                        className="px-6 py-2 bg-white border border-gray-200 text-gray-500 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Pass
                                    </button>
                                </div>
                            )}

                        </div>
                    );
                })}
            </div>
        </div>
    );
}
