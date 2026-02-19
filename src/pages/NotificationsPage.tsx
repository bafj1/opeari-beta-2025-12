import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Bell,
    Heart,
    MessageCircle,
    Users,
    AtSign,
    Calendar,
    CheckCheck,
    Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useViewer } from '../hooks/useViewer';

// ============================================
// TYPES
// ============================================
interface Notification {
    id: string;
    user_id: string;
    type: string;
    title: string;
    body: string | null;
    post_id: string | null;
    comment_id: string | null;
    from_user_id: string | null;
    care_need_id: string | null;
    link: string | null;
    read: boolean;
    read_at: string | null;
    created_at: string;
    from_user?: {
        first_name: string;
        last_name: string;
        avatar_url: string | null;
    };
}

// ============================================
// NOTIFICATION ICON HELPER
// ============================================
const getNotificationIcon = (type: string) => {
    switch (type) {
        case 'like':
            return <Heart className="w-5 h-5 text-[#E07A5F]" />;
        case 'comment':
        case 'reply':
            return <MessageCircle className="w-5 h-5 text-[#1E6B4E]" />;
        case 'mention':
            return <AtSign className="w-5 h-5 text-[#8bd7c7]" />;
        case 'connection_request':
        case 'connection_accepted':
            return <Users className="w-5 h-5 text-[#1E6B4E]" />;
        case 'care_need':
        case 'match':
            return <Calendar className="w-5 h-5 text-[#E07A5F]" />;
        case 'message':
            return <MessageCircle className="w-5 h-5 text-[#1E6B4E]" />;
        case 'village_update':
            return <Bell className="w-5 h-5 text-[#E07A5F]" />;
        default:
            return <Bell className="w-5 h-5 text-gray-500" />;
    }
};

