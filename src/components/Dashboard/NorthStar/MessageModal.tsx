import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import { X, Send, Loader2 } from 'lucide-react';

interface MessageModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    recipientId: string | null;
    recipientName: string;
    currentUserId: string | null | undefined;
}

interface Message {
    id: string;
    content: string;
    sender_id: string;
    created_at: string;
}

export default function MessageModal({
    open,
    onOpenChange,
    recipientId,
    recipientName,
    currentUserId
}: MessageModalProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Find or create conversation when modal opens
    useEffect(() => {
        if (!open || !recipientId || !currentUserId) {
            setMessages([]);
            setConversationId(null);
            return;
        }

        async function findOrCreateConversation() {
            setLoading(true);

            try {
                // Try to find existing conversation
                // We need to check both directions (p1=me, p2=them OR p1=them, p2=me)
                const { data: existing } = await supabase
                    .from('conversations')
                    .select('id')
                    .or(`and(participant_1.eq.${currentUserId},participant_2.eq.${recipientId}),and(participant_1.eq.${recipientId},participant_2.eq.${currentUserId})`)
                    .single();

                if (existing) {
                    setConversationId(existing.id);
                    await loadMessages(existing.id);
                } else {
                    // Create new conversation
                    // For consistency, maybe order UUIDs? Or just rely on RLS allowing insertion if involved.
                    // Let's just insert with p1=me
                    const { data: newConvo, error } = await supabase
                        .from('conversations')
                        .insert({
                            participant_1: currentUserId,
                            participant_2: recipientId
                        })
                        .select('id')
                        .single();

                    if (error) throw error;
                    setConversationId(newConvo.id);
                    setMessages([]);
                }
            } catch (error) {
                console.error('Error with conversation:', error);
            } finally {
                setLoading(false);
            }
        }

        findOrCreateConversation();
    }, [open, recipientId, currentUserId]);

    // Load messages for a conversation
    async function loadMessages(convId: string) {
        const { data, error } = await supabase
            .from('messages')
            .select('id, content, sender_id, created_at')
            .eq('conversation_id', convId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error loading messages:', error);
            return;
        }

        setMessages(data || []);
    }

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Send message
    const handleSend = async () => {
        if (!newMessage.trim() || !conversationId || !currentUserId || sending) return;

        setSending(true);
        const messageContent = newMessage.trim();
        setNewMessage('');

        try {
            const { data, error } = await supabase
                .from('messages')
                .insert({
                    conversation_id: conversationId,
                    sender_id: currentUserId,
                    content: messageContent
                })
                .select('id, content, sender_id, created_at')
                .single();

            if (error) throw error;

            // Add to local state
            setMessages(prev => [...prev, data]);

            // Update conversation updated_at (handled by trigger ideally, but robust to do via client if needed - though trigger is better)
            /* 
            await supabase
                .from('conversations')
                .update({ updated_at: new Date().toISOString() })
                .eq('id', conversationId);
            */

        } catch (error) {
            console.error('Error sending message:', error);
            setNewMessage(messageContent); // Restore message on error
        } finally {
            setSending(false);
        }
    };

    // Handle Enter key
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (!open) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onOpenChange(false);
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleBackdropClick}
        >
            <div className="bg-white rounded-[20px] max-w-md w-full h-[500px] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div>
                        <h2 className="text-lg font-bold text-[#1e6b4e]">{recipientName}</h2>
                        <p className="text-xs text-[#546E5C]">
                            {loading ? 'Loading...' : 'Direct Message'}
                        </p>
                    </div>
                    <button
                        onClick={() => onOpenChange(false)}
                        className="text-[#546E5C] hover:text-[#1e6b4e] transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="w-6 h-6 text-[#1e6b4e] animate-spin" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-center">
                            <div>
                                <p className="text-[#546E5C] mb-1">No messages yet</p>
                                <p className="text-xs text-gray-400">
                                    Start the conversation with {recipientName}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {messages.map((message, index) => {
                                const isMe = message.sender_id === currentUserId;
                                const showDate = index === 0 ||
                                    formatDate(messages[index - 1].created_at) !== formatDate(message.created_at);

                                return (
                                    <div key={message.id}>
                                        {showDate && (
                                            <div className="text-center my-4">
                                                <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
                                                    {formatDate(message.created_at)}
                                                </span>
                                            </div>
                                        )}
                                        <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div
                                                className={`
                                                    max-w-[80%] px-4 py-2.5 rounded-[18px]
                                                    ${isMe
                                                        ? 'bg-[#1e6b4e] text-white rounded-br-[4px]'
                                                        : 'bg-gray-100 text-[#1e6b4e] rounded-bl-[4px]'
                                                    }
                                                `}
                                            >
                                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                                <p className={`text-[10px] mt-1 ${isMe ? 'text-white/70' : 'text-gray-400'}`}>
                                                    {formatTime(message.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-gray-100">
                    <div className="flex items-end gap-2">
                        <textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type a message..."
                            className="flex-1 px-4 py-2.5 rounded-[15px] border border-gray-200 focus:border-[#1e6b4e] focus:outline-none text-sm resize-none max-h-24"
                            rows={1}
                            disabled={loading || sending}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!newMessage.trim() || loading || sending}
                            className="p-2.5 rounded-full bg-[#1e6b4e] text-white hover:bg-[#155a3e] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {sending ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Send className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
