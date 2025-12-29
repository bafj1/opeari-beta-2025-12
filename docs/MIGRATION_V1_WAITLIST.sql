-- MIGRATION: Consolidate Waitlist Tables
-- Run this in the Supabase SQL Editor

-- 1. Backup (Optional - you can skip if you have already exported)
-- SELECT * FROM waitlist;
-- SELECT * FROM waitlist_entries;

-- 2. Drop legacy tables (if you are sure!) or rename them
-- DROP TABLE IF EXISTS waitlist_entries;
-- DROP TABLE IF EXISTS waitlist;
-- For safety during dev, let's just create the new one. 
-- Since 'waitlist' exists, we might need to drop it or rename it first if we want to reuse the name.
-- RECOMMENDED: Rename old tables first to back them up inside DB
ALTER TABLE IF EXISTS waitlist RENAME TO waitlist_legacy_backup;
ALTER TABLE IF EXISTS waitlist_entries RENAME TO waitlist_entries_backup;

-- 3. Create Clean Schema
CREATE TABLE waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Identity
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  zip_code TEXT CHECK (zip_code IS NULL OR length(zip_code) = 5),
  linkedin_url TEXT,
  instagram_handle TEXT, -- Optional, for manual vetting

  -- Routing & Context
  role TEXT NOT NULL CHECK (role IN ('family', 'caregiver', 'both')),
  looking_for TEXT, -- e.g. 'asap', '1-3months', 'exploring'
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

-- 4. Indexes
CREATE INDEX idx_waitlist_status ON waitlist(status);
CREATE INDEX idx_waitlist_email ON waitlist(email);
CREATE INDEX idx_waitlist_role ON waitlist(role);

-- 5. Enable RLS
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- 6. Policies
-- Policy: Allow inserts from anon (for waitlist form)
CREATE POLICY "Allow public waitlist signup" ON waitlist
  FOR INSERT TO anon
  WITH CHECK (true);

-- Policy: Allow authenticated users to read their own entry
CREATE POLICY "Users can view own waitlist entry" ON waitlist
  FOR SELECT TO authenticated
  USING (email = auth.jwt()->>'email');

-- Policy: Service role can do everything (for admin functions)
CREATE POLICY "Service role full access" ON waitlist
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- 7. Migrate Data (from backup tables)
-- Note: Adjust source table name if you didn't rename them above
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
  -- Map role/user_type to new allowed values
  CASE 
    WHEN role = 'family' THEN 'family'
    WHEN role = 'caregiver' THEN 'caregiver'
    WHEN user_type = 'family' THEN 'family' 
    WHEN user_type = 'caregiver' THEN 'caregiver'
    ELSE 'family' -- Default fallback
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
FROM waitlist_entries_backup -- Start with the ACTIVE table
WHERE email IS NOT NULL
ON CONFLICT (email) DO NOTHING; -- Skip duplicates

-- Optional: Also migrate from 'waitlist_legacy_backup' if needed, but watch out for duplicates.