// ============================================
// COMPONENT
// ============================================
export default function NotificationsPage() {
    const navigate = useNavigate();
    const { viewer } = useViewer();

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');
    const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);

    // ============================================
    // FETCH NOTIFICATIONS
    // ============================================
    const fetchNotifications = useCallback(async () => {
        if (!viewer?.member?.id) return;

        setIsLoading(true);
        try {
            let query = supabase
                .from('notifications')
                .select(`
          *,
          from_user:members!notifications_from_user_id_fkey (
            first_name,
            last_name,
            avatar_url
          )
        `)
                .eq('user_id', viewer.member.id)
                .order('created_at', { ascending: false })
                .limit(50);

            if (filter === 'unread') {
                query = query.eq('read', false);
            }

            const { data, error } = await query;

            if (error) throw error;

            const transformed = (data || []).map(n => ({
                ...n,
                from_user: Array.isArray(n.from_user) ? n.from_user[0] : n.from_user
            }));

            setNotifications(transformed);
        } catch (err) {
            console.error('Error fetching notifications:', err);
        } finally {
            setIsLoading(false);
        }
    }, [viewer?.member?.id, filter]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // ============================================
    // HANDLERS
    // ============================================
    const handleMarkAsRead = async (notificationId: string) => {
        try {
            await supabase
                .from('notifications')
                .update({ read: true, read_at: new Date().toISOString() })
                .eq('id', notificationId)
                .eq('user_id', viewer?.member?.id);

            setNotifications(notifications.map(n =>
                n.id === notificationId ? { ...n, read: true, read_at: new Date().toISOString() } : n
            ));
        } catch (err) {
            console.error('Error marking notification as read:', err);
        }
    };

    const handleMarkAllAsRead = async () => {
        setIsMarkingAllRead(true);
        try {
            await supabase
                .from('notifications')
                .update({ read: true, read_at: new Date().toISOString() })
                .eq('user_id', viewer?.member?.id)
                .eq('read', false);

            setNotifications(notifications.map(n => ({ ...n, read: true })));
        } catch (err) {
            console.error('Error marking all as read:', err);
        } finally {
            setIsMarkingAllRead(false);
        }
    };

    const handleDelete = async (notificationId: string) => {
        try {
            await supabase
                .from('notifications')
                .delete()
                .eq('id', notificationId)
                .eq('user_id', viewer?.member?.id);

            setNotifications(notifications.filter(n => n.id !== notificationId));
        } catch (err) {
            console.error('Error deleting notification:', err);
        }
    };

    const handleNotificationClick = async (notification: Notification) => {
        // Mark as read
        if (!notification.read) {
            handleMarkAsRead(notification.id);
        }

        // Navigate based on link or type fallback
        if (notification.link) {
            navigate(notification.link);
            return;
        }

        switch (notification.type) {
            case 'like':
            case 'comment':
            case 'reply':
            case 'mention':
                if (notification.post_id) {
                    navigate('/posts');
                }
                break;
            case 'connection_request':
            case 'connection_accepted':
                navigate('/connections');
                break;
            case 'care_need':
            case 'match':
            case 'village_update':
                navigate('/village');
                break;
            case 'message':
                navigate('/messages');
                break;
            default:
                break;
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    // ============================================
    // RENDER
    // ============================================
    return (
        <div className="min-h-screen bg-[#fffaf5]">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
                <div className="max-w-3xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate(-1)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                aria-label="Go back"
                            >
                                <ArrowLeft className="w-5 h-5 text-gray-600" />
                            </button>
                            <div>
                                <h1 className="text-xl font-semibold text-[#1E6B4E]" style={{ fontFamily: 'Comfortaa, cursive' }}>
                                    Notifications
                                </h1>
                                {unreadCount > 0 && (
                                    <p className="text-sm text-gray-500">{unreadCount} unread</p>
                                )}
                            </div>
                        </div>

                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                disabled={isMarkingAllRead}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm text-[#1E6B4E] hover:bg-[#1E6B4E]/10 rounded-lg transition-colors disabled:opacity-50"
                            >
                                {isMarkingAllRead ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <CheckCheck className="w-4 h-4" />
                                )}
                                Mark all read
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Filters */}
            <div className="max-w-3xl mx-auto px-4 py-4">
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filter === 'all'
                            ? 'bg-[#1E6B4E] text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                            }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter('unread')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filter === 'unread'
                            ? 'bg-[#1E6B4E] text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                            }`}
                    >
                        Unread {unreadCount > 0 && `(${unreadCount})`}
                    </button>
                </div>
            </div>

            {/* Notifications List */}
            <main className="max-w-3xl mx-auto px-4 pb-8">
                {isLoading ? (
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                                <div className="flex gap-3">
                                    <div className="w-10 h-10 bg-gray-200 rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
                        <div className="w-16 h-16 bg-gradient-to-br from-[#8bd7c7]/30 to-[#1E6B4E]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Bell className="w-8 h-8 text-[#1E6B4E]" />
                        </div>
                        <h2 className="text-lg font-medium text-gray-900 mb-2">
                            {filter === 'unread' ? 'All caught up!' : 'No notifications yet'}
                        </h2>
                        <p className="text-gray-500">
                            {filter === 'unread'
                                ? "You've read all your notifications."
                                : "When you get likes, comments, or connection requests, they'll appear here."}
                        </p>
                        {filter === 'unread' && (
                            <button
                                onClick={() => setFilter('all')}
                                className="mt-4 text-[#1E6B4E] font-medium hover:underline"
                            >
                                View all notifications
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {notifications.map(notification => (
                            <div
                                key={notification.id}
                                className={`bg-white rounded-xl border transition-all ${notification.read
                                    ? 'border-gray-100'
                                    : 'border-[#1E6B4E]/20 bg-[#1E6B4E]/5'
                                    }`}
                            >
                                <button
                                    onClick={() => handleNotificationClick(notification)}
                                    className="w-full p-4 text-left flex gap-3 hover:bg-gray-50/50 rounded-xl transition-colors"
                                >
                                    {/* Icon or Avatar */}
                                    <div className="flex-shrink-0">
                                        {notification.from_user ? (
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8bd7c7]/40 to-[#1E6B4E]/20 flex items-center justify-center overflow-hidden">
                                                {notification.from_user.avatar_url ? (
                                                    <img
                                                        src={notification.from_user.avatar_url}
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-[#1E6B4E] font-semibold">
                                                        {notification.from_user.first_name?.[0] || '?'}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                                {getNotificationIcon(notification.type)}
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm ${notification.read ? 'text-gray-700' : 'text-gray-900 font-medium'}`}>
                                            {notification.title}
                                        </p>
                                        {notification.body && (
                                            <p className="text-sm text-gray-500 truncate mt-0.5">
                                                {notification.body}
                                            </p>
                                        )}
                                        <p className="text-xs text-gray-400 mt-1">
                                            {formatTimeAgo(notification.created_at)}
                                        </p>
                                    </div>

                                    {/* Unread indicator */}
                                    {!notification.read && (
                                        <div className="flex-shrink-0 self-center">
                                            <div className="w-2 h-2 rounded-full bg-[#1E6B4E]" />
                                        </div>
                                    )}
                                </button>

                                {/* Actions */}
                                <div className="px-4 pb-3 flex gap-2 justify-end border-t border-gray-50 pt-2">
                                    {!notification.read && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleMarkAsRead(notification.id);
                                            }}
                                            className="text-xs text-gray-500 hover:text-[#1E6B4E] transition-colors"
                                        >
                                            Mark as read
                                        </button>
                                    )}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(notification.id);
                                        }}
                                        className="text-xs text-gray-500 hover:text-red-500 transition-colors"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
