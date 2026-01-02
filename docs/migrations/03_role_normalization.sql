-- Migration: 03_role_normalization.sql
-- Description: Standardizes 'parent' role to 'family' and ensures 'bio' migration if needed.

-- 1. Update existing 'parent' roles to 'family'
UPDATE members
SET role = 'family'
WHERE role = 'parent';

-- 2. No-op verification (optional check)
-- SELECT count(*) FROM members WHERE role = 'parent'; -- Should be 0
