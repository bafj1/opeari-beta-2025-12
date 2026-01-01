-- MIGRATION: CAREGIVER DATA MODEL EXTENSIONS

-- 1. Add new columns to caregiver_profiles to support Onboarding Step 2 & 3
ALTER TABLE caregiver_profiles
ADD COLUMN IF NOT EXISTS role_type text,                      -- Primary role (nanny, babysitter, etc)
ADD COLUMN IF NOT EXISTS secondary_roles text[] DEFAULT '{}', -- Secondary roles
ADD COLUMN IF NOT EXISTS years_experience text,               -- Range string (e.g. '5-10')
ADD COLUMN IF NOT EXISTS hourly_rate integer,                 -- Hourly rate in full currency units (e.g. 25) or cents? UI helper says "$25", so typically stored as integer. We will store as integer (dollars).
ADD COLUMN IF NOT EXISTS logistics text[] DEFAULT '{}',       -- Array of chip IDs (stairs, hills, etc)
ADD COLUMN IF NOT EXISTS certifications jsonb DEFAULT '[]',   -- JSON array of cert objects
ADD COLUMN IF NOT EXISTS bio text,                            -- Professional bio (distinct from members.bio if needed, but often synced)
ADD COLUMN IF NOT EXISTS referrals jsonb DEFAULT '[]';        -- JSON array of referral objects

-- 2. Add Indexes for efficiently querying these fields
CREATE INDEX IF NOT EXISTS idx_caregiver_logistics ON caregiver_profiles USING gin (logistics);
CREATE INDEX IF NOT EXISTS idx_caregiver_secondary_roles ON caregiver_profiles USING gin (secondary_roles);
CREATE INDEX IF NOT EXISTS idx_caregiver_hourly_rate ON caregiver_profiles (hourly_rate);

-- 3. Update RLS (Policies should already exist from previous migration, but verifying update policy)
-- Ensure caregivers can update these specific columns.
-- (Existing "Users can update own caregiver profile" policy covers all columns, so no new policy needed if that one is broadly defined as ON caregiver_profiles FOR UPDATE)

-- 4. ALIGNMENT: Enforce link to members table (Canonical Identity)
-- This treats user_id semantically as member_id by enforcing the FK relationship.
ALTER TABLE caregiver_profiles
DROP CONSTRAINT IF EXISTS fk_caregiver_member;

ALTER TABLE caregiver_profiles
ADD CONSTRAINT fk_caregiver_member
FOREIGN KEY (user_id) REFERENCES members(id);

