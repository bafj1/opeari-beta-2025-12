-- FINAL CLEANUP & FIX SCRIPT
-- Run this in your Supabase SQL Editor (Production Project)

-- 1. FIX THE "ZERO COUNT" ISSUE
-- We need this secure function to count rows without exposing emails.
CREATE OR REPLACE FUNCTION get_waitlist_count()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT count(*)::integer FROM waitlist;
$$;
GRANT EXECUTE ON FUNCTION get_waitlist_count TO anon, authenticated, service_role;

-- 2. ALLOW DELETING THE OLD TABLE
-- First, remove the link (Foreign Key) from the 'members' table that is blocking deletion.
ALTER TABLE IF EXISTS members 
DROP CONSTRAINT IF EXISTS users_waitlist_entry_id_fkey;

-- 3. DELETE THE OLD TABLE
DROP TABLE IF EXISTS waitlist_entries;
