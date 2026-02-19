-- Migration 27: Add practical matching fields
-- These affect day-to-day care logistics and matching scores.
-- Run in Supabase SQL Editor BEFORE deploying frontend changes.

-- Transportation: does this person have their own car?
ALTER TABLE members ADD COLUMN IF NOT EXISTS has_transportation BOOLEAN DEFAULT NULL;

-- For families: do you need your caregiver to drive?
ALTER TABLE members ADD COLUMN IF NOT EXISTS needs_caregiver_driver BOOLEAN DEFAULT false;

-- For caregivers: willing to travel how far? (in miles, null = no preference)
ALTER TABLE members ADD COLUMN IF NOT EXISTS max_travel_miles INTEGER DEFAULT NULL;

-- For caregivers: comfortable with overnight care?
ALTER TABLE members ADD COLUMN IF NOT EXISTS overnight_available BOOLEAN DEFAULT false;

-- Verify the columns were added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'members'
AND column_name IN ('has_transportation', 'needs_caregiver_driver', 'max_travel_miles', 'overnight_available')
ORDER BY column_name;
