-- SECURITY COMPLIANCE FIXES (STRICT SCOPE)
-- Objective: Resolve High-Risk Security Lints (Security Definer Views, Permissive RLS) without side effects.

-- 1. DROP EXISTING VIEWS (Clean Slate to Ensure Security Invoker)
-- Order matters due to dependencies (posts_with_author depends on members_preview)
DROP VIEW IF EXISTS public.posts_with_author;
DROP VIEW IF EXISTS public.members_preview CASCADE;
DROP VIEW IF EXISTS public.members_connected CASCADE;

-- 2. RECREATE members_preview (SECURITY INVOKER)
-- Strictly preserves columns from phase2_6_views_rls.sql
CREATE VIEW public.members_preview WITH (security_invoker = on) AS
SELECT
    id,
    first_name,
    role,
    neighborhood, -- Main location proxy
    zip_code,     -- Matching reliability
    bio,
    -- Core Fields
    num_kids,
    children_age_groups,
    care_types,
    -- Schedule
    availability_days,
    availability_blocks,
    schedule_flexible,
    -- Metadata
    languages,
    situation,      -- Prod column name
    timeline,       -- Prod column name
    also_open_to,   -- Prod column name
    budget_tiers
FROM public.members;

-- Permissions for members_preview
REVOKE ALL ON public.members_preview FROM PUBLIC;
GRANT SELECT ON public.members_preview TO authenticated;

-- 3. RECREATE members_connected (SECURITY INVOKER)
-- Preserves connection logic
CREATE VIEW public.members_connected WITH (security_invoker = on) AS
SELECT m.*
FROM public.members m
WHERE 
    m.id = auth.uid()
    OR
    EXISTS (
        SELECT 1 FROM public.connections c
        WHERE c.status = 'accepted'
        AND (
            (c.requester_id = auth.uid() AND c.requestee_id = m.id)
            OR
            (c.requester_id = m.id AND c.requestee_id = auth.uid())
        )
    );

-- Permissions for members_connected
REVOKE ALL ON public.members_connected FROM PUBLIC;
GRANT SELECT ON public.members_connected TO authenticated;

-- 4. RECREATE posts_with_author (SECURITY INVOKER)
-- Dependencies: members_preview
CREATE VIEW public.posts_with_author WITH (security_invoker = on) AS
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

-- Permissions for posts_with_author
GRANT SELECT ON public.posts_with_author TO authenticated;

-- 5. FIX WAITLIST RLS
-- Ensure "Allow public signup" is INSERT only, no other anon permissions
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Remove broad policies if they exist (clean up)
DROP POLICY IF EXISTS "Allow public signup" ON public.waitlist;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.waitlist;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.waitlist;

-- Re-apply strict public insert policy
CREATE POLICY "Allow public signup" ON public.waitlist 
FOR INSERT 
WITH CHECK (true); 

-- 6. LOCK FUNCTION SEARCH PATHS
-- Mitigate search_path hijacking risks by setting explicit search_path
ALTER FUNCTION public.set_updated_at() SET search_path = public;
ALTER FUNCTION public.get_waitlist_count() SET search_path = public;
