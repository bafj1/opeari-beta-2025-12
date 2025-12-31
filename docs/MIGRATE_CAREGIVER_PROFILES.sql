-- Create caregiver_profiles table
CREATE TABLE IF NOT EXISTS caregiver_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Basic Info
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  zip_code TEXT,
  avatar_url TEXT,
  
  -- Experience
  role_type TEXT, -- nanny, babysitter, au_pair, other
  years_experience TEXT,
  age_groups TEXT[], -- array: infant, toddler, preschool, school_age
  certifications TEXT[], -- array: cpr, first_aid, ece, other
  bio TEXT,
  
  -- Availability
  availability_type TEXT, -- full_time, part_time, occasional, flexible
  schedule_notes TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive', 'suspended')),
  background_check_status TEXT DEFAULT 'not_started',
  verified_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE caregiver_profiles ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can insert their own profile" ON caregiver_profiles;
CREATE POLICY "Users can insert their own profile" ON caregiver_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own profile" ON caregiver_profiles;
CREATE POLICY "Users can view their own profile" ON caregiver_profiles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON caregiver_profiles;
CREATE POLICY "Users can update their own profile" ON caregiver_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow admins to view all
DROP POLICY IF EXISTS "Admins can view all profiles" ON caregiver_profiles;
CREATE POLICY "Admins can view all profiles" ON caregiver_profiles
  FOR ALL TO service_role USING (true);
