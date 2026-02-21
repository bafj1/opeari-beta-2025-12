-- Migration 33: Change endorsements.relationship from text to text[] for multi-select
-- Run in Supabase SQL Editor BEFORE deploying the frontend changes
-- Date: 2026-02-20

-- Change relationship from text to text[] to support multi-select
ALTER TABLE endorsements ALTER COLUMN relationship TYPE text[] USING ARRAY[relationship];

-- Verify the change
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'endorsements' AND column_name = 'relationship';
-- Should show: ARRAY
