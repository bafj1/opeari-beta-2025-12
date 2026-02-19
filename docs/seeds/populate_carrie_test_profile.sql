-- Populate Carrie's Test Profile (c.k.jewett@gmail.com)
-- Also optionally links a referral from Breada (breadafarrell@gmail.com)

DO $$
DECLARE
    carrie_id UUID;
    breada_id UUID;
BEGIN
    -- 1. Get Carrie's ID
    SELECT id INTO carrie_id FROM auth.users WHERE email = 'c.k.jewett@gmail.com';
    
    -- Fallback to members table if not found in auth (e.g. if running in a context where auth is separate)
    IF carrie_id IS NULL THEN
        SELECT id INTO carrie_id FROM public.members WHERE email = 'c.k.jewett@gmail.com';
    END IF;

    -- If Carrie doesn't exist, we can't proceed
    IF carrie_id IS NULL THEN
        RAISE NOTICE 'Carrie (c.k.jewett@gmail.com) not found. Skipping profile update.';
        RETURN;
    END IF;

    RAISE NOTICE 'Updating Profile for Carrie: %', carrie_id;

    -- 2. Update Members Table
    UPDATE public.members SET
        first_name = 'Carrie',
        last_name = 'Jewett',
        role = 'caregiver',
        bio = 'Experienced nanny and early childhood educator with 8+ years caring for children ages 0-6. I specialize in creating nurturing, play-based environments where kids feel safe to explore and grow. CPR/First Aid certified, bilingual English/Spanish. I love outdoor adventures, arts and crafts, and helping little ones build confidence.',
        zip_code = '90266',
        neighborhood = 'Manhattan Beach',
        availability_days = ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        care_types = ARRAY['nanny', 'nanny-share', 'backup-care'],
        looking_for = ARRAY['nanny-share', 'full-time', 'part-time'],
        nanny_situation = 'seeking_share',
        open_to = ARRAY['playdates', 'weekend_swaps', 'rideshares'],
        languages = ARRAY['English', 'Spanish'],
        vetting_status = 'verified',
        onboarding_complete = true,
        children_age_groups = ARRAY['infant', 'toddler', 'preschool'],
        support_offered = ARRAY['full-time care', 'part-time care', 'backup care', 'nanny share'],
        schedule_flexible = false,
        timeline = 'asap',
        updated_at = now()
    WHERE id = carrie_id;

    -- 3. Update/Insert Caregiver Profile
    INSERT INTO public.caregiver_profiles (
        id, experience_years, hourly_rate_min, hourly_rate_max,
        certifications, education, languages, age_groups_served,
        care_types_offered, special_needs_experience, transportation,
        smoke_free, comfortable_with_pets, updated_at
    ) VALUES (
        carrie_id,
        8, 25, 40,
        '[
            {"name": "CPR/First Aid", "issuer": "American Red Cross", "year": 2024},
            {"name": "Early Childhood Education", "issuer": "El Camino College", "year": 2019},
            {"name": "Child Development Associate", "issuer": "CDA Council", "year": 2020}
        ]'::jsonb,
        'Associate Degree in Early Childhood Education, El Camino College',
        ARRAY['English', 'Spanish'],
        ARRAY['infant', 'toddler', 'preschool'],
        ARRAY['nanny', 'nanny-share', 'backup-care', 'babysitter'],
        false, true, true, true, now()
    )
    ON CONFLICT (id) DO UPDATE SET
        experience_years = EXCLUDED.experience_years,
        hourly_rate_min = EXCLUDED.hourly_rate_min,
        hourly_rate_max = EXCLUDED.hourly_rate_max,
        certifications = EXCLUDED.certifications,
        education = EXCLUDED.education,
        languages = EXCLUDED.languages,
        age_groups_served = EXCLUDED.age_groups_served,
        care_types_offered = EXCLUDED.care_types_offered,
        transportation = EXCLUDED.transportation,
        smoke_free = EXCLUDED.smoke_free,
        comfortable_with_pets = EXCLUDED.comfortable_with_pets,
        updated_at = now();

    -- 4. Get Breada's ID for Referral
    SELECT id INTO breada_id FROM public.members WHERE email = 'breadafarrell@gmail.com';

    IF breada_id IS NOT NULL THEN
        RAISE NOTICE 'Creating Referral from Breada (%) to Carrie', breada_id;
        
        INSERT INTO public.caregiver_referrals (caregiver_id, referrer_id, rating, relationship, note)
        VALUES (
            carrie_id,
            breada_id,
            5,
            'personal',
            'Carrie has been amazing with my kids. She is patient, creative, and my children light up when they see her. Could not recommend her more highly.'
        )
        ON CONFLICT (caregiver_id, referrer_id) DO UPDATE SET
            rating = EXCLUDED.rating,
            note = EXCLUDED.note;
    ELSE
        RAISE NOTICE 'Breada (breadafarrell@gmail.com) not found. Skipping referral creation.';
    END IF;

END $$;
