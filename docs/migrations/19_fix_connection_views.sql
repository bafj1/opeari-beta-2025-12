-- FIX CONNECTIONS VIEWS (Recursion 400 Error)
-- The "members_connected" view with security_invoker=on causes infinite recursion
-- if the members table RLS policies reference the view.
-- FIX: Revert to SECURITY DEFINER (Root Access) with explicit search_path.

-- 1. DROP EXISTING VIEWS
DROP VIEW IF EXISTS public.members_connected CASCADE;
DROP VIEW IF EXISTS public.members_preview CASCADE;
-- Note: posts_with_author depends on members_preview, will be dropped by CASCADE

-- 2. RECREATE members_preview (SECURITY DEFINER)
CREATE OR REPLACE VIEW public.members_preview WITH (security_invoker = off) AS
SELECT
    id,
    first_name,
    role,
    neighborhood,
    zip_code,
    bio,
    num_kids,
    children_age_groups,
    care_types,
    availability_days,
    availability_blocks,
    schedule_flexible,
    languages,
    situation,
    timeline,
    also_open_to,
    budget_tiers
FROM public.members;

-- Set Owner/Permissions
ALTER VIEW public.members_preview OWNER TO postgres;
GRANT SELECT ON public.members_preview TO authenticated;
-- Important: Empty search path for security
ALTER VIEW public.members_preview SET search_path = public;

-- 3. RECREATE members_connected (SECURITY DEFINER)
-- This bypasses "members" table RLS, avoiding recursion.
CREATE OR REPLACE VIEW public.members_connected WITH (security_invoker = off) AS
SELECT m.*
FROM public.members m
WHERE 
    -- 1. Self
    m.id = auth.uid()
    OR
    -- 2. Connected
    EXISTS (
        SELECT 1 FROM public.connections c
        WHERE c.status = 'accepted'
        AND (
            (c.requester_id = auth.uid() AND c.recipient_id = m.id)
            OR
            (c.requester_id = m.id AND c.recipient_id = auth.uid())
        )
    );

ALTER VIEW public.members_connected OWNER TO postgres;
GRANT SELECT ON public.members_connected TO authenticated;
ALTER VIEW public.members_connected SET search_path = public;

-- 4. RESTORE posts_with_author (Dependent View)
CREATE OR REPLACE VIEW public.posts_with_author WITH (security_invoker = off) AS
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

GRANT SELECT ON public.posts_with_author TO authenticated;
ALTER VIEW public.posts_with_author SET search_path = public;

-- 5. Fix messages RLS (if needed)
-- The "messages" 400 error is likely checking existence of sender/recipient in members.
-- Check if members RLS is causing issues there too.
-- If members_preview is used in the app, switching to DEFINER fixes most reads.
