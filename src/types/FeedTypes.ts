export type PostType = 'question' | 'availability' | 'win' | 'share' | 'community';
export type ContextType = 'family' | 'caregiver' | 'community';

export interface Post {
    id: string;
    author_id: string;
    type: PostType;
    content: string;
    context_type: ContextType;
    neighborhood: string;
    created_at: string;
    meta_data?: Record<string, any>;

    // Joined Author Data (Fetched via join or separate lookup)
    author?: {
        first_name: string;
        role: 'family' | 'caregiver';
        neighborhood?: string;
    };
}

export const POST_TYPE_LABELS: Record<PostType, { label: string; icon: string }> = {
    question: { label: 'Question', icon: 'params' }, // Icons to be mapped in UI
    availability: { label: 'Availability', icon: 'calendar' },
    win: { label: 'Win', icon: 'heart' },
    share: { label: 'Share', icon: 'share' },
    community: { label: 'Community', icon: 'users' }
};
