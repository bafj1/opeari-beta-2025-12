-- Migration: 09_caregiver_referrals.sql
-- Description: Create caregiver_referrals table and RPC function

-- 1. Create table
CREATE TABLE IF NOT EXISTS caregiver_referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    caregiver_id UUID NOT NULL REFERENCES members(id),
    referrer_id UUID NOT NULL REFERENCES members(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    relationship TEXT DEFAULT 'personal', -- 'personal', 'employer', 'connection'
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(caregiver_id, referrer_id)
);

-- 2. Add RLS policies (simple for now)
ALTER TABLE caregiver_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read referrals" ON caregiver_referrals
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own referrals" ON caregiver_referrals
    FOR INSERT WITH CHECK (auth.uid() = referrer_id);

-- 3. RPC Function to get referred caregivers
-- Returns caregivers that have been referred by someone the user is connected to (or by the user themselves)
CREATE OR REPLACE FUNCTION get_referred_caregivers(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    caregiver_id UUID,
    display_name TEXT,
    avatar_url TEXT,
    experience TEXT,
    rating NUMERIC, -- Average rating
    review_count BIGINT,
    referrer_name TEXT, -- Name of one referrer (e.g. "Shared by X")
    referrer_count BIGINT,
    distance_miles FLOAT, -- approximated for now
    availability_days TEXT[],
    verified BOOLEAN,
    certifications JSONB[]
) AS $$
BEGIN
    RETURN QUERY
    WITH my_village AS (
        -- Get IDs of people the user is connected to
        SELECT recipient_id AS member_id FROM connections 
        WHERE requester_id = p_user_id AND status = 'accepted'
        UNION
        SELECT requester_id AS member_id FROM connections 
        WHERE recipient_id = p_user_id AND status = 'accepted'
        UNION
        SELECT p_user_id -- Include user's own referrals
    ),
    relevant_referrals AS (
        SELECT 
            r.caregiver_id,
            r.referrer_id,
            r.rating,
            r.created_at
        FROM caregiver_referrals r
        JOIN my_village v ON r.referrer_id = v.member_id
    ),
    caregiver_stats AS (
        SELECT 
            rr.caregiver_id,
            COUNT(DISTINCT rr.referrer_id) as ref_count,
            AVG(rr.rating) as avg_rating
        FROM relevant_referrals rr
        GROUP BY rr.caregiver_id
    ),
    primary_referrer AS (
        -- Pick the most recent referrer to show "Referred by X"
        SELECT DISTINCT ON (rr.caregiver_id)
            rr.caregiver_id,
            m.first_name || ' ' || LEFT(m.last_name, 1) || '.' as ref_name
        FROM relevant_referrals rr
        JOIN members m ON rr.referrer_id = m.id
        WHERE rr.referrer_id != p_user_id -- Prefer showing others than self
        ORDER BY rr.caregiver_id, rr.created_at DESC
    )
    SELECT 
        m.id AS caregiver_id,
        (m.first_name || ' ' || LEFT(m.last_name, 1) || '.') AS display_name,
        m.avatar_url,
        COALESCE(cp.years_experience, 'Not specified') AS experience,
        COALESCE(cs.avg_rating, 0) AS rating,
        COALESCE(cs.ref_count, 0) AS review_count, -- Using ref count as review count for this context
        COALESCE(pr.ref_name, 'You') AS referrer_name,
        COALESCE(cs.ref_count, 0) AS referrer_count,
        0.0::float AS distance_miles, -- Placeholder
        m.availability_days,
        m.onboarding_complete AS verified, -- Using onboarding as proxy for verified
        COALESCE(cp.certifications, ARRAY[]::JSONB[]) AS certifications
    FROM members m
    LEFT JOIN caregiver_profiles cp ON m.id = cp.user_id
    JOIN caregiver_stats cs ON m.id = cs.caregiver_id
    LEFT JOIN primary_referrer pr ON m.id = pr.caregiver_id
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
