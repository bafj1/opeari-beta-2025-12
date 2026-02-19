-- ============================================
-- COMMENT LIKES TABLE (fixes 404 errors)
-- ============================================
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

DROP POLICY IF EXISTS "Users can view comment likes" ON comment_likes;
DROP POLICY IF EXISTS "Users can like comments" ON comment_likes;
DROP POLICY IF EXISTS "Users can unlike comments" ON comment_likes;

CREATE POLICY "Users can view comment likes" ON comment_likes FOR SELECT USING (true);
CREATE POLICY "Users can like comments" ON comment_likes FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can unlike comments" ON comment_likes FOR DELETE USING (user_id = auth.uid());

-- ============================================
-- ADD REPLY SUPPORT TO COMMENTS
-- ============================================
ALTER TABLE post_comments 
ADD COLUMN IF NOT EXISTS parent_comment_id uuid REFERENCES post_comments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_post_comments_parent ON post_comments(parent_comment_id);

-- ============================================
-- MENTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS mentions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id uuid NOT NULL REFERENCES post_comments(id) ON DELETE CASCADE,
    mentioned_user_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    mentioner_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE(comment_id, mentioned_user_id)
);

CREATE INDEX IF NOT EXISTS idx_mentions_mentioned_user ON mentions(mentioned_user_id);
CREATE INDEX IF NOT EXISTS idx_mentions_comment ON mentions(comment_id);

ALTER TABLE mentions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view mentions" ON mentions;
DROP POLICY IF EXISTS "Users can create mentions" ON mentions;

CREATE POLICY "Users can view mentions" ON mentions FOR SELECT USING (true);
CREATE POLICY "Users can create mentions" ON mentions FOR INSERT WITH CHECK (mentioner_id = auth.uid());

-- ============================================
-- REPORTS TABLE (for flagging content)
-- ============================================
CREATE TABLE IF NOT EXISTS content_reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Who reported
    reporter_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    
    -- What was reported (one of these will be set)
    post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
    comment_id uuid REFERENCES post_comments(id) ON DELETE CASCADE,
    reported_user_id uuid REFERENCES members(id) ON DELETE CASCADE,
    
    -- Report details
    reason text NOT NULL CHECK (reason IN (
        'spam',
        'harassment', 
        'inappropriate',
        'misinformation',
        'solicitation',
        'other'
    )),
    description text,
    
    -- Status tracking
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'action_taken', 'dismissed')),
    reviewed_at timestamptz,
    reviewed_by uuid REFERENCES members(id),
    action_taken text,
    
    created_at timestamptz DEFAULT now(),
    
    -- Prevent duplicate reports
    UNIQUE(reporter_id, post_id),
    UNIQUE(reporter_id, comment_id)
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON content_reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_post ON content_reports(post_id);
CREATE INDEX IF NOT EXISTS idx_reports_comment ON content_reports(comment_id);

ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reports" ON content_reports FOR SELECT USING (reporter_id = auth.uid());
CREATE POLICY "Users can create reports" ON content_reports FOR INSERT WITH CHECK (reporter_id = auth.uid());

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('mention', 'like', 'comment', 'reply', 'connection', 'care_need', 'report_resolved')),
    title text NOT NULL,
    body text,
    post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
    comment_id uuid REFERENCES post_comments(id) ON DELETE CASCADE,
    from_user_id uuid REFERENCES members(id) ON DELETE SET NULL,
    read boolean DEFAULT false,
    read_at timestamptz,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, read) WHERE read = false;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Anyone can create notifications" ON notifications;

CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Anyone can create notifications" ON notifications FOR INSERT WITH CHECK (true);
