import { useState, useEffect } from 'react';
import { Users, UserPlus, ArrowRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface VillageNetworkPanelProps {
    formData: any;
    setFormData: (data: any) => void;
    saving: boolean;
    onSave: (override?: any) => void;
}

export default function VillageNetworkPanel({ formData: _formData, setFormData: _setFormData, saving: _saving, onSave: _onSave }: VillageNetworkPanelProps) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [connectionCount, setConnectionCount] = useState(0);
    const [pendingCount, setPendingCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        loadStats();
    }, [user]);

    async function loadStats() {
        try {
            // Count accepted connections
            const { count: accepted } = await supabase
                .from('connections')
                .select('*', { count: 'exact', head: true })
                .or(`requester_id.eq.${user!.id},recipient_id.eq.${user!.id}`)
                .eq('status', 'accepted');

            // Count pending incoming
            const { count: pending } = await supabase
                .from('connections')
                .select('*', { count: 'exact', head: true })
                .eq('recipient_id', user!.id)
                .eq('status', 'pending');

            setConnectionCount(accepted || 0);
            setPendingCount(pending || 0);
        } catch (err) {
            console.error('Error loading village stats:', err);
        } finally {
            setLoading(false);
        }
    }

    const cardStyle = {
        padding: '24px',
        border: '2px solid rgba(139,215,199,0.3)',
        borderRadius: '20px',
        backgroundColor: 'white',
    };

    const statBoxStyle = {
        padding: '24px',
        backgroundColor: 'rgba(139,215,199,0.08)',
        borderRadius: '16px',
        border: '2px solid rgba(139,215,199,0.3)',
        textAlign: 'center' as const,
    };

    const linkButtonStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        width: '100%',
        padding: '14px',
        backgroundColor: '#1E6B4E',
        color: 'white',
        borderRadius: '50px',
        border: 'none',
        fontWeight: 600,
        fontSize: '15px',
        fontFamily: 'Comfortaa, sans-serif',
        cursor: 'pointer',
        transition: 'all 0.2s',
    };

    const secondaryButtonStyle = {
        ...linkButtonStyle,
        backgroundColor: 'transparent',
        color: '#1E6B4E',
        border: '2px solid rgba(139,215,199,0.5)',
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '32px', maxWidth: '720px' }}>

            {/* Village Overview */}
            <div style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Users size={20} color="#1E6B4E" />
                    <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1E6B4E', margin: 0 }}>Village & Network</h2>
                </div>
                <p style={{ fontSize: '13px', color: '#546E5C', margin: '0 0 20px' }}>
                    Your trusted network of families and caregivers
                </p>

                {loading ? (
                    <p style={{ fontSize: '14px', color: '#546E5C', fontStyle: 'italic' }}>Loading...</p>
                ) : (
                    <>
                        {/* Stats */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                            <Link to="/connections" style={{ ...statBoxStyle, textDecoration: 'none', cursor: 'pointer', transition: 'all 0.2s' }}>
                                <p style={{ fontSize: '32px', fontWeight: 700, color: '#1E6B4E', margin: 0 }}>
                                    {connectionCount}
                                </p>
                                <p style={{ fontSize: '12px', color: '#546E5C', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Connections
                                </p>
                            </Link>
                            <Link to="/connections" style={{ ...statBoxStyle, textDecoration: 'none', cursor: 'pointer', transition: 'all 0.2s' }}>
                                <p style={{ fontSize: '32px', fontWeight: 700, color: pendingCount > 0 ? '#E07A5F' : '#1E6B4E', margin: 0 }}>
                                    {pendingCount}
                                </p>
                                <p style={{ fontSize: '12px', color: '#546E5C', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Pending Requests
                                </p>
                            </Link>
                        </div>

                        {/* CTA Buttons */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <button
                                onClick={() => navigate('/connections')}
                                style={linkButtonStyle}
                            >
                                <Users size={18} />
                                View Connections
                                <ArrowRight size={16} />
                            </button>

                            {pendingCount > 0 && (
                                <button
                                    onClick={() => navigate('/connections')}
                                    style={secondaryButtonStyle}
                                >
                                    {pendingCount} pending request{pendingCount !== 1 ? 's' : ''} to review
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Invite Section */}
            <div style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <UserPlus size={20} color="#1E6B4E" />
                    <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1E6B4E', margin: 0 }}>Grow Your Village</h2>
                </div>
                <p style={{ fontSize: '13px', color: '#546E5C', margin: '0 0 20px' }}>
                    The best villages are built on existing trust. Invite families you already know.
                </p>

                <button
                    onClick={() => navigate('/invite')}
                    style={linkButtonStyle}
                >
                    <UserPlus size={18} />
                    Invite a Family
                    <ArrowRight size={16} />
                </button>
            </div>
        </div>
    );
}
