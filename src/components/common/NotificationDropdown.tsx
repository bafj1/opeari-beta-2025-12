import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Bell, Users, MessageSquare, Heart, MapPin, X } from 'lucide-react';

interface Notification {
    id: string;
    type: string;
    title: string;
    body: string | null;
    read: boolean;
    link: string | null;
    from_user_id: string | null;
    created_at: string;
    // Joined from_user data
    from_user?: {
        first_name: string;
        avatar_url: string | null;
    };
}

const typeIcons: Record<string, any> = {
    connection_request: Users,
    connection_accepted: Users,
    message: MessageSquare,
    match: Heart,
    village_update: MapPin,
    mention: MessageSquare,
    comment: MessageSquare,
    like: Heart,
};

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function NotificationDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // Fetch unread count
    const fetchUnreadCount = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { count } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('read', false);

        setUnreadCount(count || 0);
    };

    // Fetch recent notifications
    const fetchNotifications = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20);

        if (!error && data) {
            setNotifications(data);
        }
        setLoading(false);
    };

    // Mark single notification as read
    const markAsRead = async (notifId: string) => {
        await supabase
            .from('notifications')
            .update({ read: true, read_at: new Date().toISOString() })
            .eq('id', notifId);

        setNotifications(prev =>
            prev.map(n => n.id === notifId ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    // Mark all as read
    const markAllAsRead = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase
            .from('notifications')
            .update({ read: true, read_at: new Date().toISOString() })
            .eq('user_id', user.id)
            .eq('read', false);

        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
    };

    // Handle notification click
    const handleClick = async (notif: Notification) => {
        if (!notif.read) {
            await markAsRead(notif.id);
        }
        setIsOpen(false);
        if (notif.link) {
            navigate(notif.link);
        }
    };

    // Initial fetch + real-time subscription
    useEffect(() => {
        fetchUnreadCount();

        const channel = supabase
            .channel('notifications-realtime')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'notifications' },
                () => {
                    fetchUnreadCount();
                    if (isOpen) fetchNotifications();
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [isOpen]);

    // Fetch notifications when dropdown opens
    useEffect(() => {
        if (isOpen) fetchNotifications();
    }, [isOpen]);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={dropdownRef} style={{ position: 'relative' }}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: 'relative',
                    padding: '8px',
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    border: '1px solid #f0f0f0',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background-color 0.2s',
                }}
            >
                <Bell size={22} color="#6B7280" />
                {unreadCount > 0 && (
                    <div style={{
                        position: 'absolute',
                        top: '-2px',
                        right: '-2px',
                        minWidth: '18px',
                        height: '18px',
                        borderRadius: '9px',
                        backgroundColor: '#E07A5F',
                        color: 'white',
                        fontSize: '11px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 4px',
                        border: '2px solid white',
                    }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </div>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '48px',
                    right: 0,
                    width: '380px',
                    maxHeight: '480px',
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                    border: '1px solid #f0f0f0',
                    overflow: 'hidden',
                    zIndex: 50,
                    fontFamily: 'Comfortaa, sans-serif',
                }}>
                    {/* Header */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '16px 20px',
                        borderBottom: '1px solid #f0f0f0',
                    }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1E6B4E', margin: 0 }}>
                            Notifications
                        </h3>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    style={{
                                        fontSize: '12px',
                                        color: '#1E6B4E',
                                        fontWeight: 600,
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                    }}
                                >
                                    Mark all read
                                </button>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}
                            >
                                <X size={16} color="#9CA3AF" />
                            </button>
                        </div>
                    </div>

                    {/* Notification List */}
                    <div style={{ overflowY: 'auto', maxHeight: '400px' }}>
                        {loading && notifications.length === 0 ? (
                            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9CA3AF', fontSize: '14px' }}>
                                Loading...
                            </div>
                        ) : notifications.length === 0 ? (
                            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                                <Bell size={32} color="#D1D5DB" style={{ margin: '0 auto 12px' }} />
                                <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>
                                    No notifications yet
                                </p>
                                <p style={{ color: '#9CA3AF', fontSize: '13px', margin: '4px 0 0' }}>
                                    We'll let you know when something happens
                                </p>
                            </div>
                        ) : (
                            notifications.map(notif => {
                                const IconComponent = typeIcons[notif.type] || Bell;
                                return (
                                    <div
                                        key={notif.id}
                                        onClick={() => handleClick(notif)}
                                        style={{
                                            display: 'flex',
                                            gap: '12px',
                                            padding: '14px 20px',
                                            cursor: notif.link ? 'pointer' : 'default',
                                            backgroundColor: notif.read ? 'transparent' : 'rgba(139,215,199,0.08)',
                                            borderBottom: '1px solid #f8f8f8',
                                            transition: 'background-color 0.15s',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = notif.read
                                                ? '#fafafa'
                                                : 'rgba(139,215,199,0.15)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = notif.read
                                                ? 'transparent'
                                                : 'rgba(139,215,199,0.08)';
                                        }}
                                    >
                                        {/* Icon */}
                                        <div style={{
                                            width: 36,
                                            height: 36,
                                            borderRadius: '50%',
                                            backgroundColor: notif.read ? '#f3f4f6' : 'rgba(139,215,199,0.2)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                        }}>
                                            <IconComponent size={16} color={notif.read ? '#9CA3AF' : '#1E6B4E'} />
                                        </div>

                                        {/* Content */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{
                                                fontSize: '14px',
                                                fontWeight: notif.read ? 400 : 600,
                                                color: notif.read ? '#6B7280' : '#1E6B4E',
                                                margin: 0,
                                                lineHeight: 1.4,
                                            }}>
                                                {notif.title}
                                            </p>
                                            {notif.body && (
                                                <p style={{
                                                    fontSize: '13px',
                                                    color: '#9CA3AF',
                                                    margin: '2px 0 0',
                                                    lineHeight: 1.3,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}>
                                                    {notif.body}
                                                </p>
                                            )}
                                            <p style={{
                                                fontSize: '12px',
                                                color: '#D1D5DB',
                                                margin: '4px 0 0',
                                            }}>
                                                {timeAgo(notif.created_at)}
                                            </p>
                                        </div>

                                        {/* Unread dot */}
                                        {!notif.read && (
                                            <div style={{
                                                width: 8,
                                                height: 8,
                                                borderRadius: '50%',
                                                backgroundColor: '#E07A5F',
                                                flexShrink: 0,
                                                marginTop: '6px',
                                            }} />
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div style={{
                            padding: '12px 20px',
                            borderTop: '1px solid #f0f0f0',
                            textAlign: 'center',
                        }}>
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    // Navigate to full notifications page if it exists
                                    window.location.href = '/settings?tab=notifications';
                                }}
                                style={{
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    color: '#1E6B4E',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                }}
                            >
                                Notification preferences
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
