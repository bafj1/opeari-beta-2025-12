import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface Post {
    id: string;
    content: string;
    post_type: string;
}

interface EditPostModalProps {
    isOpen: boolean;
    post: Post;
    onClose: () => void;
    onSuccess: () => void;
}

export function EditPostModal({ isOpen, post, onClose, onSuccess }: EditPostModalProps) {
    const [content, setContent] = useState(post.content);
    const [postType] = useState(post.post_type || 'question');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!content.trim()) {
            setError('Please enter some content');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const { error: updateError } = await supabase
                .from('posts')
                .update({
                    content: content.trim(),
                    post_type: postType,
                    updated_at: new Date().toISOString()
                })
                .eq('id', post.id);

            if (updateError) throw updateError;

            onSuccess();
        } catch (err: any) {
            console.error('Error updating post:', err);
            setError(err.message || 'Failed to update post');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Comfortaa, cursive' }}>
                        Edit Post
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                    {/* Post Type Toggle - Removed per simplification */}

                    {/* Content Input */}
                    <div>
                        <label className="block text-sm font-medium text-[#1E6B4E] mb-1">
                            What's on your mind?
                        </label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E6B4E]/20 focus:border-[#1E6B4E] resize-none"
                            placeholder="E.g. 'Has anyone used ABC Swim School for toddlers?' or 'Best pediatrician in Georgetown?'"
                        />
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-4 border-t border-gray-100">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !content.trim()}
                        className="flex-1 py-2.5 bg-[#1E6B4E] text-white rounded-xl font-medium hover:bg-[#1E6B4E]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            'Save Changes'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
