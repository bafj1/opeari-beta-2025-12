-- Update caregiver_profiles for V4 Logic
-- 1. Add secondary_roles array
ALTER TABLE caregiver_profiles 
ADD COLUMN IF NOT EXISTS secondary_roles TEXT[];

-- 2. Change certs from text[] to jsonb for verification status
-- First, we need to handle the conversion if data exists. 
-- Since this is beta/dev, we can drop and recreate or alter with cast.
-- But safest for "migration" style is to add new and deprecate old, or alter type using logic.
-- Given we are early, let's try to alter in place or adds a new column.

-- Option A: Drop old column if empty or don't care about data loss (easiest for beta)
-- ALTER TABLE caregiver_profiles DROP COLUMN certifications;
-- ALTER TABLE caregiver_profiles ADD COLUMN certifications JSONB DEFAULT '[]'::jsonb;

-- Option B: Alter with casting (better)
-- We'll assume current data is just an array of strings like ['cpr', 'first_aid']
-- We want to convert to [{'name': 'cpr', 'verified': false}, ...]

ALTER TABLE caregiver_profiles 
ALTER COLUMN certifications TYPE JSONB 
USING (
  SELECT jsonb_agg(jsonb_build_object('name', elem, 'verified', false))
  FROM unnest(certifications) AS elem
);

-- If certifications was null, it stays null. 
-- If it was empty array, it becomes empty json array (or null result of agg? check).
-- Actually jsonb_agg on empty set might be null.
-- Let's ensure default is empty array for new rows
ALTER TABLE caregiver_profiles
ALTER COLUMN certifications SET DEFAULT '[]'::jsonb;
