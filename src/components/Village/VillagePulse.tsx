import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Activity, Users, MapPin } from 'lucide-react';

interface PulseData {
    status: 'active' | 'seed' | 'unavailable';
    cohort_size: number;
    cohort_type: 'neighborhood' | 'zip';
    top_needs: string[];
    message?: string;
}

export default function VillagePulse() {
    const { user } = useAuth();
    const [data, setData] = useState<PulseData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        async function fetchPulse() {
            try {
                const { data: intel, error } = await supabase.rpc('get_community_intel', {
                    query_user_id: user!.id
                });

                if (error) throw error;
                setData(intel as PulseData);
            } catch (err) {
                console.error('Pulse fetch error:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchPulse();
    }, [user]);

    if (loading) return <div className="h-32 bg-white rounded-xl animate-pulse mb-6" />;

    if (!data || data.status === 'unavailable') return null;

    return (
        <div className="bg-white rounded-xl p-5 mb-6 border border-opeari-border/50 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-opeari-mint rounded-lg text-opeari-green">
                    <Activity size={18} />
                </div>
                <h3 className="font-bold text-opeari-heading text-lg">Village Pulse</h3>
            </div>

            {data.status === 'active' ? (
                <div>
                    <p className="text-sm text-opeari-text-secondary mb-3 italic">
                        Village Pulse comes alive as your village grows.
                    </p>
                    <div className="flex items-center gap-2 text-sm text-opeari-text mb-3">
                        <Users size={14} className="text-opeari-green" />
                        <span>Based on {data.cohort_size} families in your {data.cohort_type}</span>
                    </div>
                    <div className="space-y-2">
                        {data.top_needs.map((need, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm px-3 py-2 bg-[#F8FAFC] rounded-lg text-opeari-heading font-medium border border-gray-100">
                                <div className="w-1.5 h-1.5 rounded-full bg-opeari-green" />
                                Top need: {need}
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="text-center py-2">
                    <div className="flex justify-center mb-2 text-opeari-text/40">
                        <MapPin size={24} />
                    </div>
                    <p className="text-sm text-opeari-text mb-1 font-medium">We're still warming up your area.</p>
                    <p className="text-xs text-opeari-text-secondary">Invite a neighbor to unlock local insights.</p>
                </div>
            )}
        </div>
    );
}
