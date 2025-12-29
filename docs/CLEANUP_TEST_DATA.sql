-- CLEANUP: Remove Test Data
-- Run this in the Supabase SQL Editor for your TESTING project: opeari-concept-testing-beta-2025-06-12

-- Deletes any entries with 'breada' or 'test' in the email
-- This resolves 409 Conflict errors so you can re-test the form
DELETE FROM waitlist 
WHERE email ILIKE '%breada%' 
   OR email ILIKE '%test%';

-- Verify cleanup
SELECT * FROM waitlist;
