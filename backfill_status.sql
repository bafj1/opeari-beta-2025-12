-- Backfill SQL for Data Consistency
-- Purpose: Ensure all legacy waitlist entries have a valid status.
-- Run this in Supabase SQL Editor.

UPDATE waitlist 
SET status = 'pending' 
WHERE status IS NULL;
