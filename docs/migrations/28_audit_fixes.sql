-- Migration 28: Full audit fixes — practical profile fields + missing columns
-- Run in Supabase SQL Editor BEFORE deploying frontend changes.

-- 1. Fix care_needs FK if missing
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'care_needs_member_id_fkey'
        AND table_name = 'care_needs'
    ) THEN
        ALTER TABLE care_needs
        ADD CONSTRAINT care_needs_member_id_fkey
        FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 2. Fix caregiver_profiles missing education column
ALTER TABLE caregiver_profiles ADD COLUMN IF NOT EXISTS education TEXT;

-- 3. Family household details (caregivers need to know this)
ALTER TABLE members ADD COLUMN IF NOT EXISTS home_type TEXT; -- house, apartment, condo, townhouse
ALTER TABLE members ADD COLUMN IF NOT EXISTS has_parking BOOLEAN DEFAULT NULL;
ALTER TABLE members ADD COLUMN IF NOT EXISTS has_stairs BOOLEAN DEFAULT NULL;
ALTER TABLE members ADD COLUMN IF NOT EXISTS budget_min INTEGER DEFAULT NULL; -- $/hr
ALTER TABLE members ADD COLUMN IF NOT EXISTS budget_max INTEGER DEFAULT NULL; -- $/hr

-- 4. Caregiver physical capabilities (families need to know this)
ALTER TABLE members ADD COLUMN IF NOT EXISTS can_lift_30lbs BOOLEAN DEFAULT NULL;
ALTER TABLE members ADD COLUMN IF NOT EXISTS comfortable_with_stairs BOOLEAN DEFAULT NULL;

-- 5. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- Verify new columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'members'
AND column_name IN (
    'home_type', 'has_parking', 'has_stairs', 'budget_min', 'budget_max',
    'can_lift_30lbs', 'comfortable_with_stairs',
    'has_transportation', 'needs_caregiver_driver', 'max_travel_miles', 'overnight_available'
)
ORDER BY column_name;
