-- Migration 32: Fix get_top_matches RPC to include caregivers
-- Run in Supabase SQL Editor
-- Date: 2026-02-20
--
-- The get_top_matches function may be filtering out caregivers.
-- This version ensures ALL roles are included when p_match_filter = 'all'.

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
  match_score numeric,
  distance_miles numeric,
  availability_days text[],
  care_types text[],
  also_open_to text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id as member_id,
    m.first_name || ' ' || LEFT(m.last_name, 1) || '.' as display_name,
    m.role,
    m.avatar_url,
    -- Simple match score based on overlapping attributes
    (
      COALESCE(
        (SELECT COUNT(*) FROM unnest(m.availability_days) d1
         JOIN unnest((SELECT me.availability_days FROM members me WHERE me.id = p_user_id)) d2
         ON d1 = d2
        )::numeric * 20, 0
      ) +
      COALESCE(
        (SELECT COUNT(*) FROM unnest(m.care_types) ct1
         JOIN unnest((SELECT me.care_types FROM members me WHERE me.id = p_user_id)) ct2
         ON ct1 = ct2
        )::numeric * 15, 0
      ) +
      CASE WHEN m.neighborhood = (SELECT me.neighborhood FROM members me WHERE me.id = p_user_id)
           THEN 25 ELSE 0 END +
      CASE WHEN m.zip_code = (SELECT me.zip_code FROM members me WHERE me.id = p_user_id)
           THEN 10 ELSE 0 END +
      -- Base score so everyone gets shown
      10
    ) as match_score,
    0::numeric as distance_miles,
    m.availability_days,
    m.care_types,
    m.also_open_to
  FROM members m
  WHERE
    m.id != p_user_id
    AND m.onboarding_complete = true
    AND (m.privacy_appear_in_search IS NULL OR m.privacy_appear_in_search = true)
    -- Role filter
    AND (
      p_match_filter = 'all'
      OR (p_match_filter = 'caregivers' AND m.role = 'caregiver')
      OR (p_match_filter = 'families' AND m.role IN ('family', 'parent', 'both'))
    )
  ORDER BY match_score DESC, m.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
