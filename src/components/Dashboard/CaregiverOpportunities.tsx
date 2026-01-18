import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { MapPin, Calendar, Clock, Users, ArrowRight, Check, Briefcase, AlertCircle } from 'lucide-react';
import { normalizeArea } from '../../utils/location';

interface Opportunity {
    request_id: string;
    area_bucket: string;
    care_type: string;
    days_needed: string[];
    time_windows: string[];
    age_bands: string[];
    start_timeframe: string;
    pay_band: string;
    requirements: string[];
    notes_for_caregiver: string;
    visibility: string;
    mutual_connections_count: number;
    already_expressed_interest: boolean;
}

export default function CaregiverOpportunities() {
    const { user } = useAuth();
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;

        async function fetchOpportunities() {
            try {
                const { data, error } = await supabase.rpc('get_opportunity_cards');
                if (error) throw error;
                setOpportunities(data || []);
            } catch (err) {
                console.error('Error fetching opportunities:', err);
                setError('Unable to load opportunities right now.');
            } finally {
                setLoading(false);
            }
        }

        fetchOpportunities();
    }, [user]);

    const handleExpressInterest = async (opportunityId: string) => {
        if (!user) return;
        setProcessingId(opportunityId);

        try {
            // Optimistic update
            setOpportunities(prev => prev.map(op =>
                op.request_id === opportunityId
                    ? { ...op, already_expressed_interest: true }
                    : op
            ));

            const { error } = await supabase
                .from('interest_requests')
                .insert({
                    request_id: opportunityId,
                    caregiver_id: user.id,
                    status: 'pending'
                });

            if (error) {
                // Check specifically for duplicate key errors (PGRST104 / 23505)
                // Treat uniqueness violation as success (user is "already interested")
                const msg = (error as any)?.message?.toLowerCase?.() || '';
                const isDuplicate = error.code === '23505' || msg.includes('duplicate key');

                if (!isDuplicate) {
                    throw error;
                }
            }
        } catch (err) {
            console.error('Error expressing interest:', err);
            // Revert optimistic update on real error
            setOpportunities(prev => prev.map(op =>
                op.request_id === opportunityId
                    ? { ...op, already_expressed_interest: false }
                    : op
            ));
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm animate-pulse space-y-4 mb-8">
                <div className="h-6 bg-gray-100 rounded w-1/3 mb-4"></div>
                <div className="h-32 bg-gray-50 rounded-xl"></div>
                <div className="h-32 bg-gray-50 rounded-xl"></div>
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
                    <h3 className="font-bold text-gray-800 text-lg mb-1">Couldn't load opportunities</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">
                        Please refresh. If it keeps happening, the app may be pointed at the wrong Supabase project.
                    </p>
                </div>
            </div>
        );
    }

    if (opportunities.length === 0) {
        return (
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center mb-8">
                <div className="w-12 h-12 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-3 text-stone-400">
                    <Briefcase size={20} />
                </div>
                <h3 className="font-bold text-gray-700">No new opportunities nearby</h3>
                <p className="text-sm text-gray-500 mt-1">Check back soon—new requests appear daily.</p>
            </div>
        );
    }

    return (
        <section className="mb-8">
            <h2 className="text-lg font-bold text-opeari-heading mb-4 flex items-center gap-2">
                <Briefcase className="text-opeari-green" size={20} />
                Opportunities Near You
            </h2>

            <div className="grid grid-cols-1 gap-4">
                {opportunities.map((op) => {
                    const isVillageOnly = String(op.visibility || '').toLowerCase().trim() === 'village_only';
                    return (
                        <div key={op.request_id} className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">

                            {/* Header: Role & Location */}
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-bold text-lg text-gray-800 capitalize">{op.care_type.replace(/_/g, ' ')}</h3>
                                    <div className="flex items-center gap-1.5 text-sm text-gray-500 font-medium mt-0.5">
                                        <MapPin size={14} className="text-gray-400" />
                                        {normalizeArea(op.area_bucket)}
                                    </div>
                                </div>
                                {op.pay_band && !/^0+$/.test(op.pay_band) && (
                                    <div className="px-3 py-1 bg-green-50 text-opeari-green font-bold text-sm rounded-full">
                                        {op.pay_band}
                                    </div>
                                )}
                            </div>

                            {/* Details Chips */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                {/* Days */}
                                {op.days_needed && op.days_needed.length > 0 && (
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-stone-50 text-stone-600 text-xs font-bold rounded-lg border border-stone-100">
                                        <Calendar size={12} />
                                        {op.days_needed.slice(0, 3).map(d => d.slice(0, 3)).join(', ')}{op.days_needed.length > 3 ? '+' : ''}
                                    </div>
                                )}

                                {/* Time */}
                                {op.time_windows && op.time_windows.length > 0 && (
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-stone-50 text-stone-600 text-xs font-bold rounded-lg border border-stone-100">
                                        <Clock size={12} />
                                        {op.time_windows.join(', ')}
                                    </div>
                                )}

                                {/* Age Bands */}
                                {op.age_bands && op.age_bands.length > 0 && (
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-100 uppercase tracking-wide">
                                        {op.age_bands.join(', ')}
                                    </div>
                                )}
                            </div>

                            {/* Notes */}
                            {op.notes_for_caregiver && (
                                <div className="bg-stone-50 rounded-xl p-3 mb-4 text-sm text-gray-600 italic">
                                    "{op.notes_for_caregiver}"
                                </div>
                            )}

                            {/* Footer: Connection & Action */}
                            <div className="flex items-center justify-between pt-3 border-t border-gray-100">

                                {/* Connection Indicator */}
                                <div className="flex items-center gap-2">
                                    {op.mutual_connections_count > 0 ? (
                                        <>
                                            <div className="flex -space-x-2">
                                                {[...Array(Math.min(3, op.mutual_connections_count))].map((_, i) => (
                                                    <div key={i} className="w-6 h-6 rounded-full bg-opeari-mint border-2 border-white flex items-center justify-center text-[8px] text-opeari-heading font-bold">
                                                        {/* Avatar placeholder */}
                                                    </div>
                                                ))}
                                            </div>
                                            <span className="text-xs font-bold text-opeari-green">In your village</span>
                                        </>
                                    ) : (
                                        isVillageOnly && (
                                            <span className="text-xs font-bold text-opeari-green flex items-center gap-1">
                                                <Users size={14} /> Connected Family
                                            </span>
                                        )
                                    )}
                                </div>

                                {/* CTA Button */}
                                <button
                                    onClick={() => handleExpressInterest(op.request_id)}
                                    disabled={op.already_expressed_interest || processingId === op.request_id}
                                    className={`
                                    flex items-center gap-2 px-5 py-2 rounded-full font-bold text-sm transition-all
                                    ${op.already_expressed_interest
                                            ? 'bg-green-100 text-opeari-green cursor-default pl-4 pr-5'
                                            : 'bg-opeari-heading text-white hover:bg-opeari-green shadow-md hover:shadow-lg active:scale-95'
                                        }
                                    disabled:opacity-70 disabled:active:scale-100
                                `}
                                >
                                    {op.already_expressed_interest ? (
                                        <>
                                            <Check size={16} /> Interest Sent
                                        </>
                                    ) : (
                                        <>
                                            Express Interest <ArrowRight size={16} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
