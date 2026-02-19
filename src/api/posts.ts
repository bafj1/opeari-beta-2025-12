import { supabase } from '../lib/supabase';

export interface Post {
    id: string;
    author_id: string;
    author_name: string;
    author_avatar: string | null;
    post_type: 'question' | 'care_need' | 'general';
    content: string;
    neighborhood: string | null;
    zip_code: string | null;
    created_at: string;
    // Optional location fields (if populated)
    lat: number | null;
    lng: number | null;
}

export async function getNearbyPosts(
    _userId: string,
    limit: number = 10
): Promise<Post[]> {
    // Fetch posts with author info via join
    // Order by most recent first
    const { data, error } = await supabase
        .from('posts')
        .select(`
      id,
      post_type,
      content,
      neighborhood,
      zip_code,
      lat,
      lng,
      created_at,
      author:members!posts_author_id_fkey (
        id,
        first_name,
        last_name,
        avatar_url
      )
    `)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching posts:', error);
        throw error;
    }

    // Transform the data to flatten author info
    return (data || []).map((post: any) => {
        // Handle potential array from join
        const author = Array.isArray(post.author) ? post.author[0] : post.author;
        return {
            id: post.id,
            author_id: author?.id || '',
            author_name: author
                ? `${author.first_name} ${author.last_name?.charAt(0) || ''}.`
                : 'Anonymous',
            author_avatar: author?.avatar_url || null,
            post_type: post.post_type || 'general',
            content: post.content,
            neighborhood: post.neighborhood,
            zip_code: post.zip_code,
            lat: post.lat,
            lng: post.lng,
            created_at: post.created_at,
        };
    });
}

export async function createPost(post: {
    author_id: string;
    post_type: 'question' | 'care_need' | 'general';
    content: string;
    neighborhood?: string;
    zip_code?: string;
}): Promise<Post> {
    const { data, error } = await supabase
        .from('posts')
        .insert({
            author_id: post.author_id,
            post_type: post.post_type,
            content: post.content,
            neighborhood: post.neighborhood,
            zip_code: post.zip_code,
        })
        .select(`
      id,
      post_type,
      content,
      neighborhood,
      zip_code,
      lat,
      lng,
      created_at,
      author:members!posts_author_id_fkey (
        id,
        first_name,
        last_name,
        avatar_url
      )
    `)
        .single();

    if (error) {
        console.error('Error creating post:', error);
        throw error;
    }

    // Handle potential array from join
    const author = Array.isArray(data.author) ? data.author[0] : data.author;

    return {
        id: data.id,
        author_id: author?.id || '',
        author_name: author
            ? `${author.first_name} ${author.last_name?.charAt(0) || ''}.`
            : 'Anonymous',
        author_avatar: author?.avatar_url || null,
        post_type: data.post_type || 'general',
        content: data.content,
        neighborhood: data.neighborhood,
        zip_code: data.zip_code,
        lat: data.lat,
        lng: data.lng,
        created_at: data.created_at,
    };
}
