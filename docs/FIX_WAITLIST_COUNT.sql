-- FIX: Secure Waitlist Count
-- Run this in Supabase SQL Editor to allow the "Queue Position" to work
-- without exposing anyone's email address.

CREATE OR REPLACE FUNCTION get_waitlist_count()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER -- Runs with admin privileges to count all rows
AS $$
  SELECT count(*)::integer FROM waitlist;
$$;

-- Grant access to public users (anon) so the form can show the number
GRANT EXECUTE ON FUNCTION get_waitlist_count TO anon, authenticated, service_role;
