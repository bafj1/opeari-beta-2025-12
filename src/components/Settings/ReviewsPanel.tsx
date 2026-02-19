import { useState, useEffect } from 'react';
import { Star, Users, Award } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useViewer } from '../../hooks/useViewer';

export default function ReviewsPanel() {
    const { viewer } = useViewer();
    const [endorsements, setEndorsements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ count: 0, avgRating: 0 });

    useEffect(() => {
        if (!viewer?.user?.id) return;

        async function fetchEndorsements() {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('endorsements')
                    .select('*')
                    .eq('recipient_id', viewer?.user?.id)
                    .eq('is_visible', true)
                    .order('created_at', { ascending: false });

                if (error) {
                    // Table might not exist yet — handle gracefully
                    if (
                        error.code === '42P01' ||
                        error.code === 'PGRST204' ||
                        error.code === 'PGRST205' ||
                        error.message?.includes('does not exist') ||
                        error.message?.includes('not find the table') ||
                        error.message?.includes('relation') ||
                        error.message?.includes('schema cache')
                    ) {
                        console.warn('Endorsements table not yet created — showing empty state');
                        setEndorsements([]);
                    } else {
                        console.error('Error fetching endorsements:', error);
                    }
                } else if (data) {
                    setEndorsements(data);
                    const ratings = data.filter((e: any) => e.rating).map((e: any) => e.rating as number);
                    setStats({
                        count: data.length,
                        avgRating: ratings.length > 0
                            ? Math.round((ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length) * 10) / 10
                            : 0,
                    });
                }
            } catch (err) {
                // Network or other errors — fail silently
                console.error('Error fetching endorsements:', err);
                setEndorsements([]);
            } finally {
                setLoading(false);
            }
        }
        fetchEndorsements();
    }, [viewer?.user?.id]);

    const relationshipLabel = (rel: string) => {
        switch (rel) {
            case 'personal': return 'Used personally';
            case 'friend': return 'Friend recommended';
            case 'neighbor': return 'Neighbor';
            default: return 'Other';
        }
    };

    if (loading) {
        return <div className="text-sm text-[#546E5C] p-8 text-center">Loading endorsements...</div>;
    }

    return (
        <div className="space-y-6 max-w-3xl">
            {/* Stats Summary */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <h3 className="text-base font-bold text-[#1e6b4e] mb-4">Your Reputation</h3>
                <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-[#f0faf4] rounded-xl">
                        <Users className="w-5 h-5 text-[#1e6b4e] mx-auto mb-1" />
                        <p className="text-2xl font-bold text-[#1e6b4e]">{stats.count}</p>
                        <p className="text-xs text-[#546E5C]">Endorsements</p>
                    </div>
                    <div className="text-center p-4 bg-[#f0faf4] rounded-xl">
                        <Star className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                        <p className="text-2xl font-bold text-[#1e6b4e]">
                            {stats.avgRating > 0 ? stats.avgRating : '—'}
                        </p>
                        <p className="text-xs text-[#546E5C]">Avg Rating</p>
                    </div>
                    <div className="text-center p-4 bg-[#f0faf4] rounded-xl">
                        <Award className="w-5 h-5 text-[#8bd7c7] mx-auto mb-1" />
                        <p className="text-2xl font-bold text-[#1e6b4e]">
                            {stats.count >= 3 ? 'Trusted' : stats.count >= 1 ? 'New' : '—'}
                        </p>
                        <p className="text-xs text-[#546E5C]">Status</p>
                    </div>
                </div>
            </div>

            {/* Endorsements List */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <h3 className="text-base font-bold text-[#1e6b4e] mb-3">Endorsements from Your Village</h3>

                {endorsements.length === 0 ? (
                    <div className="border-2 border-dashed border-[#8bd7c7]/30 rounded-xl p-6 text-center">
                        <Users className="w-8 h-8 text-[#8bd7c7] mx-auto mb-2" />
                        <p className="text-sm text-[#546E5C] mb-1">No endorsements yet</p>
                        <p className="text-xs text-[#546E5C]/70">
                            When families in your village refer or endorse you, their recommendations will appear here.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {endorsements.map((endorsement: any) => (
                            <div key={endorsement.id} className="p-4 bg-[#f0faf4] rounded-xl">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-[#1e6b4e] flex items-center justify-center">
                                            <span className="text-white text-xs font-bold">
                                                {endorsement.endorser_name?.charAt(0) || '?'}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-[#1e6b4e]">
                                                {endorsement.endorser_name || 'A village member'}
                                            </p>
                                            <p className="text-[10px] text-[#546E5C]">
                                                {relationshipLabel(endorsement.relationship)}
                                            </p>
                                        </div>
                                    </div>
                                    {endorsement.rating && (
                                        <div className="flex items-center gap-0.5">
                                            {[1, 2, 3, 4, 5].map((star: number) => (
                                                <Star
                                                    key={star}
                                                    className={`w-3.5 h-3.5 ${star <= endorsement.rating
                                                        ? 'text-amber-400 fill-amber-400'
                                                        : 'text-gray-200'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {endorsement.note && (
                                    <p className="text-sm text-[#546E5C] italic">
                                        &ldquo;{endorsement.note}&rdquo;
                                    </p>
                                )}
                                <p className="text-[10px] text-[#546E5C]/60 mt-2">
                                    {new Date(endorsement.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
