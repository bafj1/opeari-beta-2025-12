-- FIX: Create Missing Waitlist Table
-- Run this in the Supabase SQL Editor if you get a "Could not find the table 'public.waitlist'" error.

CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  zip_code TEXT CHECK (zip_code IS NULL OR length(zip_code) = 5),
  linkedin_url TEXT,
  instagram_handle TEXT,
  role TEXT NOT NULL CHECK (role IN ('family', 'caregiver', 'both')),
  looking_for TEXT,
  why_join TEXT,
  hear_about_us TEXT,
  referred_by TEXT,
  referral_code TEXT UNIQUE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'converted')),
  approved_at TIMESTAMPTZ,
  invited_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  review_notes TEXT
);

-- Essential Indexes
CREATE INDEX IF NOT EXISTS idx_waitlist_status ON waitlist(status);
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);

-- RLS Policies
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public waitlist signup" ON waitlist;
CREATE POLICY "Allow public waitlist signup" ON waitlist FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own waitlist entry" ON waitlist;
CREATE POLICY "Users can view own waitlist entry" ON waitlist FOR SELECT TO authenticated USING (email = auth.jwt()->>'email');

DROP POLICY IF EXISTS "Service role full access" ON waitlist;
CREATE POLICY "Service role full access" ON waitlist FOR ALL TO service_role USING (true) WITH CHECK (true);
