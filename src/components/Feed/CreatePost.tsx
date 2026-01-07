import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { PostType } from '../../types/FeedTypes';
import { POST_TYPE_LABELS } from '../../types/FeedTypes';
import { useAuth } from '../../context/AuthContext';

interface CreatePostProps {
    onClose: () => void;
    onPostCreated: () => void;
    userNeighborhood: string;
}

export default function CreatePost({ onClose, onPostCreated, userNeighborhood }: CreatePostProps) {
    const { user } = useAuth();
    const [content, setContent] = useState('');
    const [type, setType] = useState<PostType>('question');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || !user) return;

        setSubmitting(true);
        try {
            const { error } = await supabase.from('posts').insert({
                author_id: user.id,
                content: content.trim(),
                type,
                neighborhood: userNeighborhood,
                context_type: 'family' // Defaulting to family context for now, ideally derived from role
            });

            if (error) throw error;
            onPostCreated();
            onClose();
        } catch (err) {
            console.error('Failed to post:', err);
            alert('Could not post. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-fade-in-up">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="font-bold text-lg text-[#1e6b4e]">New Post</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    {/* Type Selector */}
                    <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                        {(Object.keys(POST_TYPE_LABELS) as PostType[]).map((t) => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => setType(t)}
                                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors border ${type === t
                                    ? 'bg-[#1e6b4e] text-white border-[#1e6b4e]'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-[#1e6b4e]'
                                    }`}
                            >
                                {POST_TYPE_LABELS[t].label}
                            </button>
                        ))}
                    </div>

                    {/* Content Area */}
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="What's happening? Ask a question or share a win..."
                        className="w-full h-40 p-4 rounded-xl bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1e6b4e]/20 resize-none mb-6 text-lg placeholder:text-gray-400"
                        autoFocus
                    />

                    {/* Footer Actions */}
                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            disabled={!content.trim() || submitting}
                            className="bg-[#1e6b4e] text-white px-8 py-3 rounded-full font-bold shadow-md hover:bg-[#155d42] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {submitting ? 'Posting...' : 'Post'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
