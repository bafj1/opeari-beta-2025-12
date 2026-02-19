-- ============================================
-- POST LIKES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS post_likes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_post_likes_post ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user ON post_likes(user_id);

ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view likes" ON post_likes FOR SELECT USING (true);
CREATE POLICY "Users can like posts" ON post_likes FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can unlike posts" ON post_likes FOR DELETE USING (user_id = auth.uid());

-- ============================================
-- POST COMMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS post_comments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    author_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    content text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_post_comments_post ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_author ON post_comments(author_id);

ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comments" ON post_comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments" ON post_comments FOR INSERT WITH CHECK (author_id = auth.uid());
CREATE POLICY "Users can update own comments" ON post_comments FOR UPDATE USING (author_id = auth.uid());
CREATE POLICY "Users can delete own comments" ON post_comments FOR DELETE USING (author_id = auth.uid());
