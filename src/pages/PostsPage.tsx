import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Plus,
    Heart,
    MessageCircle,
    MoreVertical,
    Pencil,
    Trash2,
    Flag,
    X,
    Loader2,
    AlertTriangle,
    Check
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useViewer } from '../hooks/useViewer';
import { CreatePostModal } from '../components/Dashboard/NorthStar/CreatePostModal';
import { createNotification } from '../lib/notifications';

// ============================================
// TYPES
// ============================================
interface Author {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
}

interface Comment {
    id: string;
    post_id: string;
    author_id: string;
    content: string;
    created_at: string;
    parent_comment_id: string | null;
    author: Author;
    likes_count: number;
    user_has_liked: boolean;
    replies?: Comment[];
}

interface Post {
    id: string;
    author_id: string;
    content: string;
    post_type: string;
    created_at: string;
    author: Author;
    likes_count: number;
    user_has_liked: boolean;
    comments: Comment[];
    comments_count: number;
}

interface MentionUser {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
}



// ============================================
// COMPONENT
// ============================================
export default function PostsPage() {
    const navigate = useNavigate();
    const { viewer } = useViewer();

    // Core state
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Edit/Delete state
    const [editingPost, setEditingPost] = useState<Post | null>(null);
    useEffect(() => { if (editingPost) console.log(editingPost); }, [editingPost]);
    const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Comments state
    const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
    const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
    const [submittingComment, setSubmittingComment] = useState<string | null>(null);
    const [replyingTo, setReplyingTo] = useState<{ postId: string; comment: Comment } | null>(null);

    // Mentions state
    const [showMentionDropdown, setShowMentionDropdown] = useState<string | null>(null);
    const [mentionResults, setMentionResults] = useState<MentionUser[]>([]);
    const [mentionIndex, setMentionIndex] = useState(0);
    const mentionSearchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Report state
    const [reportingItem, setReportingItem] = useState<{ type: 'post' | 'comment'; id: string; postId?: string } | null>(null);
    const [reportReason, setReportReason] = useState('');
    const [reportDescription, setReportDescription] = useState('');
    const [isSubmittingReport, setIsSubmittingReport] = useState(false);
    const [reportSuccess, setReportSuccess] = useState(false);

    // ============================================
    // DATA FETCHING
    // ============================================
    const fetchPosts = useCallback(async () => {
        if (!viewer?.member?.id) return;

        setIsLoading(true);
        try {
            // Fetch posts
            const { data: postsData, error: postsError } = await supabase
                .from('posts')
                .select(`
          id,
          author_id,
          content,
          post_type,
          created_at,
          author:members!posts_author_id_fkey (
            first_name,
            last_name,
            avatar_url
          )
        `)
                .order('created_at', { ascending: false });

            if (postsError) throw postsError;

            const postIds = (postsData || []).map(p => p.id);
            if (postIds.length === 0) {
                setPosts([]);
                setIsLoading(false);
                return;
            }

            // Fetch post likes
            const { data: postLikesData } = await supabase
                .from('post_likes')
                .select('post_id')
                .in('post_id', postIds);

            const { data: userPostLikesData } = await supabase
                .from('post_likes')
                .select('post_id')
                .eq('user_id', viewer.member.id)
                .in('post_id', postIds);

            // Fetch comments with parent info
            const { data: commentsData } = await supabase
                .from('post_comments')
                .select(`
          id,
          post_id,
          author_id,
          content,
          created_at,
          parent_comment_id,
          author:members!post_comments_author_id_fkey (
            first_name,
            last_name,
            avatar_url
          )
        `)
                .in('post_id', postIds)
                .order('created_at', { ascending: true });

            const commentIds = (commentsData || []).map(c => c.id);

            // Fetch comment likes (only if there are comments)
            let commentLikesData: any[] = [];
            let userCommentLikesData: any[] = [];

            if (commentIds.length > 0) {
                const { data: clData } = await supabase
                    .from('comment_likes')
                    .select('comment_id')
                    .in('comment_id', commentIds);
                commentLikesData = clData || [];

                const { data: uclData } = await supabase
                    .from('comment_likes')
                    .select('comment_id')
                    .eq('user_id', viewer.member.id)
                    .in('comment_id', commentIds);
                userCommentLikesData = uclData || [];
            }

            // Process likes
            const postLikeCounts: Record<string, number> = {};
            (postLikesData || []).forEach(l => {
                postLikeCounts[l.post_id] = (postLikeCounts[l.post_id] || 0) + 1;
            });
            const userLikedPosts = new Set((userPostLikesData || []).map(l => l.post_id));

            const commentLikeCounts: Record<string, number> = {};
            commentLikesData.forEach(l => {
                commentLikeCounts[l.comment_id] = (commentLikeCounts[l.comment_id] || 0) + 1;
            });
            const userLikedComments = new Set(userCommentLikesData.map(l => l.comment_id));

            // Build comments with threading
            const commentsByPost: Record<string, Comment[]> = {};
            const commentsById: Record<string, Comment> = {};

            // First pass: create all comments
            (commentsData || []).forEach(c => {
                const comment: Comment = {
                    ...c,
                    author: Array.isArray(c.author) ? c.author[0] : c.author,
                    likes_count: commentLikeCounts[c.id] || 0,
                    user_has_liked: userLikedComments.has(c.id),
                    replies: []
                };
                commentsById[c.id] = comment;
            });

            // Second pass: build tree structure
            Object.values(commentsById).forEach(comment => {
                if (comment.parent_comment_id && commentsById[comment.parent_comment_id]) {
                    commentsById[comment.parent_comment_id].replies?.push(comment);
                } else {
                    if (!commentsByPost[comment.post_id]) {
                        commentsByPost[comment.post_id] = [];
                    }
                    commentsByPost[comment.post_id].push(comment);
                }
            });

            // Build final posts array
            const transformedPosts: Post[] = (postsData || []).map(post => {
                const comments = commentsByPost[post.id] || [];
                const totalComments = Object.values(commentsById).filter(c => c.post_id === post.id).length;

                return {
                    ...post,
                    author: Array.isArray(post.author) ? post.author[0] : post.author,
                    likes_count: postLikeCounts[post.id] || 0,
                    user_has_liked: userLikedPosts.has(post.id),
                    comments,
                    comments_count: totalComments
                };
            });

            setPosts(transformedPosts);
        } catch (err) {
            console.error('Error fetching posts:', err);
        } finally {
            setIsLoading(false);
        }
    }, [viewer?.member?.id]);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    // ============================================
    // HANDLERS
    // ============================================

    // Post like
    const handleLikePost = async (postId: string, currentlyLiked: boolean) => {
        if (!viewer?.member?.id) return;

        setPosts(posts.map(post => {
            if (post.id === postId) {
                return {
                    ...post,
                    user_has_liked: !currentlyLiked,
                    likes_count: currentlyLiked ? Math.max(0, post.likes_count - 1) : post.likes_count + 1
                };
            }
            return post;
        }));

        try {
            if (currentlyLiked) {
                await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', viewer.member.id);
            } else {
                await supabase.from('post_likes').insert({ post_id: postId, user_id: viewer.member.id });

                // Notify post author
                const post = posts.find(p => p.id === postId);
                if (post && post.author_id !== viewer.member.id) {
                    await createNotification({
                        userId: post.author_id,
                        type: 'like',
                        title: `${viewer.member.first_name} liked your post`,
                        body: post.content.slice(0, 50) + (post.content.length > 50 ? '...' : ''),
                        postId: postId,
                        fromUserId: viewer.member.id
                    });
                }
            }
        } catch (err) {
            console.error('Error toggling like:', err);
            fetchPosts();
        }
    };

    // Comment like
    const handleLikeComment = async (postId: string, commentId: string, currentlyLiked: boolean) => {
        if (!viewer?.member?.id) return;

        const updateCommentLike = (comments: Comment[]): Comment[] => {
            return comments.map(c => {
                if (c.id === commentId) {
                    return {
                        ...c,
                        user_has_liked: !currentlyLiked,
                        likes_count: currentlyLiked ? Math.max(0, c.likes_count - 1) : c.likes_count + 1
                    };
                }
                if (c.replies) {
                    return { ...c, replies: updateCommentLike(c.replies) };
                }
                return c;
            });
        };

        setPosts(posts.map(post => {
            if (post.id === postId) {
                return { ...post, comments: updateCommentLike(post.comments) };
            }
            return post;
        }));

        try {
            if (currentlyLiked) {
                await supabase.from('comment_likes').delete().eq('comment_id', commentId).eq('user_id', viewer.member.id);
            } else {
                await supabase.from('comment_likes').insert({ comment_id: commentId, user_id: viewer.member.id });
            }
        } catch (err) {
            console.error('Error toggling comment like:', err);
            fetchPosts();
        }
    };

    // Toggle comments
    const toggleComments = (postId: string) => {
        setExpandedComments(prev => {
            const newSet = new Set(prev);
            if (newSet.has(postId)) {
                newSet.delete(postId);
                setReplyingTo(null);
            } else {
                newSet.add(postId);
            }
            return newSet;
        });
    };

    // Comment input change with mention detection
    const handleCommentChange = (postId: string, value: string) => {
        setCommentInputs(prev => ({ ...prev, [postId]: value }));

        // Detect @ mention
        const lastAtIndex = value.lastIndexOf('@');
        if (lastAtIndex !== -1) {
            const afterAt = value.slice(lastAtIndex + 1);
            const hasSpace = afterAt.includes(' ');

            if (!hasSpace && afterAt.length > 0) {
                setShowMentionDropdown(postId);

                // Debounce search
                if (mentionSearchTimeout.current) {
                    clearTimeout(mentionSearchTimeout.current);
                }
                mentionSearchTimeout.current = setTimeout(() => {
                    searchMentions(afterAt);
                }, 200);
            } else {
                setShowMentionDropdown(null);
                setMentionResults([]);
            }
        } else {
            setShowMentionDropdown(null);
            setMentionResults([]);
        }
    };

    // Search for mentions
    const searchMentions = async (query: string) => {
        if (query.length < 1) {
            setMentionResults([]);
            return;
        }

        try {
            const { data } = await supabase
                .from('members')
                .select('id, first_name, last_name, avatar_url')
                .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
                .neq('id', viewer?.member?.id || '')
                .limit(5);

            setMentionResults(data || []);
            setMentionIndex(0);
        } catch (err) {
            console.error('Error searching mentions:', err);
        }
    };

    // Select mention
    const handleSelectMention = (postId: string, user: MentionUser) => {
        const current = commentInputs[postId] || '';
        const lastAtIndex = current.lastIndexOf('@');
        const newValue = current.slice(0, lastAtIndex) + `@${user.first_name} `;

        setCommentInputs(prev => ({ ...prev, [postId]: newValue }));
        setShowMentionDropdown(null);
        setMentionResults([]);
    };

    // Submit comment
    const handleSubmitComment = async (postId: string) => {
        const content = commentInputs[postId]?.trim();
        if (!content || !viewer?.member?.id) return;

        setSubmittingComment(postId);

        try {
            const insertData: any = {
                post_id: postId,
                author_id: viewer.member.id,
                content
            };

            // Add parent if replying
            if (replyingTo && replyingTo.postId === postId) {
                insertData.parent_comment_id = replyingTo.comment.id;
            }

            const { data: newComment, error } = await supabase.from('post_comments').insert(insertData).select().single();

            if (error) throw error;

            // Notify post author
            const post = posts.find(p => p.id === postId);
            if (post && post.author_id !== viewer.member.id) {
                await createNotification({
                    userId: post.author_id,
                    type: 'comment',
                    title: `${viewer.member.first_name} commented on your post`,
                    body: content.slice(0, 50) + (content.length > 50 ? '...' : ''),
                    postId: postId,
                    commentId: newComment?.id,
                    fromUserId: viewer.member.id
                });
            }

            // If this is a reply, also notify the parent comment author
            if (replyingTo && replyingTo.comment.author_id !== viewer.member.id) {
                await createNotification({
                    userId: replyingTo.comment.author_id,
                    type: 'reply',
                    title: `${viewer.member.first_name} replied to your comment`,
                    body: content.slice(0, 50) + (content.length > 50 ? '...' : ''),
                    postId: postId,
                    commentId: newComment?.id,
                    fromUserId: viewer.member.id
                });
            }

            // Handle @mentions in content
            const mentionPattern = /@(\w+)/g;
            const mentions = [...content.matchAll(mentionPattern)].map(m => m[1].toLowerCase());

            if (mentions.length > 0) {
                // Find mentioned users
                const { data: mentionedUsers } = await supabase
                    .from('members')
                    .select('id, first_name')
                    .or(mentions.map(name => `first_name.ilike.${name}`).join(','));

                // Notify each mentioned user
                for (const user of mentionedUsers || []) {
                    if (user.id !== viewer.member.id) {
                        await createNotification({
                            userId: user.id,
                            type: 'mention',
                            title: `${viewer.member.first_name} mentioned you in a comment`,
                            body: content.slice(0, 50) + (content.length > 50 ? '...' : ''),
                            postId: postId,
                            commentId: newComment?.id,
                            fromUserId: viewer.member.id
                        });
                    }
                }
            }

            // Clear and refresh
            setCommentInputs(prev => ({ ...prev, [postId]: '' }));
            setReplyingTo(null);
            await fetchPosts();

        } catch (err) {
            console.error('Error submitting comment:', err);
        } finally {
            setSubmittingComment(null);
        }
    };

    // Delete post
    const handleDeletePost = async (postId: string) => {
        setIsDeleting(true);
        try {
            await supabase.from('posts').delete().eq('id', postId).eq('author_id', viewer?.member?.id);
            setPosts(posts.filter(p => p.id !== postId));
            setDeletingPostId(null);
        } catch (err) {
            console.error('Error deleting post:', err);
        } finally {
            setIsDeleting(false);
        }
    };

    // Submit report
    const handleSubmitReport = async () => {
        if (!reportingItem || !reportReason || !viewer?.member?.id) return;

        setIsSubmittingReport(true);

        try {
            // Build report data
            const reportData: any = {
                reporter_id: viewer.member.id,
                reason: reportReason,
                description: reportDescription.trim() || null
            };

            // Add the reported item
            if (reportingItem.type === 'post') {
                reportData.post_id = reportingItem.id;

                // Find post to get author
                const post = posts.find(p => p.id === reportingItem.id);
                if (post) {
                    reportData.reported_user_id = post.author_id;
                }
            } else if (reportingItem.type === 'comment') {
                reportData.comment_id = reportingItem.id;
                // Note: You'd need to track comment author_id if you want to report the user too
            }

            // Save to database
            const { error, data } = await supabase.from('content_reports').insert(reportData).select().single();

            if (error) {
                if (error.code === '23505') {
                    alert('You have already reported this content.');
                    setReportingItem(null);
                    return;
                }
                throw error;
            }

            // Send email notification to admin
            try {
                await fetch('/api/notify-report', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        reportId: data?.id,
                        reason: reportReason,
                        description: reportDescription,
                        reporterName: viewer.member.first_name,
                        itemType: reportingItem.type
                    })
                });
            } catch (emailErr) {
                console.log('Email notification skipped (no endpoint configured)');
            }

            // Show success
            setReportSuccess(true);

            // Reset after delay
            setTimeout(() => {
                setReportingItem(null);
                setReportReason('');
                setReportDescription('');
                setReportSuccess(false);
            }, 2500);

        } catch (err) {
            console.error('Error submitting report:', err);
            alert('Failed to submit report. Please try again.');
        } finally {
            setIsSubmittingReport(false);
        }
    };

    // ============================================
    // HELPERS
    // ============================================
    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const renderMentions = (content: string) => {
        const parts = content.split(/(@\w+)/g);
        return parts.map((part, i) => {
            if (part.startsWith('@')) {
                return <span key={i} className="text-[#1E6B4E] font-medium">{part}</span>;
            }
            return part;
        });
    };

    const filteredPosts = searchQuery.trim()
        ? posts.filter(post => {
            const query = searchQuery.toLowerCase().trim();

            // Check post content
            if (post.content?.toLowerCase().includes(query)) {
                return true;
            }

            // Check author first name
            if (post.author?.first_name?.toLowerCase().includes(query)) {
                return true;
            }

            // Check author last name  
            if (post.author?.last_name?.toLowerCase().includes(query)) {
                return true;
            }

            return false;
        })
        : posts;

    // ============================================
    // RENDER COMMENT
    // ============================================
    const renderComment = (comment: Comment, postId: string, isReply = false) => (
        <div
            key={comment.id}
            className={`flex gap-2.5 ${isReply ? 'ml-8 mt-2' : ''}`}
            role="article"
            aria-label={`Comment by ${comment.author?.first_name}`}
        >
            <div
                className="w-7 h-7 rounded-full bg-gradient-to-br from-[#8bd7c7]/30 to-[#1E6B4E]/10 flex items-center justify-center flex-shrink-0"
                aria-hidden="true"
            >
                {comment.author?.avatar_url ? (
                    <img src={comment.author.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
                ) : (
                    <span className="text-[#1E6B4E] font-medium text-xs">
                        {comment.author?.first_name?.[0] || '?'}
                    </span>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm">
                    <span className="font-medium text-gray-900">
                        {comment.author?.first_name} {comment.author?.last_name?.[0]}.
                    </span>
                    {' '}
                    <span className="text-gray-700">{renderMentions(comment.content)}</span>
                </p>
                <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-400">{formatTimeAgo(comment.created_at)}</span>

                    {/* Like */}
                    <button
                        onClick={() => handleLikeComment(postId, comment.id, comment.user_has_liked)}
                        className={`flex items-center gap-1 text-xs transition-colors ${comment.user_has_liked ? 'text-[#E07A5F]' : 'text-gray-400 hover:text-[#E07A5F]'
                            }`}
                        aria-label={comment.user_has_liked ? 'Unlike comment' : 'Like comment'}
                        aria-pressed={comment.user_has_liked}
                    >
                        <Heart className={`w-3 h-3 ${comment.user_has_liked ? 'fill-[#E07A5F]' : ''}`} aria-hidden="true" />
                        {comment.likes_count > 0 && <span>{comment.likes_count}</span>}
                    </button>

                    {/* Reply - works for all comments */}
                    <button
                        onClick={() => {
                            // Find the top-level parent for this comment
                            const topLevelId = isReply ? (comment.parent_comment_id || comment.id) : comment.id;

                            // Toggle if already replying to this thread
                            if (replyingTo?.comment.id === topLevelId) {
                                setReplyingTo(null);
                                setCommentInputs(prev => ({ ...prev, [postId]: '' }));
                            } else {
                                // Set up reply with auto-tag
                                setReplyingTo({ postId, comment: { ...comment, id: topLevelId } as Comment });
                                setCommentInputs(prev => ({
                                    ...prev,
                                    [postId]: `@${comment.author?.first_name} `
                                }));
                            }
                        }}
                        className="text-xs text-gray-400 hover:text-[#1E6B4E] transition-colors"
                        aria-label={`Reply to ${comment.author?.first_name}`}
                    >
                        Reply
                    </button>

                    {/* Report */}
                    <button
                        onClick={() => setReportingItem({ type: 'comment', id: comment.id, postId })}
                        className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Report comment"
                    >
                        <Flag className="w-3 h-3" aria-hidden="true" />
                    </button>
                </div>

                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-2">
                        {comment.replies.map(reply => renderComment(reply, postId, true))}
                    </div>
                )}
            </div>
        </div>
    );

    // ============================================
    // RENDER
    // ============================================
    return (
        <div className="min-h-screen bg-[#fffaf5]">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
                <div className="max-w-3xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/village')}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            aria-label="Go back to Village"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600" aria-hidden="true" />
                        </button>
                        <h1 className="text-xl font-semibold text-[#1E6B4E]" style={{ fontFamily: 'Comfortaa, cursive' }}>
                            Village Board
                        </h1>
                    </div>
                </div>
            </header>

            {/* Main */}
            <main className="max-w-3xl mx-auto px-4 py-6" role="main">
                {/* Intro */}
                <div className="mb-6 text-center">
                    <p className="text-gray-600">Share moments, ask questions, swap tips — this is your neighborhood.</p>
                    <p className="text-sm text-gray-400 mt-1">
                        Looking for childcare?{' '}
                        <button
                            onClick={() => navigate('/village')}
                            className="text-[#1E6B4E] hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-[#1E6B4E]/20 rounded"
                        >
                            Create a Care Need
                        </button>
                        {' '}instead.
                    </p>
                </div>

                {/* Search & Create */}
                <div className="flex gap-3 mb-6">
                    <div className="flex-1 relative">
                        <label htmlFor="search-posts" className="sr-only">Search posts</label>
                        <input
                            id="search-posts"
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search posts..."
                            className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E6B4E]/20 focus:border-[#1E6B4E] bg-white"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
                                aria-label="Clear search"
                            >
                                <X className="w-4 h-4 text-gray-400" />
                            </button>
                        )}
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#1E6B4E] text-white rounded-xl hover:bg-[#1E6B4E]/90 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-[#1E6B4E] focus:ring-offset-2"
                        aria-label="Create a new post"
                    >
                        <Plus className="w-4 h-4" aria-hidden="true" />
                        <span>Create Post</span>
                    </button>
                </div>

                {/* Posts */}
                {isLoading ? (
                    <div className="space-y-4" aria-busy="true" aria-label="Loading posts">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white rounded-2xl p-5 animate-pulse">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-11 h-11 bg-gray-200 rounded-full" />
                                    <div className="space-y-2">
                                        <div className="h-4 w-24 bg-gray-200 rounded" />
                                        <div className="h-3 w-16 bg-gray-200 rounded" />
                                    </div>
                                </div>
                                <div className="h-16 bg-gray-200 rounded" />
                            </div>
                        ))}
                    </div>
                ) : filteredPosts.length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
                        <div className="w-16 h-16 bg-gradient-to-br from-[#8bd7c7]/30 to-[#1E6B4E]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <MessageCircle className="w-8 h-8 text-[#1E6B4E]" aria-hidden="true" />
                        </div>
                        <h2 className="text-lg font-medium text-gray-900 mb-2">
                            {searchQuery ? 'No posts found' : 'Start the conversation'}
                        </h2>
                        <p className="text-gray-500 mb-4">
                            {searchQuery ? 'Try a different search term' : 'Share a question, a win, or just say hi.'}
                        </p>
                        {!searchQuery && (
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="px-5 py-2.5 bg-[#1E6B4E] text-white rounded-xl hover:bg-[#1E6B4E]/90 transition-colors font-medium"
                            >
                                Share Something
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4" role="feed" aria-label="Community posts">
                        {filteredPosts.map(post => (
                            <article
                                key={post.id}
                                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                                aria-labelledby={`post-author-${post.id}`}
                            >
                                <div className="p-5">
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#8bd7c7]/40 to-[#1E6B4E]/20 flex items-center justify-center overflow-hidden">
                                                {post.author?.avatar_url ? (
                                                    <img src={post.author.avatar_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-[#1E6B4E] font-semibold text-lg">
                                                        {post.author?.first_name?.[0] || '?'}
                                                    </span>
                                                )}
                                            </div>
                                            <div>
                                                <p id={`post-author-${post.id}`} className="font-medium text-gray-900">
                                                    {post.author?.first_name} {post.author?.last_name?.[0]}.
                                                </p>
                                                <p className="text-sm text-gray-400">{formatTimeAgo(post.created_at)}</p>
                                            </div>
                                        </div>

                                        {/* Menu */}
                                        <div className="relative group">
                                            <button
                                                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                                                aria-label="Post options"
                                                aria-haspopup="true"
                                            >
                                                <MoreVertical className="w-4 h-4 text-gray-400" aria-hidden="true" />
                                            </button>
                                            <div
                                                className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-100 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 min-w-[140px]"
                                                role="menu"
                                            >
                                                {post.author_id === viewer?.member?.id && (
                                                    <>
                                                        <button
                                                            onClick={() => setEditingPost(post)}
                                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                                            role="menuitem"
                                                        >
                                                            <Pencil className="w-4 h-4" aria-hidden="true" />
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => setDeletingPostId(post.id)}
                                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                                            role="menuitem"
                                                        >
                                                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                                                            Delete
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    onClick={() => setReportingItem({ type: 'post', id: post.id })}
                                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                                    role="menuitem"
                                                >
                                                    <Flag className="w-4 h-4" aria-hidden="true" />
                                                    Report
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                                        {renderMentions(post.content)}
                                    </p>

                                    {/* Actions */}
                                    <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
                                        <button
                                            onClick={() => handleLikePost(post.id, post.user_has_liked)}
                                            className={`flex items-center gap-1.5 transition-colors text-sm ${post.user_has_liked ? 'text-[#E07A5F]' : 'text-gray-400 hover:text-[#E07A5F]'
                                                }`}
                                            aria-label={post.user_has_liked ? 'Unlike post' : 'Like post'}
                                            aria-pressed={post.user_has_liked}
                                        >
                                            <Heart className={`w-4 h-4 ${post.user_has_liked ? 'fill-[#E07A5F]' : ''}`} aria-hidden="true" />
                                            {post.likes_count > 0 && <span>{post.likes_count}</span>}
                                        </button>

                                        <button
                                            onClick={() => toggleComments(post.id)}
                                            className={`flex items-center gap-1.5 transition-colors text-sm ${expandedComments.has(post.id) ? 'text-[#1E6B4E]' : 'text-gray-400 hover:text-[#1E6B4E]'
                                                }`}
                                            aria-expanded={expandedComments.has(post.id)}
                                            aria-label={`${post.comments_count} comments. Click to ${expandedComments.has(post.id) ? 'hide' : 'show'} comments`}
                                        >
                                            <MessageCircle className="w-4 h-4" aria-hidden="true" />
                                        </button>
                                    </div>

                                    {/* View comments link */}
                                    {post.comments_count > 0 && !expandedComments.has(post.id) && (
                                        <button
                                            onClick={() => toggleComments(post.id)}
                                            className="text-gray-500 text-sm mt-2 hover:text-gray-700 transition-colors"
                                        >
                                            View {post.comments_count === 1 ? '1 comment' : `all ${post.comments_count} comments`}
                                        </button>
                                    )}
                                </div>

                                {/* Comments Section */}
                                {expandedComments.has(post.id) && (
                                    <div className="bg-gray-50/50 border-t border-gray-100">
                                        {post.comments.length > 0 && (
                                            <div className="px-5 py-3 space-y-3">
                                                {post.comments.map(comment => renderComment(comment, post.id))}
                                            </div>
                                        )}

                                        {/* Reply indicator */}
                                        {replyingTo && replyingTo.postId === post.id && (
                                            <div className="px-5 py-2 bg-[#1E6B4E]/5 flex items-center justify-between">
                                                <span className="text-sm text-gray-600">
                                                    Replying to <span className="font-medium">{replyingTo.comment.author?.first_name}</span>
                                                </span>
                                                <button
                                                    onClick={() => {
                                                        setReplyingTo(null);
                                                        setCommentInputs(prev => ({ ...prev, [post.id]: '' }));
                                                    }}
                                                    className="p-1 hover:bg-gray-200 rounded-full"
                                                    aria-label="Cancel reply"
                                                >
                                                    <X className="w-4 h-4 text-gray-500" aria-hidden="true" />
                                                </button>
                                            </div>
                                        )}

                                        {/* Comment Input */}
                                        <div className="px-5 py-3 border-t border-gray-100">
                                            <div className="flex gap-2.5 items-center relative">
                                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#8bd7c7]/40 to-[#1E6B4E]/20 flex items-center justify-center flex-shrink-0">
                                                    <span className="text-[#1E6B4E] font-medium text-xs">
                                                        {viewer?.member?.first_name?.[0] || '?'}
                                                    </span>
                                                </div>
                                                <div className="flex-1 relative">
                                                    <label htmlFor={`comment-input-${post.id}`} className="sr-only">
                                                        Add a comment
                                                    </label>
                                                    <input
                                                        id={`comment-input-${post.id}`}
                                                        type="text"
                                                        value={commentInputs[post.id] || ''}
                                                        onChange={(e) => handleCommentChange(post.id, e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (showMentionDropdown === post.id && mentionResults.length > 0) {
                                                                if (e.key === 'ArrowDown') {
                                                                    e.preventDefault();
                                                                    setMentionIndex(i => Math.min(i + 1, mentionResults.length - 1));
                                                                } else if (e.key === 'ArrowUp') {
                                                                    e.preventDefault();
                                                                    setMentionIndex(i => Math.max(i - 1, 0));
                                                                } else if (e.key === 'Enter') {
                                                                    e.preventDefault();
                                                                    handleSelectMention(post.id, mentionResults[mentionIndex]);
                                                                } else if (e.key === 'Escape') {
                                                                    setShowMentionDropdown(null);
                                                                }
                                                            } else if (e.key === 'Enter' && !e.shiftKey) {
                                                                e.preventDefault();
                                                                handleSubmitComment(post.id);
                                                            }
                                                        }}
                                                        placeholder="Add a comment... Use @ to mention"
                                                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#1E6B4E]/20 focus:border-[#1E6B4E]"
                                                    />

                                                    {/* Mention Dropdown */}
                                                    {showMentionDropdown === post.id && mentionResults.length > 0 && (
                                                        <div
                                                            className="absolute bottom-full left-0 mb-1 w-full bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 max-h-40 overflow-y-auto"
                                                            role="listbox"
                                                            aria-label="Mention suggestions"
                                                        >
                                                            {mentionResults.map((user, index) => (
                                                                <button
                                                                    key={user.id}
                                                                    onClick={() => handleSelectMention(post.id, user)}
                                                                    className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${index === mentionIndex ? 'bg-[#1E6B4E]/10' : 'hover:bg-gray-50'
                                                                        }`}
                                                                    role="option"
                                                                    aria-selected={index === mentionIndex}
                                                                >
                                                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#8bd7c7]/30 to-[#1E6B4E]/10 flex items-center justify-center">
                                                                        {user.avatar_url ? (
                                                                            <img src={user.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
                                                                        ) : (
                                                                            <span className="text-[#1E6B4E] font-medium text-xs">{user.first_name?.[0]}</span>
                                                                        )}
                                                                    </div>
                                                                    <span className="font-medium text-gray-900">
                                                                        {user.first_name} {user.last_name?.[0]}.
                                                                    </span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                {commentInputs[post.id]?.trim() && (
                                                    <button
                                                        onClick={() => handleSubmitComment(post.id)}
                                                        disabled={submittingComment === post.id}
                                                        className="text-[#1E6B4E] font-semibold text-sm hover:text-[#1E6B4E]/80 disabled:opacity-50 transition-colors"
                                                    >
                                                        {submittingComment === post.id ? '...' : 'Post'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </article>
                        ))}
                    </div>
                )}
            </main>

            {/* Create Post Modal */}
            {showCreateModal && (
                <CreatePostModal
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => {
                        setShowCreateModal(false);
                        fetchPosts();
                    }}
                />
            )}

            {/* Delete Confirmation */}
            {deletingPostId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="delete-title">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setDeletingPostId(null)} />
                    <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
                        <h3 id="delete-title" className="text-lg font-semibold text-gray-900 mb-2">Delete Post?</h3>
                        <p className="text-gray-600 mb-6">This cannot be undone.</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeletingPostId(null)}
                                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDeletePost(deletingPostId)}
                                disabled={isDeleting}
                                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-50"
                            >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Report Modal */}
            {reportingItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
                    <div className="absolute inset-0 bg-black/50" onClick={() => !isSubmittingReport && setReportingItem(null)} />

                    <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
                        {/* Header */}
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-[#E07A5F]" />
                                Report Content
                            </h3>
                            <button
                                onClick={() => setReportingItem(null)}
                                disabled={isSubmittingReport}
                                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {reportSuccess ? (
                            <div className="p-8 text-center">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Check className="w-8 h-8 text-green-600" />
                                </div>
                                <h4 className="text-lg font-medium text-gray-900 mb-2">Report Submitted</h4>
                                <p className="text-gray-600">Thank you for helping keep our community safe. We'll review this shortly.</p>
                            </div>
                        ) : (
                            <>
                                <div className="p-4 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-[#1E6B4E] mb-3">
                                            Why are you reporting this?
                                        </label>
                                        <div className="space-y-2">
                                            {[
                                                { value: 'spam', label: 'Spam or misleading' },
                                                { value: 'harassment', label: 'Harassment or bullying' },
                                                { value: 'inappropriate', label: 'Inappropriate content' },
                                                { value: 'misinformation', label: 'False information' },
                                                { value: 'solicitation', label: 'Unauthorized solicitation' },
                                                { value: 'other', label: 'Other' }
                                            ].map(option => (
                                                <label
                                                    key={option.value}
                                                    className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${reportReason === option.value
                                                        ? 'border-[#1E6B4E] bg-[#1E6B4E]/5'
                                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {/* Custom Radio Button */}
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${reportReason === option.value
                                                        ? 'border-[#1E6B4E]'
                                                        : 'border-gray-300'
                                                        }`}>
                                                        {reportReason === option.value && (
                                                            <div className="w-2.5 h-2.5 rounded-full bg-[#1E6B4E]" />
                                                        )}
                                                    </div>
                                                    <input
                                                        type="radio"
                                                        name="report-reason"
                                                        value={option.value}
                                                        checked={reportReason === option.value}
                                                        onChange={(e) => setReportReason(e.target.value)}
                                                        className="sr-only"
                                                    />
                                                    <span className="text-gray-700">{option.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {reportReason && (
                                        <div>
                                            <label htmlFor="report-description" className="block text-sm font-medium text-[#1E6B4E] mb-1">
                                                Additional details (optional)
                                            </label>
                                            <textarea
                                                id="report-description"
                                                value={reportDescription}
                                                onChange={(e) => setReportDescription(e.target.value)}
                                                rows={3}
                                                placeholder="Provide any additional context that might help us review this report..."
                                                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E6B4E]/20 focus:border-[#1E6B4E] resize-none"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 border-t border-gray-100">
                                    <button
                                        onClick={handleSubmitReport}
                                        disabled={!reportReason || isSubmittingReport}
                                        className="w-full py-3 bg-[#1E6B4E] text-white rounded-xl font-medium hover:bg-[#1E6B4E]/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                                    >
                                        {isSubmittingReport ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Submitting...
                                            </>
                                        ) : (
                                            'Submit Report'
                                        )}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
