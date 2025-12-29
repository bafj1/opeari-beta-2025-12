-- FIX: RECOVER WAITLIST MIGRATION
-- Run this after confirming 'waitlist_entries_backup' exists and has data.

-- 1. Ensure 'waitlist' table exists (Create if missing)
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Identity
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  zip_code TEXT CHECK (zip_code IS NULL OR length(zip_code) = 5),
  linkedin_url TEXT,
  instagram_handle TEXT,

  -- Routing & Context
  role TEXT NOT NULL CHECK (role IN ('family', 'caregiver', 'both')),
  looking_for TEXT,
  why_join TEXT,

  -- Attribution
  hear_about_us TEXT,
  referred_by TEXT,

  -- System / Status
  referral_code TEXT UNIQUE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'converted')),
  approved_at TIMESTAMPTZ,
  invited_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  review_notes TEXT
);

-- 2. Check/Create Indexes (IF NOT EXISTS to be safe)
CREATE INDEX IF NOT EXISTS idx_waitlist_status ON waitlist(status);
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_role ON waitlist(role);

-- 3. Enable RLS
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies (Drop first to avoid errors if they exist)
DROP POLICY IF EXISTS "Allow public waitlist signup" ON waitlist;
CREATE POLICY "Allow public waitlist signup" ON waitlist FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own waitlist entry" ON waitlist;
CREATE POLICY "Users can view own waitlist entry" ON waitlist FOR SELECT TO authenticated USING (email = auth.jwt()->>'email');

DROP POLICY IF EXISTS "Service role full access" ON waitlist;
CREATE POLICY "Service role full access" ON waitlist FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 5. Migrate Data
-- This attempts to insert data from the backup tables.
-- It uses ON CONFLICT DO NOTHING to avoid duplicates if some data was already migrated.

INSERT INTO waitlist (
  email, first_name, last_name, zip_code, linkedin_url,
  role, looking_for, why_join,
  hear_about_us, referred_by,
  referral_code, status, approved_at, invited_at, review_notes,
  created_at
)
SELECT 
  email,
  first_name,
  last_name,
  zip_code,
  linkedin_url,
  -- Map role/user_type
  CASE 
    WHEN role = 'family' THEN 'family'
    WHEN role = 'caregiver' THEN 'caregiver'
    WHEN user_type = 'family' THEN 'family' 
    WHEN user_type = 'caregiver' THEN 'caregiver'
    ELSE 'family'
  END as role,
  COALESCE(looking_for, urgency) as looking_for,
  why_join,
  COALESCE(hear_about_us, referral_source, 'unknown') as hear_about_us,
  COALESCE(referred_by, referral_name) as referred_by,
  referral_code,
  -- Map status
  COALESCE(status, CASE WHEN approved = true THEN 'approved' ELSE 'pending' END) as status,
  approved_at,
  invited_at,
  review_notes,
  created_at
FROM waitlist_entries_backup
WHERE email IS NOT NULL
ON CONFLICT (email) DO NOTHING;
