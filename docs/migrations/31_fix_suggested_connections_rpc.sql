-- Migration 31: Fix get_suggested_connections RPC (requestee_id → recipient_id)
-- Run in Supabase SQL Editor FIRST
-- Date: 2026-02-20

-- Fix get_suggested_connections: replace requestee_id with recipient_id
CREATE OR REPLACE FUNCTION get_suggested_connections(
  p_user_id uuid,
  p_limit integer DEFAULT 10
)
RETURNS TABLE (
  member_id uuid,
  display_name text,
  avatar_url text,
  neighborhood text,
  zip_code text,
  role text,
  mutual_connection_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id as member_id,
    m.first_name || ' ' || LEFT(m.last_name, 1) || '.' as display_name,
    m.avatar_url,
    m.neighborhood,
    m.zip_code,
    m.role,
    (
      SELECT COUNT(*)
      FROM connections c1
      JOIN connections c2 ON (
        (c1.requester_id = c2.requester_id OR c1.requester_id = c2.recipient_id OR
         c1.recipient_id = c2.requester_id OR c1.recipient_id = c2.recipient_id)
      )
      WHERE c1.status = 'accepted'
        AND c2.status = 'accepted'
        AND (c1.requester_id = p_user_id OR c1.recipient_id = p_user_id)
        AND (c2.requester_id = m.id OR c2.recipient_id = m.id)
        AND NOT (c1.requester_id = m.id OR c1.recipient_id = m.id)
    )::bigint as mutual_connection_count
  FROM members m
  WHERE 
    m.id != p_user_id
    AND NOT EXISTS (
      SELECT 1 FROM connections c
      WHERE c.status IN ('accepted', 'pending')
      AND (
        (c.requester_id = p_user_id AND c.recipient_id = m.id)
        OR (c.recipient_id = p_user_id AND c.requester_id = m.id)
      )
    )
    AND m.onboarding_complete = true
    AND (m.privacy_appear_in_search IS NULL OR m.privacy_appear_in_search = true)
  ORDER BY mutual_connection_count DESC, m.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
