-- Function: get_community_intel
-- Description: Returns aggregated intelligence for a user's location only if privacy threshold (n>=5) is met.
-- Privacy Rule: n >= 5 families in cohort.
-- Cohort Priority: Neighborhood -> Zip Code.

DROP FUNCTION IF EXISTS public.get_community_intel(UUID);

CREATE OR REPLACE FUNCTION get_community_intel(query_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_geo RECORD;
    cohort_count INT;
    cohort_type TEXT; -- 'neighborhood' or 'zip'
    top_needs JSONB;
BEGIN
    -- 0. Security Self-Lock + Null Guard
    IF auth.uid() IS NULL OR query_user_id <> auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized access to community intel';
    END IF;

    -- 1. Get User Location
    SELECT neighborhood, zip_code INTO user_geo
    FROM members WHERE id = query_user_id;

    -- 2. Define Cohort & Count
    -- Priority: Neighborhood -> Zip -> None
    IF user_geo.neighborhood IS NOT NULL AND length(trim(user_geo.neighborhood)) > 0 THEN
        cohort_type := 'neighborhood';
        SELECT count(*) INTO cohort_count
        FROM members 
        WHERE lower(neighborhood) = lower(user_geo.neighborhood)
        AND role = 'family'
        AND id != query_user_id;
    ELSIF user_geo.zip_code IS NOT NULL AND length(trim(user_geo.zip_code)) > 0 THEN
        cohort_type := 'zip';
        SELECT count(*) INTO cohort_count
        FROM members 
        WHERE zip_code = user_geo.zip_code
        AND role = 'family'
        AND id != query_user_id;
    ELSE
        RETURN jsonb_build_object('status', 'unavailable', 'reason', 'no_location');
    END IF;

    -- 3. Privacy Threshold Check
    IF cohort_count < 5 THEN
         RETURN jsonb_build_object(
            'status', 'seed',
            'cohort_size', cohort_count,
            'cohort_type', cohort_type,
            'message', 'Not enough local data yet. Showing benchmarks.'
        );
    END IF;

    -- 4. Calculate Aggregates (n >= 5)
    -- Corrected Logic: Unnest -> Count Freq -> Order -> Agg
    SELECT COALESCE(jsonb_agg(need ORDER BY freq DESC), '[]'::jsonb)
    INTO top_needs
    FROM (
        SELECT need, count(*) AS freq
        FROM (
            SELECT unnest(care_need_options) AS need
            FROM members
            WHERE role = 'family'
            AND id <> query_user_id
            AND (
                (cohort_type = 'neighborhood' AND lower(neighborhood) = lower(user_geo.neighborhood))
                OR
                (cohort_type = 'zip' AND zip_code = user_geo.zip_code)
            )
        ) t
        GROUP BY need
        ORDER BY freq DESC
        LIMIT 3
    ) ranked;

    RETURN jsonb_build_object(
        'status', 'active',
        'cohort_size', cohort_count,
        'cohort_type', cohort_type,
        'top_needs', top_needs
    );
END;
$$;

-- Permissions
REVOKE ALL ON FUNCTION public.get_community_intel(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_community_intel(UUID) TO authenticated;
