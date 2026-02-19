import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useViewer } from '../hooks/useViewer';
import MessageModal from '../components/Dashboard/NorthStar/MessageModal';

// Temporary Mapping until Profiles are fully stored
const MEMBER_LABELS: Record<string, { name: string; photo: string }> = {
    '17b593bd-41ca-44d0-bb7c-3e4f98010e0a': {
        name: 'Carrie Giver-test',
        photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?fit=crop&w=256&q=80'
    },
    '3a092606-43cf-4b50-b5de-0a911f38e333': {
        name: 'Christian Jewett',
        photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?fit=crop&w=256&q=80'
    },
    '3467c628-ba75-4748-9579-fe20b1dc63c7': {
        name: 'Breada Farrell',
        photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?fit=crop&w=256&q=80'
    }
};

interface ConversationPreview {
    id: string;
    otherMemberId: string;
    lastMessage: string;
    updatedAt: string;
    unreadCount: number;
}

export default function MessagesInbox() {
    const [conversations, setConversations] = useState<ConversationPreview[]>([]);
    const [loading, setLoading] = useState(true);
    const [authUserId, setAuthUserId] = useState<string | null>(null);

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

            // 2) Fetch last messages (optimisation: normally distinct on, but let's grab all recent and filter in JS for now as prompt suggested)
            // Limit to e.g. last 50 messages total to avoid fetching everything
            // Actually prompt approach: "Fetch last messages for those conversations... in('conversation_id', convIds)... order created_at desc"
            // We'll fetch a chunk and map them. Using a reasonable limit or simplified approach.
            // PROMPT said: "Then in JS, pick the first message per conversation_id as the 'last'"
            const { data: messages } = await supabase
                .from('messages')
                .select('id, conversation_id, sender_id, content, created_at')
                .in('conversation_id', convIds)
                .order('created_at', { ascending: false });

            // Map: conversation_id -> last message
            const lastMessageMap: Record<string, any> = {};
            messages?.forEach(m => {
                if (!lastMessageMap[m.conversation_id]) {
                    lastMessageMap[m.conversation_id] = m;
                }
            });

            // 3) Fetch unread counts
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

            // 4) Assemble view model
            const inboxData: ConversationPreview[] = convs.map(c => {
                const otherId = c.participant_1 === effectiveUserId ? c.participant_2 : c.participant_1;
                const lastMsg = lastMessageMap[c.id];

                return {
                    id: c.id,
                    otherMemberId: otherId,
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

    const handleOpenMessage = (recipientId: string) => {
        const info = MEMBER_LABELS[recipientId] || { name: 'Unknown Member' };
        setMessageRecipientId(recipientId);
        setMessageRecipientName(info.name);
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
                            const info = MEMBER_LABELS[conv.otherMemberId] || {
                                name: 'Unknown Member',
                                photo: `https://ui-avatars.com/api/?name=${conv.otherMemberId}&background=random`
                            };

                            const date = new Date(conv.updatedAt);
                            const isToday = date.toDateString() === new Date().toDateString();
                            const timeStr = isToday
                                ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : date.toLocaleDateString();

                            return (
                                <button
                                    key={conv.id}
                                    onClick={() => handleOpenMessage(conv.otherMemberId)}
                                    className="w-full bg-white hover:bg-white/80 active:scale-[0.99] transition-all rounded-2xl p-4 flex items-center gap-4 text-left border border-[#8bd7c7]/30 shadow-sm group"
                                >
                                    {/* Avatar */}
                                    <div className="relative">
                                        <img
                                            src={info.photo}
                                            alt={info.name}
                                            className="w-12 h-12 rounded-full object-cover border border-gray-100"
                                        />
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
                                                {info.name}
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
                        // Refresh inbox when closing modal to update read status/last message
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
