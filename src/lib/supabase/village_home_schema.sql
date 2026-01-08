-- Village Home Schema Updates
-- 1. Create Post Reports Table
CREATE TABLE IF NOT EXISTS public.post_reports (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id uuid REFERENCES public.posts(id) NOT NULL,
    reporter_id uuid REFERENCES public.members(id) NOT NULL,
    reason text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.post_reports ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Allow reporters to insert their own reports
DROP POLICY IF EXISTS "Allow insertion for reporters" ON public.post_reports;
CREATE POLICY "Allow insertion for reporters" ON public.post_reports
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = reporter_id);

-- No public select policy (Admins only logic usually handled by service_role or separate admin policies)
-- Explicitly deny select for now by not adding a policy, or add a restrictive one if needed.
-- Standard Supabase: no policy = deny all for public/anon/authenticated.

-- 4. Grant Permissions
REVOKE ALL ON public.post_reports FROM PUBLIC;
GRANT INSERT ON public.post_reports TO authenticated;
