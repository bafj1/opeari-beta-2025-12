-- Migration: 02_data_spine_alignment.sql
-- Description: Aligns members and caregiver_profiles tables with the Data Contract (Settings + Onboarding).
-- Adds Village Intent columns and missing profile fields.

-- 1. Members Table Updates
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS neighborhood text,
ADD COLUMN IF NOT EXISTS languages text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS support_needed text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS support_offered text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS support_notes text;

-- 2. Caregiver Profiles Updates
-- Ensure languages exists for specific caregiver overrides
ALTER TABLE caregiver_profiles
ADD COLUMN IF NOT EXISTS languages text[] DEFAULT '{}';

-- 3. Indexes for Array Fields (Better Filtering)
CREATE INDEX IF NOT EXISTS idx_members_languages ON members USING GIN (languages);
CREATE INDEX IF NOT EXISTS idx_members_support_needed ON members USING GIN (support_needed);
CREATE INDEX IF NOT EXISTS idx_members_support_offered ON members USING GIN (support_offered);
CREATE INDEX IF NOT EXISTS idx_caregiver_languages ON caregiver_profiles USING GIN (languages);

-- 4. Verify RLS Policies (Comments only, manual check recommended)
-- Existing policies should cover UPDATE for auth.uid() = id.
