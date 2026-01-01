-- STEP 1: DATABASE MIGRATION (SCHEMA)

-- MEMBERS: Add new columns if they do not exist
ALTER TABLE members
ADD COLUMN IF NOT EXISTS onboarding_complete boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS availability_days text[] NOT NULL DEFAULT '{}',
ADD COLUMN IF NOT EXISTS availability_blocks text[] NOT NULL DEFAULT '{}',
ADD COLUMN IF NOT EXISTS special_availability text[] NOT NULL DEFAULT '{}',
ADD COLUMN IF NOT EXISTS children_age_groups text[] NOT NULL DEFAULT '{}',
ADD COLUMN IF NOT EXISTS budget_tiers text[] NOT NULL DEFAULT '{}',
ADD COLUMN IF NOT EXISTS transportation_required boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS language_requirement text NOT NULL DEFAULT 'nice_to_have',
ADD COLUMN IF NOT EXISTS require_identity_verified boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS require_background_verified boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS languages text[] NOT NULL DEFAULT '{}',
ADD COLUMN IF NOT EXISTS availability_detail jsonb NOT NULL DEFAULT '{}'::jsonb;

-- CAREGIVER_PROFILES: Add new columns if they do not exist
ALTER TABLE caregiver_profiles
ADD COLUMN IF NOT EXISTS availability_days text[] NOT NULL DEFAULT '{}',
ADD COLUMN IF NOT EXISTS availability_blocks text[] NOT NULL DEFAULT '{}',
ADD COLUMN IF NOT EXISTS special_availability text[] NOT NULL DEFAULT '{}',
ADD COLUMN IF NOT EXISTS rate_tiers text[] NOT NULL DEFAULT '{}',
ADD COLUMN IF NOT EXISTS transportation text NOT NULL DEFAULT 'none',
ADD COLUMN IF NOT EXISTS languages text[] NOT NULL DEFAULT '{}';

-- MEMBERS: Create Indexes
CREATE INDEX IF NOT EXISTS idx_members_availability_days ON members USING gin (availability_days);
CREATE INDEX IF NOT EXISTS idx_members_availability_blocks ON members USING gin (availability_blocks);
CREATE INDEX IF NOT EXISTS idx_members_children_age_groups ON members USING gin (children_age_groups);
CREATE INDEX IF NOT EXISTS idx_members_budget_tiers ON members USING gin (budget_tiers);
CREATE INDEX IF NOT EXISTS idx_members_languages ON members USING gin (languages);
CREATE INDEX IF NOT EXISTS idx_members_care_types ON members USING gin (care_types);

-- CAREGIVER_PROFILES: Create Indexes
CREATE INDEX IF NOT EXISTS idx_caregiver_availability_days ON caregiver_profiles USING gin (availability_days);
CREATE INDEX IF NOT EXISTS idx_caregiver_availability_blocks ON caregiver_profiles USING gin (availability_blocks);
CREATE INDEX IF NOT EXISTS idx_caregiver_rate_tiers ON caregiver_profiles USING gin (rate_tiers);
CREATE INDEX IF NOT EXISTS idx_caregiver_languages ON caregiver_profiles USING gin (languages);


-- STEP 2: ROW LEVEL SECURITY (RLS)

-- Enable RLS
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE caregiver_profiles ENABLE ROW LEVEL SECURITY;

-- MEMBERS: Drop existing policies to prevent duplicates/errors
DROP POLICY IF EXISTS "Users can view own member row" ON members;
DROP POLICY IF EXISTS "Users can update own member row" ON members;
DROP POLICY IF EXISTS "Users can insert own member row" ON members;

-- MEMBERS: Create Policies
CREATE POLICY "Users can view own member row"
  ON members FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own member row"
  ON members FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own member row"
  ON members FOR INSERT
  WITH CHECK (auth.uid() = id);

-- CAREGIVER_PROFILES: Drop existing policies
DROP POLICY IF EXISTS "Users can view own caregiver profile" ON caregiver_profiles;
DROP POLICY IF EXISTS "Users can update own caregiver profile" ON caregiver_profiles;
DROP POLICY IF EXISTS "Users can insert own caregiver profile" ON caregiver_profiles;

-- CAREGIVER_PROFILES: Create Policies
CREATE POLICY "Users can view own caregiver profile"
  ON caregiver_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own caregiver profile"
  ON caregiver_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own caregiver profile"
  ON caregiver_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);
