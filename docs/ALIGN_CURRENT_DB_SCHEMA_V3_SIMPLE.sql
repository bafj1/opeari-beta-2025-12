-- SCHEMA ALIGNMENT V3: The "Just Fix It" Script
-- Run this in the Supabase SQL Editor for your CURRENT connected project.
-- This ONLY creates the table needed for the site to work. 
-- It skips migration since your old table appears empty/different.

-- 1. Create the 'waitlist' table
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

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_waitlist_status ON waitlist(status);
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_role ON waitlist(role);

-- 3. Security
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public waitlist signup" ON waitlist;
CREATE POLICY "Allow public waitlist signup" ON waitlist FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Members can view own waitlist entry" ON waitlist;
CREATE POLICY "Members can view own waitlist entry" ON waitlist FOR SELECT TO authenticated USING (email = auth.jwt()->>'email');

DROP POLICY IF EXISTS "Service role full access" ON waitlist;
CREATE POLICY "Service role full access" ON waitlist FOR ALL TO service_role USING (true) WITH CHECK (true);
