-- Migration: 06_dashboard_v1_5_schema.sql
-- Description: Schema updates for Dashboard V1.5 (Care Needs, Posts Location, Match Logic)

-- ============================================================================
-- 1. CARE NEEDS (formerly care_requests)
-- ============================================================================

-- Rename table to match UI terminology
ALTER TABLE care_requests RENAME TO care_needs;

-- Add new columns for V1.5 dashboard features
ALTER TABLE care_needs 
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS also_open_to text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS duration_type text DEFAULT 'ongoing',
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS end_date date,
  ADD COLUMN IF NOT EXISTS start_time time,
  ADD COLUMN IF NOT EXISTS end_time time;

-- Add comments for clarity
COMMENT ON COLUMN care_needs.is_active IS 'Only one care need per user should be active at a time';
COMMENT ON COLUMN care_needs.also_open_to IS 'Secondary care types user would consider';
COMMENT ON COLUMN care_needs.duration_type IS 'ongoing or short-term';

-- Create index for active care needs lookup
CREATE INDEX IF NOT EXISTS idx_care_needs_member_active 
  ON care_needs(member_id, is_active) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_care_needs_care_type ON care_needs(care_type);

-- Trigger to maintain updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS care_needs_updated_at ON care_needs;
CREATE TRIGGER care_needs_updated_at
  BEFORE UPDATE ON care_needs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ============================================================================
-- 2. POSTS (Location Support)
-- ============================================================================

-- Add location fields
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS lat double precision,
  ADD COLUMN IF NOT EXISTS lng double precision,
  ADD COLUMN IF NOT EXISTS zip_code text;

-- Create indexes for location filtering
CREATE INDEX IF NOT EXISTS idx_posts_location ON posts(lat, lng);
CREATE INDEX IF NOT EXISTS idx_posts_zip ON posts(zip_code);
CREATE INDEX IF NOT EXISTS idx_posts_neighborhood ON posts(neighborhood);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC);


-- ============================================================================
-- 3. USER PREFERENCES (Optional but recommended)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id uuid PRIMARY KEY REFERENCES members(id) ON DELETE CASCADE,
  posts_radius_miles integer DEFAULT 5,
  notification_prefs jsonb DEFAULT '{}',
  theme text DEFAULT 'light',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own preferences" ON user_preferences;
CREATE POLICY "Users can read own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own preferences" ON user_preferences;
CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own preferences" ON user_preferences;
CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);


-- ============================================================================
-- 4. RLS POLICIES
-- ============================================================================

-- CARE NEEDS
ALTER TABLE care_needs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own care needs" ON care_needs;
CREATE POLICY "Users can read own care needs"
  ON care_needs FOR SELECT
  USING (auth.uid() = member_id);

DROP POLICY IF EXISTS "Users can create own care needs" ON care_needs;
CREATE POLICY "Users can create own care needs"
  ON care_needs FOR INSERT
  WITH CHECK (auth.uid() = member_id);

DROP POLICY IF EXISTS "Users can update own care needs" ON care_needs;
CREATE POLICY "Users can update own care needs"
  ON care_needs FOR UPDATE
  USING (auth.uid() = member_id);

DROP POLICY IF EXISTS "Users can delete own care needs" ON care_needs;
CREATE POLICY "Users can delete own care needs"
  ON care_needs FOR DELETE
  USING (auth.uid() = member_id);

-- Connected users policy
DROP POLICY IF EXISTS "Connected users can view care needs" ON care_needs;
CREATE POLICY "Connected users can view care needs"
  ON care_needs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM connections
      WHERE status = 'accepted'
      AND (
        (requester_id = auth.uid() AND recipient_id = member_id)
        OR (recipient_id = auth.uid() AND requester_id = member_id)
      )
    )
  );

-- POSTS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Posts are viewable by all authenticated users" ON posts;
CREATE POLICY "Posts are viewable by all authenticated users"
  ON posts FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can create own posts" ON posts;
CREATE POLICY "Users can create own posts"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can update own posts" ON posts;
CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE
  USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can delete own posts" ON posts;
CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE
  USING (auth.uid() = author_id);


-- ============================================================================
-- 5. MATCHING FUNCTION (RPC)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_top_matches(
  p_user_id uuid,
  p_match_filter text DEFAULT 'all',  -- 'all', 'caregivers', 'families'
  p_limit integer DEFAULT 10
)
RETURNS TABLE (
  member_id uuid,
  display_name text,
  role text,
  avatar_url text,
  match_score integer,
  distance_miles numeric,
  availability_days text[],
  care_types text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_active_care_need record;
  v_user_zip text;
BEGIN
  -- Get user's active care need
  SELECT * INTO v_active_care_need
  FROM care_needs
  WHERE member_id = p_user_id AND is_active = true
  LIMIT 1;
  
  -- Get user's location
  SELECT zip_code INTO v_user_zip
  FROM members
  WHERE id = p_user_id;

  -- Return matches
  RETURN QUERY
  SELECT 
    m.id as member_id,
    m.first_name || ' ' || LEFT(m.last_name, 1) || '.' as display_name,
    m.role,
    m.avatar_url,
    -- Calculate match score
    (
      CASE WHEN v_active_care_need IS NULL THEN 0 ELSE
        CASE WHEN m.care_types && ARRAY[v_active_care_need.care_type] THEN 50 ELSE 0 END +
        CASE WHEN m.care_types && v_active_care_need.also_open_to THEN 25 ELSE 0 END +
        CASE WHEN m.availability_days && v_active_care_need.days_needed THEN 25 ELSE 0 END
      END
    )::integer as match_score,
    0::numeric as distance_miles,  -- Placeholder
    m.availability_days,
    m.care_types
  FROM members m
  WHERE 
    m.id != p_user_id
    AND m.onboarding_complete = true
    AND m.privacy_appear_in_search = true
    -- Filter by user type
    AND (
      p_match_filter = 'all'
      OR (p_match_filter = 'caregivers' AND 'caregiver' = ANY(m.roles))
      OR (p_match_filter = 'families' AND 'family' = ANY(m.roles))
    )
    -- Must have some schedule overlap (only if active care need exists)
    AND (v_active_care_need IS NULL OR m.availability_days && v_active_care_need.days_needed)
  ORDER BY match_score DESC
  LIMIT p_limit;
END;
$$;
