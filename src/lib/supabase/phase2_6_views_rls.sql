-- Phase 2.6.1: Safe Member Data Access (Prod Schema Alignment)
-- 1. Create Views

-- A) members_preview
-- Safe columns only. strictly from production schema.
-- Includes zip_code for reliable matching, and neighborhood for display.
CREATE OR REPLACE VIEW public.members_preview AS
SELECT
    id,
    first_name,
    role,
    neighborhood, -- Main location proxy
    zip_code,     -- Matching reliability
    bio,
    
    -- Core Fields
    num_kids,
    -- kids_ages is safe enough for preview (array of numbers) or can be withheld if strict
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

-- B) members_connected (Secure View)
-- Access Rule: Viewer = ID (Self) OR Connection Status = 'accepted'
CREATE OR REPLACE VIEW public.members_connected AS
SELECT m.*
FROM public.members m
WHERE 
    -- 1. Viewer is the member (Self)
    -- Confirmed: members.id is the Auth UUID
    m.id = auth.uid()
    OR
    -- 2. Connected (Accepted)
    EXISTS (
        SELECT 1 FROM public.connections c
        WHERE c.status = 'accepted'
        AND (
            (c.requester_id = auth.uid() AND c.requestee_id = m.id)
            OR
            (c.requester_id = m.id AND c.requestee_id = auth.uid())
        )
    );

-- 2. Permissions & RLS

-- Hardening: Revoke Public Access explicitly first
REVOKE ALL ON public.members_preview FROM PUBLIC;
REVOKE ALL ON public.members_connected FROM PUBLIC;

-- Grant access to Views (Authenticated users)
GRANT SELECT ON public.members_preview TO authenticated;
GRANT SELECT ON public.members_connected TO authenticated;
