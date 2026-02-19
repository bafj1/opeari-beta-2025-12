-- Migration 28: Fix caregiver profile errors + add practical matching fields
-- Run this in Supabase SQL Editor BEFORE deploying frontend changes

-- ============================================================
-- 1. Fix care_needs foreign key (PGRST200 error)
-- ============================================================

-- Check if FK exists first
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'care_needs' 
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%member_id%'
    ) THEN
        ALTER TABLE care_needs 
        ADD CONSTRAINT care_needs_member_id_fkey 
        FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;
    END IF;
END $$;

-- ============================================================
-- 2. Add education column to caregiver_profiles (PGRST204 error)
-- ============================================================

ALTER TABLE caregiver_profiles ADD COLUMN IF NOT EXISTS education TEXT;

-- ============================================================
-- 3. Family household details (caregivers need to know these)
-- ============================================================

ALTER TABLE members ADD COLUMN IF NOT EXISTS home_type TEXT; -- 'house', 'apartment', 'condo', 'townhouse'
ALTER TABLE members ADD COLUMN IF NOT EXISTS has_parking BOOLEAN DEFAULT NULL;
ALTER TABLE members ADD COLUMN IF NOT EXISTS has_stairs BOOLEAN DEFAULT NULL;
ALTER TABLE members ADD COLUMN IF NOT EXISTS budget_min INTEGER DEFAULT NULL;
ALTER TABLE members ADD COLUMN IF NOT EXISTS budget_max INTEGER DEFAULT NULL;

-- ============================================================
-- 4. Caregiver physical capabilities (families need to know)
-- ============================================================

ALTER TABLE members ADD COLUMN IF NOT EXISTS can_lift_30lbs BOOLEAN DEFAULT NULL;
ALTER TABLE members ADD COLUMN IF NOT EXISTS comfortable_with_stairs BOOLEAN DEFAULT NULL;

-- ============================================================
-- 5. Practical matching fields (from migration 27 if not run)
-- ============================================================

ALTER TABLE members ADD COLUMN IF NOT EXISTS has_transportation BOOLEAN DEFAULT NULL;
ALTER TABLE members ADD COLUMN IF NOT EXISTS needs_caregiver_driver BOOLEAN DEFAULT false;
ALTER TABLE members ADD COLUMN IF NOT EXISTS max_travel_miles INTEGER DEFAULT NULL;
ALTER TABLE members ADD COLUMN IF NOT EXISTS overnight_available BOOLEAN DEFAULT false;

-- ============================================================
-- 6. Reload PostgREST schema cache
-- ============================================================

NOTIFY pgrst, 'reload schema';

-- ============================================================
-- 7. Verify everything was added
-- ============================================================

SELECT 'members new columns:' AS check_type, column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'members' 
AND column_name IN (
    'home_type', 'has_parking', 'has_stairs', 'budget_min', 'budget_max',
    'can_lift_30lbs', 'comfortable_with_stairs',
    'has_transportation', 'needs_caregiver_driver', 'max_travel_miles', 'overnight_available'
)
UNION ALL
SELECT 'caregiver_profiles:' AS check_type, column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'caregiver_profiles' AND column_name = 'education'
ORDER BY check_type, column_name;
