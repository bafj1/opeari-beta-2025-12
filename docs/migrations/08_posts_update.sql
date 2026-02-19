-- Migration: 08_posts_update.sql
-- Description: Add post_type and neighborhood if missing

ALTER TABLE posts ADD COLUMN IF NOT EXISTS post_type text DEFAULT 'general';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS neighborhood text;

-- Add index for post_type if needed
CREATE INDEX IF NOT EXISTS idx_posts_type ON posts(post_type);
