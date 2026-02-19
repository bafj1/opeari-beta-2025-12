-- Migration: Settings V1.1 (Avatar & Storage)
-- Author: Opeari Agent
-- Date: 2026-01-18

-- 1. Add avatar_url to members table if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'avatar_url') THEN
        ALTER TABLE members ADD COLUMN avatar_url text;
    END IF;
END $$;

-- 2. Create 'avatars' storage bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Enable RLS on objects if not already enabled (default for storage.objects usually, but good practice)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for Avatars
-- Allow public read access to avatars (so other users can see them)
DROP POLICY IF EXISTS "Avatar Public Read" ON storage.objects;
CREATE POLICY "Avatar Public Read"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- Allow authenticated users to upload their own avatar
-- File path convention: "userID/filename" or just "filename" if we want validation? 
-- Let's use "userID/*" folder structure for security/isolation.
DROP POLICY IF EXISTS "Avatar Auth Upload" ON storage.objects;
CREATE POLICY "Avatar Auth Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own avatar
DROP POLICY IF EXISTS "Avatar Auth Update" ON storage.objects;
CREATE POLICY "Avatar Auth Update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own avatar
DROP POLICY IF EXISTS "Avatar Auth Delete" ON storage.objects;
CREATE POLICY "Avatar Auth Delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);
