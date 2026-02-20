-- Migration 29: Add missing columns + recreate views
-- Run in Supabase SQL Editor
-- Date: 2026-02-19

-- Step 1: Add ALL missing columns
ALTER TABLE public.members
    ADD COLUMN IF NOT EXISTS has_yard boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS has_pool boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS has_pets boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS pet_types text[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS pet_notes text DEFAULT '',
    ADD COLUMN IF NOT EXISTS home_allergies text[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS home_allergy_notes text DEFAULT '',
    ADD COLUMN IF NOT EXISTS home_notes text DEFAULT '',
    ADD COLUMN IF NOT EXISTS interests text[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS commute_range text DEFAULT '',
    ADD COLUMN IF NOT EXISTS num_floors integer DEFAULT 1;

-- Step 2: Recreate views with ONLY columns that exist
DROP VIEW IF EXISTS members_preview CASCADE;

CREATE VIEW members_preview AS
SELECT
    id, first_name, last_name, role, roles,
    zip_code, neighborhood, bio, avatar_url,
    care_types, availability_days, children_age_groups,
    languages, timeline, vetting_status,
    comfortable_with_pets, smoke_free_required,
    has_transportation, schedule_flexible,
    has_parking, has_stairs, home_type,
    has_pets, pet_types,
    onboarding_complete,
    created_at, updated_at
FROM members;

CREATE OR REPLACE VIEW posts_with_author AS
SELECT 
    p.*,
    m.first_name AS author_first_name,
    m.last_name AS author_last_name,
    m.avatar_url AS author_avatar_url,
    m.neighborhood AS author_neighborhood
FROM posts p
LEFT JOIN members m ON p.author_id = m.id;

NOTIFY pgrst, 'reload schema';
