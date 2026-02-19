-- ============================================
-- MENTIONS TABLE
-- Tracks when users are mentioned in comments
-- ============================================
CREATE TABLE IF NOT EXISTS mentions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- The comment containing the mention
    comment_id uuid NOT NULL REFERENCES post_comments(id) ON DELETE CASCADE,
    
    -- The user who was mentioned
    mentioned_user_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    
    -- The user who made the mention (comment author)
    mentioner_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    
    -- The post this mention is on (for easy querying)
    post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    
    created_at timestamptz DEFAULT now(),
    
    -- Prevent duplicate mentions of same user in same comment
    UNIQUE(comment_id, mentioned_user_id)
);

CREATE INDEX IF NOT EXISTS idx_mentions_mentioned_user ON mentions(mentioned_user_id);
CREATE INDEX IF NOT EXISTS idx_mentions_comment ON mentions(comment_id);
CREATE INDEX IF NOT EXISTS idx_mentions_post ON mentions(post_id);

ALTER TABLE mentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view mentions" ON mentions FOR SELECT USING (true);
CREATE POLICY "Users can create mentions" ON mentions FOR INSERT WITH CHECK (mentioner_id = auth.uid());
CREATE POLICY "Users can delete own mentions" ON mentions FOR DELETE USING (mentioner_id = auth.uid());


-- ============================================
-- NOTIFICATIONS TABLE (for future use)
-- Stores notifications for users
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Who receives this notification
    user_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    
    -- Type of notification
    type text NOT NULL CHECK (type IN ('mention', 'like', 'comment', 'connection', 'care_need')),
    
    -- Title and body
    title text NOT NULL,
    body text,
    
    -- Related entities (nullable, depends on type)
    post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
    comment_id uuid REFERENCES post_comments(id) ON DELETE CASCADE,
    from_user_id uuid REFERENCES members(id) ON DELETE SET NULL,
    
    -- Status
    read boolean DEFAULT false,
    read_at timestamptz,
    
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, read) WHERE read = false;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());
-- Insert policy allows system/other users to create notifications for someone
CREATE POLICY "Anyone can create notifications" ON notifications FOR INSERT WITH CHECK (true);
