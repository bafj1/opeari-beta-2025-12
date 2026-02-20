-- Migration 32: Fix get_top_matches RPC — schedule overlap as scoring bonus, not hard filter
-- Run in Supabase SQL Editor
-- Date: 2026-02-20
--
-- Previously, the function had `AND m.availability_days && v_active_care_need.days_needed`
-- as a WHERE clause, which excluded anyone without schedule overlap (e.g. Carrie).
-- This version makes schedule overlap a SCORING BONUS instead, so ALL members appear.

CREATE OR REPLACE FUNCTION get_top_matches(
  p_user_id uuid,
  p_match_filter text DEFAULT 'all',
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
  v_user_role text;
BEGIN
  -- Get user's active care need (may be NULL)
  SELECT * INTO v_active_care_need
  FROM care_needs
  WHERE member_id = p_user_id AND is_active = true
  LIMIT 1;

  -- Get user's location and role
  SELECT zip_code, role INTO v_user_zip, v_user_role
  FROM members
  WHERE id = p_user_id;

  RETURN QUERY
  SELECT
    m.id as member_id,
    m.first_name || ' ' || LEFT(m.last_name, 1) || '.' as display_name,
    m.role,
    m.avatar_url,
    -- Calculate match score — schedule overlap is a BONUS, not a requirement
    (
      CASE
        WHEN v_active_care_need IS NULL THEN 25  -- Base score when no active care need
        WHEN m.care_types && ARRAY[v_active_care_need.care_type] THEN 50
        ELSE 0
      END +
      CASE
        WHEN v_active_care_need IS NULL THEN 0
        WHEN m.care_types && COALESCE(v_active_care_need.also_open_to, '{}') THEN 25
        ELSE 0
      END +
      CASE
        WHEN v_active_care_need IS NULL THEN 0
        WHEN m.availability_days && COALESCE(v_active_care_need.days_needed, '{}') THEN 25
        ELSE 0
      END +
      -- Bonus for same zip code
      CASE WHEN m.zip_code = v_user_zip THEN 10 ELSE 0 END +
      -- Bonus for complementary roles (parent sees caregivers higher, and vice versa)
      CASE
        WHEN v_user_role IN ('family', 'parent') AND m.role = 'caregiver' THEN 15
        WHEN v_user_role = 'caregiver' AND m.role IN ('family', 'parent') THEN 15
        ELSE 5
      END
    )::integer as match_score,
    0::numeric as distance_miles,
    m.availability_days,
    m.care_types
  FROM members m
  WHERE
    m.id != p_user_id
    AND m.onboarding_complete = true
    AND (m.privacy_appear_in_search IS NULL OR m.privacy_appear_in_search = true)
    -- Filter by user type tab
    AND (
      p_match_filter = 'all'
      OR (p_match_filter = 'caregivers' AND (m.role = 'caregiver' OR 'caregiver' = ANY(m.roles)))
      OR (p_match_filter = 'families' AND (m.role IN ('family', 'parent') OR 'family' = ANY(m.roles)))
    )
  ORDER BY match_score DESC, m.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
