import { useState, useEffect } from 'react';

import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import type { Post, PostType } from '../../types/FeedTypes';
import VillageHeader from '../../components/Village/VillageHeader';
import PostCard from '../../components/Village/PostCard';
import CreatePost from '../../components/Village/CreatePost';
import Header from '../../components/common/Header';
import VillagePulse from '../../components/Village/VillagePulse';
import VillageFilter from '../../components/Village/VillageFilter';

export default function VillageHome() {
    const { user } = useAuth();

    // State
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [userNeighborhood, setUserNeighborhood] = useState<string>('');
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [filter, setFilter] = useState<PostType | 'all'>('all');

    // 1. Get User Neighborhood
    useEffect(() => {
        if (!user) return;

        async function getNeighborhood() {
            const { data } = await supabase
                .from('members_preview')
                .select('neighborhood')
                .eq('id', user!.id) // Non-null assertion safe due to guard
                .single();

            if (data?.neighborhood) {
                setUserNeighborhood(data.neighborhood);
            }
        }
        getNeighborhood();
    }, [user]);

    // 2. Fetch Posts (Scoped to Neighborhood)
    useEffect(() => {
        async function fetchPosts() {
            setLoading(true);
            try {
                // Fetch posts via authorized view
                const { data: postsData, error } = await supabase
                    .from('posts_with_author')
                    .select('*')
                    .eq('neighborhood', userNeighborhood)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                // Server filtered via RLS + Query.
                setPosts(postsData as unknown as Post[]);

            } catch (err) {
                console.error('Village fetch error:', err);
            } finally {
                setLoading(false);
            }
        }

        if (userNeighborhood) {
            fetchPosts();
        } else if (user && !userNeighborhood) {
            setLoading(false);
        }
    }, [userNeighborhood, refreshTrigger, user]);

    const handlePostCreated = () => {
        setRefreshTrigger(p => p + 1);
    };

    // Client-side filtering for V1 responsiveness
    const filteredPosts = filter === 'all'
        ? posts
        : posts.filter(p => p.type === filter);

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[#faf8f5]">
            <Header />

            <main className="max-w-xl mx-auto px-4 py-8">
                <VillageHeader neighborhood={userNeighborhood} onCreateClick={() => setShowCreate(true)} />

                {/* Village Pulse Widget (Intel-Lite) */}
                <VillagePulse />

                {/* Filters */}
                <div className="mb-4">
                    <VillageFilter currentFilter={filter} onFilterChange={setFilter} />
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-40 bg-white rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : filteredPosts.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                        {/* Brand Rule: No Emojis. Use Styled Icon. */}
                        <div className="w-16 h-16 bg-[#d8f5e5] rounded-full flex items-center justify-center mx-auto mb-4 text-[#1e6b4e]">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M7 20h10" />
                                <path d="M10 20c5.5-2.5.8-6.4 3-10" />
                                <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.2.4-4.8-.4-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.9Z" />
                                <path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2Z" />
                            </svg>
                        </div>
                        <h3 className="font-bold text-gray-800 text-lg mb-2">
                            {filter === 'all' ? 'Be the first to post!' : `No ${filter} posts yet`}
                        </h3>
                        <p className="text-gray-500 max-w-xs mx-auto mb-6">
                            Start the conversation in {userNeighborhood || 'your neighborhood'}. Ask a question or share a win.
                        </p>
                        <button
                            onClick={() => setShowCreate(true)}
                            className="text-[#1e6b4e] font-bold hover:underline"
                        >
                            Create a Post
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {filteredPosts.map(post => (
                            <PostCard key={post.id} post={post} />
                        ))}
                    </div>
                )}
            </main>

            {showCreate && (
                <CreatePost
                    userNeighborhood={userNeighborhood}
                    onClose={() => setShowCreate(false)}
                    onPostCreated={() => {
                        handlePostCreated();
                        setShowCreate(false);
                    }}
                />
            )}
        </div>
    );
}
