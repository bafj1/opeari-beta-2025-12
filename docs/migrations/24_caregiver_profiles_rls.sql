-- Migration: 24_caregiver_profiles_rls.sql
-- Description: Enable RLS for caregiver_profiles to allow users to manage their own profile data

-- Enable RLS
ALTER TABLE caregiver_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
DROP POLICY IF EXISTS "Users can view own caregiver profile" ON caregiver_profiles;
CREATE POLICY "Users can view own caregiver profile"
    ON caregiver_profiles FOR SELECT
    USING (id = auth.uid());

-- Policy: Users can insert their own profile
DROP POLICY IF EXISTS "Users can insert own caregiver profile" ON caregiver_profiles;
CREATE POLICY "Users can insert own caregiver profile"
    ON caregiver_profiles FOR INSERT
    WITH CHECK (id = auth.uid());

-- Policy: Users can update their own profile
DROP POLICY IF EXISTS "Users can update own caregiver profile" ON caregiver_profiles;
CREATE POLICY "Users can update own caregiver profile"
    ON caregiver_profiles FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());
