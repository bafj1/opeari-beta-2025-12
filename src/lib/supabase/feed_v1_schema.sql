-- Phase 3: Feed V1 Schema (Hardened - Neighborhood Scoped)

-- 0. Identity Mapping Validation (Comment)
-- SYSTEM ASSUMPTION: public.members.id is ALWAYS equal to auth.users.id
-- This is enforced during onboarding/signup triggers.
-- If this invariant is broken, RLS policies relying on auth.uid() = author_id will fail secure.

-- 1. Posts Table
-- Changed scoping from zip_code to neighborhood per V1 requirements.
CREATE TABLE IF NOT EXISTS public.posts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    author_id uuid REFERENCES public.members(id) NOT NULL,
    type text CHECK (type IN ('question', 'availability', 'win', 'share', 'community')),
    content text NOT NULL,
    context_type text CHECK (context_type IN ('family', 'caregiver', 'community')),
    neighborhood text NOT NULL, -- core filtering (was zip_code)
    meta_data jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now()
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_posts_neighborhood ON public.posts(neighborhood);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);

-- 3. RLS Policies

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- A) Neighborhood-Scoped Read Access
-- User can only read posts in their own neighborhood.
DROP POLICY IF EXISTS "Allow read access for authenticated" ON public.posts;
DROP POLICY IF EXISTS "Allow read access for authenticated (zip scoped)" ON public.posts;

CREATE POLICY "Allow read access for authenticated (neighborhood scoped)"
ON public.posts FOR SELECT
TO authenticated
USING (
  neighborhood = (
    -- Look up the requesting user's neighborhood securely
    SELECT m.neighborhood
    FROM public.members_preview m
    WHERE m.id = auth.uid()
    LIMIT 1
  )
);

-- B) Create Access (Self only)
DROP POLICY IF EXISTS "Allow creation for authors" ON public.posts;

CREATE POLICY "Allow creation for authors" 
ON public.posts FOR INSERT 
TO authenticated 
WITH CHECK (
    -- Enforce Identity Mapping
    auth.uid() = author_id
);

-- C) Update/Delete (Self only)
DROP POLICY IF EXISTS "Allow update for authors" ON public.posts;
CREATE POLICY "Allow update for authors" ON public.posts FOR UPDATE TO authenticated USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Allow delete for authors" ON public.posts;
CREATE POLICY "Allow delete for authors" ON public.posts FOR DELETE TO authenticated USING (auth.uid() = author_id);


-- 4. Views

-- B) posts_with_author View
-- Stable interface for the Feed, joining posts to member details.
-- RLS on 'posts' will automatically filter the results of this view for the user.
CREATE OR REPLACE VIEW public.posts_with_author AS
SELECT
  p.id,
  p.author_id,
  p.type,
  p.content,
  p.context_type,
  p.neighborhood,
  p.created_at,
  jsonb_build_object(
    'first_name', m.first_name,
    'role', m.role,
    'neighborhood', m.neighborhood
  ) as author
FROM public.posts p
JOIN public.members_preview m
  ON m.id = p.author_id;

-- Grant access to the view
GRANT SELECT ON public.posts_with_author TO authenticated;
