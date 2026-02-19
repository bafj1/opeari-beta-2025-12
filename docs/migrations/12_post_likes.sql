-- Create post_likes table
CREATE TABLE IF NOT EXISTS post_likes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE(post_id, user_id)
);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_post_likes_post ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user ON post_likes(user_id);

-- Enable RLS
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

-- Users can view all likes
CREATE POLICY "Users can view likes"
    ON post_likes FOR SELECT
    USING (true);

-- Users can like posts
CREATE POLICY "Users can like posts"
    ON post_likes FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Users can unlike (delete own likes)
CREATE POLICY "Users can unlike posts"
    ON post_likes FOR DELETE
    USING (user_id = auth.uid());
