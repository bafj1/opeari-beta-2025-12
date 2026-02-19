-- Migration: 17_simplify_statuses.sql
-- Description: Simplify care_needs statuses to 3 values: 'open', 'covered', 'closed'

-- 1. Drop existing check constraint
ALTER TABLE care_needs DROP CONSTRAINT IF EXISTS care_requests_status_check;

-- 2. Update existing data to map to new statuses
UPDATE care_needs SET status = 'open' WHERE status IN ('seeking', 'active', 'matched');
UPDATE care_needs SET status = 'closed' WHERE status IN ('cancelled', 'completed', 'past');
UPDATE care_needs SET status = 'covered' WHERE status = 'confirmed';

-- Handle any other values by defaulting to 'open' if not 'covered' or 'closed'
UPDATE care_needs SET status = 'open' WHERE status NOT IN ('open', 'covered', 'closed');

-- 3. Add new check constraint
ALTER TABLE care_needs ADD CONSTRAINT care_requests_status_check 
CHECK (status IN ('open', 'covered', 'closed'));
