-- Migration 30: Add referral_code + referral_count to members
-- Run in Supabase SQL Editor
-- Date: 2026-02-19

-- Add referral_code and referral_count to members if missing
ALTER TABLE public.members 
    ADD COLUMN IF NOT EXISTS referral_code text DEFAULT '',
    ADD COLUMN IF NOT EXISTS referral_count integer DEFAULT 0;

-- Generate referral codes for existing members who don't have one
UPDATE public.members 
SET referral_code = LEFT(id::text, 8)
WHERE referral_code IS NULL OR referral_code = '';

NOTIFY pgrst, 'reload schema';
