import { useState, useEffect } from 'react';
import { X, Loader2, Sparkles } from 'lucide-react';
import { useViewer } from '../../../hooks/useViewer';
import { createPost, type Post } from '../../../api/posts';

// Conversation starter prompts - rotate randomly
const conversationStarters = [
    "Anyone else's toddler refuse to wear shoes?",
    "Best rainy day activity for a 3-year-old?",
    "Finally got my kid to eat vegetables. Here's how...",
    "Favorite local playground?",
    "How do you handle screen time limits?",
    "Just survived a double ear infection. Send coffee.",
    "Park meetup this weekend?",
    "Pediatrician recommendations?",
];

interface CreatePostModalProps {
    onClose: () => void;
    onPostCreated?: (post: Post) => void;
    onSuccess?: () => void;
}

export function CreatePostModal({ onClose, onPostCreated, onSuccess }: CreatePostModalProps) {
    const { viewer } = useViewer();
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showCareNeedNudge, setShowCareNeedNudge] = useState(false);
    const [placeholder, setPlaceholder] = useState('');

    // Pick a random placeholder on mount
    useEffect(() => {
        const randomIndex = Math.floor(Math.random() * conversationStarters.length);
        setPlaceholder(conversationStarters[randomIndex]);
    }, []);

    // Detect care-seeking language
    useEffect(() => {
        const careKeywords = [
            'looking for a nanny',
            'need a babysitter',
            'need childcare',
            'looking for childcare',
            'need care for',
            'available to babysit',
            'offering childcare',
            'nanny available',
            'sitter needed',
            'backup care needed'
        ];

        const lowerContent = content.toLowerCase();
        const hasCareLanguage = careKeywords.some(keyword => lowerContent.includes(keyword));
        setShowCareNeedNudge(hasCareLanguage && content.length > 20);
    }, [content]);

    const handleSubmit = async () => {
        if (!content.trim() || !viewer?.member?.id) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const newPost = await createPost({
                author_id: viewer.member.id,
                post_type: 'question', // Default to generic type
                content: content.trim(),
                neighborhood: viewer.member.neighborhood || undefined,
                zip_code: viewer.member.zip_code || undefined,
            });

            onPostCreated?.(newPost);
            onSuccess?.();
            onClose();
        } catch (err: any) {
            console.error('Error creating post:', err);
            setError(err.message || 'Failed to create post');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGoToCareNeeds = () => {
        onClose();
        // Navigate to care needs - adjust path as needed
        window.location.href = '/village';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Comfortaa, cursive' }}>
                        Share with your village
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4">
                    {/* Textarea */}
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E6B4E]/20 focus:border-[#1E6B4E] resize-none text-gray-800"
                        placeholder={placeholder}
                    />

                    {/* Spark inspiration button */}
                    <button
                        onClick={() => {
                            const randomIndex = Math.floor(Math.random() * conversationStarters.length);
                            setPlaceholder(conversationStarters[randomIndex]);
                        }}
                        className="flex items-center gap-1.5 mt-2 text-sm text-gray-400 hover:text-[#1E6B4E] transition-colors"
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Spark an idea</span>
                    </button>

                    {/* Care Need Nudge - soft, non-blocking */}
                    {showCareNeedNudge && (
                        <div className="mt-4 p-3 bg-[#8bd7c7]/10 border border-[#8bd7c7]/30 rounded-xl">
                            <p className="text-sm text-gray-700">
                                Sounds like you might be looking for care?
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                                Our{' '}
                                <button
                                    onClick={handleGoToCareNeeds}
                                    className="text-[#1E6B4E] font-medium hover:underline"
                                >
                                    Care Needs
                                </button>
                                {' '}feature helps match you with trusted families and caregivers.
                            </p>
                            <p className="text-xs text-gray-400 mt-2">
                                Or keep writing — all posts are welcome here.
                            </p>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100">
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !content.trim()}
                        className="w-full py-3 bg-[#1E6B4E] text-white rounded-xl font-medium hover:bg-[#1E6B4E]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Posting...
                            </>
                        ) : (
                            'Post to Village'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
