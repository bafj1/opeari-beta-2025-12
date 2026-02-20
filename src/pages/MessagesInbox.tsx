import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useViewer } from '../hooks/useViewer';
import MessageModal from '../components/Dashboard/NorthStar/MessageModal';

interface ConversationPreview {
    id: string;
    otherMemberId: string;
    otherName: string;
    otherAvatar: string | null;
    lastMessage: string;
    updatedAt: string;
    unreadCount: number;
}

export default function MessagesInbox() {
    const [conversations, setConversations] = useState<ConversationPreview[]>([]);
    const [loading, setLoading] = useState(true);
    const [authUserId, setAuthUserId] = useState<string | null>(null);
    const [searchParams] = useSearchParams();

    // Modal State
    const [messageOpen, setMessageOpen] = useState(false);
    const [messageRecipientId, setMessageRecipientId] = useState<string | null>(null);
    const [messageRecipientName, setMessageRecipientName] = useState('');

    const { viewer } = useViewer();
    const effectiveUserId = viewer?.member?.id ?? authUserId;

    // Fetch Auth User
    useEffect(() => {
        (async () => {
            const { data } = await supabase.auth.getUser();
            setAuthUserId(data.user?.id ?? null);
        })();
    }, []);

    const fetchInboxData = async () => {
        if (!effectiveUserId) return;
        setLoading(true);

        try {
            // 1) Fetch conversations
            const { data: convs, error: convError } = await supabase
                .from('conversations')
                .select('id, participant_1, participant_2, updated_at')
                .or(`participant_1.eq.${effectiveUserId},participant_2.eq.${effectiveUserId}`)
                .order('updated_at', { ascending: false });

            if (convError || !convs) {
                console.error('Failed to fetch conversations:', convError);
                return;
            }

            if (convs.length === 0) {
                setConversations([]);
                setLoading(false);
                return;
            }

            const convIds = convs.map(c => c.id);

            // 2) Collect all other member IDs and fetch their live data
            const otherIds = convs.map(c =>
                c.participant_1 === effectiveUserId ? c.participant_2 : c.participant_1
            );
            const uniqueOtherIds = [...new Set(otherIds)];

            const { data: memberData } = await supabase
                .from('members')
                .select('id, first_name, last_name, avatar_url')
                .in('id', uniqueOtherIds);

            const memberMap: Record<string, { name: string; avatar: string | null }> = {};
            (memberData || []).forEach(m => {
                const name = `${m.first_name || ''} ${(m.last_name || '').charAt(0)}.`.trim();
                memberMap[m.id] = { name: name || 'Unknown Member', avatar: m.avatar_url };
            });

            // 3) Fetch last messages
            const { data: messages } = await supabase
                .from('messages')
                .select('id, conversation_id, sender_id, content, created_at')
                .in('conversation_id', convIds)
                .order('created_at', { ascending: false });

            const lastMessageMap: Record<string, any> = {};
            messages?.forEach(m => {
                if (!lastMessageMap[m.conversation_id]) {
                    lastMessageMap[m.conversation_id] = m;
                }
            });

            // 4) Fetch unread counts
            const { data: unreadRows } = await supabase
                .from('messages')
                .select('conversation_id')
                .in('conversation_id', convIds)
                .is('read_at', null)
                .neq('sender_id', effectiveUserId);

            const unreadCounts: Record<string, number> = {};
            unreadRows?.forEach(row => {
                unreadCounts[row.conversation_id] = (unreadCounts[row.conversation_id] || 0) + 1;
            });

            // 5) Assemble view model
            const inboxData: ConversationPreview[] = convs.map(c => {
                const otherId = c.participant_1 === effectiveUserId ? c.participant_2 : c.participant_1;
                const lastMsg = lastMessageMap[c.id];
                const info = memberMap[otherId] || { name: 'Unknown Member', avatar: null };

                return {
                    id: c.id,
                    otherMemberId: otherId,
                    otherName: info.name,
                    otherAvatar: info.avatar,
                    lastMessage: lastMsg?.content || 'No messages yet',
                    updatedAt: lastMsg?.created_at || c.updated_at,
                    unreadCount: unreadCounts[c.id] || 0
                };
            }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

            setConversations(inboxData);

        } catch (err) {
            console.error('Inbox error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInboxData();
    }, [effectiveUserId]);

    // Handle ?to= param — auto-open message modal for a specific member
    useEffect(() => {
        const sendTo = searchParams.get('to');
        if (sendTo && effectiveUserId) {
            // Fetch the member name, then open the modal
            (async () => {
                const { data: member } = await supabase
                    .from('members')
                    .select('first_name, last_name')
                    .eq('id', sendTo)
                    .maybeSingle();

                const name = member
                    ? `${member.first_name || ''} ${(member.last_name || '').charAt(0)}.`.trim()
                    : 'Member';
                setMessageRecipientId(sendTo);
                setMessageRecipientName(name);
                setMessageOpen(true);
            })();
        }
    }, [searchParams, effectiveUserId]);

    const handleOpenMessage = (recipientId: string, recipientName: string) => {
        setMessageRecipientId(recipientId);
        setMessageRecipientName(recipientName);
        setMessageOpen(true);
    };

    return (
        <div className="min-h-screen bg-[#d8f5e5] pb-20">
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-serif text-[#1e6b4e] mb-2">Messages</h1>
                    <p className="text-[#546E5C]">Your conversations</p>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-24 bg-white/50 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                ) : conversations.length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 text-center border border-[#8bd7c7]/30 shadow-sm">
                        <p className="text-gray-500 font-medium">No conversations yet.</p>
                        <p className="text-sm text-gray-400 mt-1">Connect with members in the Village to start chatting!</p>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {conversations.map(conv => {
                            const initial = conv.otherName?.charAt(0) || '?';
                            const date = new Date(conv.updatedAt);
                            const isToday = date.toDateString() === new Date().toDateString();
                            const timeStr = isToday
                                ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : date.toLocaleDateString();

                            return (
                                <button
                                    key={conv.id}
                                    onClick={() => handleOpenMessage(conv.otherMemberId, conv.otherName)}
                                    className="w-full bg-white hover:bg-white/80 active:scale-[0.99] transition-all rounded-2xl p-4 flex items-center gap-4 text-left border border-[#8bd7c7]/30 shadow-sm group"
                                >
                                    {/* Avatar */}
                                    <div className="relative">
                                        {conv.otherAvatar ? (
                                            <img
                                                src={conv.otherAvatar}
                                                alt={conv.otherName}
                                                className="w-12 h-12 rounded-full object-cover border border-gray-100"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-[#d8f5e5] flex items-center justify-center border border-gray-100">
                                                <span className="text-lg font-bold text-[#1e6b4e]">{initial}</span>
                                            </div>
                                        )}
                                        {conv.unreadCount > 0 && (
                                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
                                                <span className="text-[10px] font-bold text-white">
                                                    {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <h3 className={`font-bold text-lg truncate ${conv.unreadCount > 0 ? 'text-[#1e6b4e]' : 'text-gray-900'}`}>
                                                {conv.otherName}
                                            </h3>
                                            <span className={`text-xs whitespace-nowrap ${conv.unreadCount > 0 ? 'text-[#1e6b4e] font-bold' : 'text-gray-400'}`}>
                                                {timeStr}
                                            </span>
                                        </div>
                                        <p className={`text-sm truncate pr-4 ${conv.unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                                            {conv.lastMessage}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            <MessageModal
                open={messageOpen}
                onOpenChange={(open) => {
                    setMessageOpen(open);
                    if (!open) {
                        setMessageRecipientId(null);
                        setMessageRecipientName('');
                        fetchInboxData();
                    }
                }}
                recipientId={messageRecipientId}
                recipientName={messageRecipientName}
                currentUserId={effectiveUserId}
            />
        </div>
    );
}
