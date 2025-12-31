-- SETUP CAREGIVER INTEREST TABLE
-- Run this in Supabase SQL Editor to ensure the caregiver flow works.

-- 1. Create table if not exists (Standard Schema)
CREATE TABLE IF NOT EXISTS caregiver_interest (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    zip TEXT NOT NULL,
    role TEXT NOT NULL,
    experience TEXT,
    notes TEXT,
    -- Metadata
    user_id UUID REFERENCES auth.users(id), -- Optional link to auth user
    status TEXT DEFAULT 'pending'
);

-- 2. Enable RLS
ALTER TABLE caregiver_interest ENABLE ROW LEVEL SECURITY;

-- 3. Policies (Allow Inserts for Everyone)
DROP POLICY IF EXISTS "Allow public insert" ON caregiver_interest;
CREATE POLICY "Allow public insert" ON caregiver_interest FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Admins read all" ON caregiver_interest;
CREATE POLICY "Admins read all" ON caregiver_interest FOR ALL TO service_role USING (true);
