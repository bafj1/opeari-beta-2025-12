-- Update get_referred_caregivers to return referrer_note

DROP FUNCTION IF EXISTS get_referred_caregivers(uuid, integer);

CREATE OR REPLACE FUNCTION get_referred_caregivers(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    caregiver_id UUID,
    display_name TEXT,
    avatar_url TEXT,
    experience TEXT,
    rating NUMERIC,
    review_count BIGINT,
    referrer_name TEXT,
    referrer_note TEXT,
    referrer_count BIGINT,
    distance_miles FLOAT,
    availability_days TEXT[],
    verified BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH my_village AS (
        SELECT recipient_id AS member_id FROM connections 
        WHERE requester_id = p_user_id AND status = 'accepted'
        UNION
        SELECT requester_id AS member_id FROM connections 
        WHERE recipient_id = p_user_id AND status = 'accepted'
        UNION
        SELECT p_user_id
    ),
    relevant_referrals AS (
        SELECT 
            r.caregiver_id,
            r.referrer_id,
            r.rating,
            r.note,
            r.created_at
        FROM caregiver_referrals r
        JOIN my_village v ON r.referrer_id = v.member_id
    ),
    caregiver_stats AS (
        SELECT 
            rr.caregiver_id,
            COUNT(DISTINCT rr.referrer_id) AS ref_count,
            AVG(rr.rating)::numeric(3,1) AS avg_rating
        FROM relevant_referrals rr
        GROUP BY rr.caregiver_id
    ),
    primary_referrer AS (
        SELECT DISTINCT ON (rr.caregiver_id)
            rr.caregiver_id,
            m.first_name || ' ' || LEFT(m.last_name, 1) || '.' AS ref_name,
            rr.note AS ref_note
        FROM relevant_referrals rr
        JOIN members m ON rr.referrer_id = m.id
        ORDER BY rr.caregiver_id, rr.created_at DESC
    )
    SELECT 
        m.id AS caregiver_id,
        (m.first_name || ' ' || LEFT(m.last_name, 1) || '.')::TEXT AS display_name,
        m.avatar_url::TEXT,
        COALESCE(m.bio, 'Experienced caregiver')::TEXT AS experience,
        COALESCE(cs.avg_rating, 0)::NUMERIC AS rating,
        COALESCE(cs.ref_count, 0)::BIGINT AS review_count,
        COALESCE(pr.ref_name, 'A village member')::TEXT AS referrer_name,
        pr.ref_note::TEXT AS referrer_note,
        COALESCE(cs.ref_count, 0)::BIGINT AS referrer_count,
        0.0::FLOAT AS distance_miles,
        m.availability_days::TEXT[] AS availability_days,
        (m.vetting_status = 'verified' OR m.vetting_status = 'approved')::BOOLEAN AS verified
    FROM members m
    JOIN caregiver_stats cs ON cs.caregiver_id = m.id
    LEFT JOIN primary_referrer pr ON pr.caregiver_id = m.id
    ORDER BY cs.avg_rating DESC NULLS LAST, cs.ref_count DESC
    LIMIT p_limit;
END;
$$;
