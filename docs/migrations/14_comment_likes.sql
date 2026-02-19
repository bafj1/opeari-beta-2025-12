-- COMMENT LIKES TABLE
CREATE TABLE IF NOT EXISTS comment_likes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id uuid NOT NULL REFERENCES post_comments(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE(comment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_comment_likes_comment ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user ON comment_likes(user_id);

ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comment likes" ON comment_likes FOR SELECT USING (true);
CREATE POLICY "Users can like comments" ON comment_likes FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can unlike comments" ON comment_likes FOR DELETE USING (user_id = auth.uid());
