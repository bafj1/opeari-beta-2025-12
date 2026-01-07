import { MessageCircle, Heart } from 'lucide-react';
import type { Post } from '../../types/FeedTypes';
import { POST_TYPE_LABELS } from '../../types/FeedTypes';
import { formatDistanceToNow } from 'date-fns';

interface PostCardProps {
    post: Post;
}

export default function PostCard({ post }: PostCardProps) {
    const typeInfo = POST_TYPE_LABELS[post.type];
    const authorInitial = post.author?.first_name?.[0] || '?';
    const timeAgo = post.created_at ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true }) : 'just now';

    return (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
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

                {/* Type Badge */}
                <span className="px-2 py-1 rounded-md bg-gray-50 text-gray-500 text-xs font-medium border border-gray-100">
                    {typeInfo.label}
                </span>
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
                <button className="flex items-center gap-1.5 text-gray-400 hover:text-pink-500 transition-colors text-sm font-medium">
                    <Heart size={16} />
                    <span>Save</span>
                </button>
            </div>
        </div>
    );
}
