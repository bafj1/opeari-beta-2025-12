import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { createNotification } from '../../lib/notifications';

interface ConnectionRequest {
    id: string;
    requester: {
        id: string;
        first_name: string;
        last_name: string;
        avatar_url: string | null;
        neighborhood: string | null;
        role: string;
        bio: string | null;
    };
    created_at: string;
}

export default function ConnectionRequestsCard() {
    const [pendingRequests, setPendingRequests] = useState<ConnectionRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchPending = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data, error } = await supabase
                    .from('connections')
                    .select('*, requester:members!requester_id(id, first_name, last_name, avatar_url, neighborhood, role, bio)')
                    .eq('recipient_id', user.id)
                    .eq('status', 'pending')
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('Error fetching connection requests:', error);
                } else {
                    setPendingRequests(data || []);
                }
            } catch (err) {
                console.error('Exception fetching connection requests:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchPending();

        // Optional: subscribe to changes
        const subscription = supabase
            .channel('connection-requests-card')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'connections',
            }, () => {
                fetchPending();
            })
            .subscribe();

        return () => { supabase.removeChannel(subscription); };
    }, []);

    if (loading || pendingRequests.length === 0) return null;

    return (
        <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            marginBottom: '24px',
            border: '1px solid rgba(139, 215, 199, 0.3)',
        }}>
            {/* Header */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: '16px',
            }}>
                <div>
                    <h3 style={{
                        fontSize: '16px', fontWeight: 700, color: '#1E6B4E',
                        margin: 0, fontFamily: 'Comfortaa, sans-serif',
                    }}>
                        Connection Requests
                    </h3>
                    <p style={{ fontSize: '13px', color: '#6B7280', margin: '2px 0 0' }}>
                        {pendingRequests.length} {pendingRequests.length === 1 ? 'person wants' : 'people want'} to join your village
                    </p>
                </div>
            </div>

            {/* Request list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {pendingRequests.map(req => (
                    <div key={req.id} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '14px 16px',
                        borderRadius: '12px',
                        backgroundColor: '#fffaf5',
                        border: '1px solid #f0f0f0',
                    }}>
                        {/* Left: avatar + info */}
                        <div
                            style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, cursor: 'pointer' }}
                            onClick={() => navigate(`/member/${req.requester.id}`)}
                        >
                            <div style={{
                                width: 48, height: 48, borderRadius: '50%',
                                backgroundColor: '#e6f4f1',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                overflow: 'hidden', flexShrink: 0,
                            }}>
                                {req.requester.avatar_url ? (
                                    <img src={req.requester.avatar_url} alt=""
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <span style={{ fontSize: '18px', fontWeight: 700, color: '#1E6B4E' }}>
                                        {req.requester.first_name?.[0]}
                                    </span>
                                )}
                            </div>
                            <div style={{ minWidth: 0 }}>
                                <div style={{ fontWeight: 600, color: '#1E6B4E', fontSize: '15px' }}>
                                    {req.requester.first_name} {req.requester.last_name?.[0]}.
                                </div>
                                <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '1px' }}>
                                    {req.requester.role === 'family' ? 'Parent' :
                                        req.requester.role === 'caregiver' ? 'Caregiver' : 'Member'}
                                    {req.requester.neighborhood ? ` · ${req.requester.neighborhood}` : ''}
                                </div>
                                {req.requester.bio && (
                                    <div style={{
                                        fontSize: '12px', color: '#9CA3AF', marginTop: '4px',
                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                        maxWidth: '300px',
                                    }}>
                                        {req.requester.bio}
                                    </div>
                                )}
                                <div style={{ marginTop: '4px' }}>
                                    <span
                                        onClick={(e) => { e.stopPropagation(); navigate(`/member/${req.requester.id}`); }}
                                        style={{ fontSize: '12px', color: '#1E6B4E', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                                    >
                                        View Profile →
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Right: action buttons */}
                        <div style={{ display: 'flex', gap: '8px', flexShrink: 0, marginLeft: '12px' }}>
                            <button
                                onClick={async () => {
                                    const { error } = await supabase
                                        .from('connections')
                                        .update({ status: 'accepted', updated_at: new Date().toISOString() })
                                        .eq('id', req.id);

                                    if (!error) {
                                        setPendingRequests(prev => prev.filter(r => r.id !== req.id));

                                        // Notify the requester
                                        await createNotification({
                                            userId: req.requester.id,
                                            type: 'connection_accepted',
                                            title: 'Connection accepted',
                                            body: `You are now connected with a neighbor`,
                                            fromUserId: (await supabase.auth.getUser()).data.user?.id,
                                            link: `/member/${(await supabase.auth.getUser()).data.user?.id}`,
                                        });
                                    }
                                }}
                                style={{
                                    backgroundColor: '#1E6B4E', color: 'white',
                                    padding: '8px 20px', borderRadius: '8px', fontWeight: 600,
                                    border: 'none', cursor: 'pointer', fontSize: '13px',
                                    fontFamily: 'Comfortaa, sans-serif',
                                }}
                            >
                                Welcome In
                            </button>
                            <button
                                onClick={async () => {
                                    const { error } = await supabase
                                        .from('connections')
                                        .update({ status: 'declined', updated_at: new Date().toISOString() })
                                        .eq('id', req.id);

                                    if (!error) {
                                        setPendingRequests(prev => prev.filter(r => r.id !== req.id));
                                    }
                                }}
                                style={{
                                    backgroundColor: 'transparent', color: '#6B7280',
                                    padding: '8px 20px', borderRadius: '8px', fontWeight: 600,
                                    border: '1.5px solid #D1D5DB', cursor: 'pointer', fontSize: '13px',
                                    fontFamily: 'Comfortaa, sans-serif',
                                }}
                            >
                                Skip
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
