import { useState } from 'react';
import { MessageCircle, MoreHorizontal, Flag } from 'lucide-react';
import type { Post } from '../../types/FeedTypes';
import { POST_TYPE_LABELS } from '../../types/FeedTypes';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface PostCardProps {
    post: Post;
}

export default function PostCard({ post }: PostCardProps) {
    const { user } = useAuth();
    const typeInfo = POST_TYPE_LABELS[post.type];
    const authorInitial = post.author?.first_name?.[0] || '?';
    const timeAgo = post.created_at ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true }) : 'just now';

    // Reporting State
    const [showMenu, setShowMenu] = useState(false);
    const [reporting, setReporting] = useState(false);
    const [reported, setReported] = useState(false);

    const handleReport = async () => {
        if (!user || reporting) return;
        setReporting(true);
        try {
            const { error } = await supabase
                .from('post_reports')
                .insert({
                    post_id: post.id,
                    reporter_id: user.id,
                    reason: 'user_flagged'
                });

            if (error) throw error;
            setReported(true);
            setShowMenu(false);
        } catch (err) {
            console.error('Report error:', err);
        } finally {
            setReporting(false);
        }
    };

    return (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative">
            {/* Header: Author & Metadata */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-[#1e6b4e]/10 text-[#1e6b4e] flex items-center justify-center font-bold text-lg">
                        {authorInitial}
                    </div>

                    {/* Name & Role */}
                    <div>
                        <h3 className="font-bold text-gray-800 text-sm">
                            {post.author?.first_name || 'Neighbor'}
                            {post.author?.neighborhood && (
                                <span className="text-gray-400 font-normal ml-1">• {post.author.neighborhood}</span>
                            )}
                        </h3>
                        <p className="text-xs text-gray-400">{timeAgo}</p>
                    </div>
                </div>

                {/* Actions / Menu */}
                <div className="flex items-center gap-2">
                    {/* Type Badge */}
                    <span className="px-2 py-1 rounded-md bg-gray-50 text-gray-500 text-xs font-medium border border-gray-100">
                        {typeInfo.label}
                    </span>

                    {/* Menu Button */}
                    <div className="relative">
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                            className="p-1 text-gray-300 hover:text-gray-500 rounded-full hover:bg-gray-50 transition-colors"
                        >
                            <MoreHorizontal size={18} />
                        </button>

                        {showMenu && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                                <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20">
                                    <button
                                        onClick={handleReport}
                                        disabled={reported}
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 disabled:opacity-50"
                                    >
                                        <Flag size={14} />
                                        {reported ? 'Reported' : 'Report'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="mb-4">
                <p className="text-gray-700 leading-relaxed text-[15px] whitespace-pre-wrap">
                    {post.content}
                </p>
            </div>

            {/* Footer / Actions */}
            <div className="flex items-center gap-6 pt-3 border-t border-gray-50">
                <button className="flex items-center gap-1.5 text-gray-400 hover:text-[#1e6b4e] transition-colors text-sm font-medium">
                    <MessageCircle size={16} />
                    <span>Respond</span>
                </button>
                {/* Save button suppressed for V1 Trust Focus */}
            </div>
        </div>
    );
}
