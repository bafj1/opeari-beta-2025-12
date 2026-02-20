import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { ensureMemberRow } from '../lib/auth/ensureMemberRow';
import { useAuth } from '../context/AuthContext';

const MAX_RETRIES = 3;
const FETCH_TIMEOUT_MS = 8000;

const MEMBER_SELECT = `
  id, email, first_name, last_name, phone, zip_code, address, role, roles,
  num_kids, kids_ages, care_types, bio, profile_complete, onboarding_complete,
  also_open_to, situation, timeline, neighborhood, schedule_flexible,
  caregiver_work_types, ready_to_start, avatar_url,
  availability_days, availability_blocks, special_availability,
  children_age_groups, budget_tiers, languages, availability_detail,
  comfortable_with_pets, smoke_free_required, willing_to_travel, available_overnight,
  emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
  privacy_show_full_name, privacy_show_location, privacy_show_phone, privacy_appear_in_search,
  phone_verified, instagram_handle, linkedin_url, facebook_url,
  care_need_options, care_offer_options, care_specific_needs, current_care_setup,
  hosting_interest, target_budget_range, target_budget, budget_tier,
  support_offered, support_needed, support_notes,
  weekly_schedule, available_to_help_schedule,
  notification_prefs, matching_prefs, village_prefs, schedule_notes, timezone,
  home_type, has_parking, has_stairs, budget_min, budget_max,
  has_yard, has_pool, has_pets, pet_types, pet_notes,
  home_allergies, home_allergy_notes, home_notes,
  interests, commute_range, num_floors,
  referral_code, referral_count,
  has_transportation, needs_caregiver_driver, max_travel_miles, overnight_available,
  can_lift_30lbs, comfortable_with_stairs, vetting_status,
  created_at, updated_at
`;

export interface Viewer {
    member: any;
    caregiverProfile?: any;
    user?: any;
}

export function useViewer() {
    const { user } = useAuth();
    const [viewer, setViewer] = useState<Viewer | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const retryCount = useRef(0);

    const refresh = useCallback(async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        if (retryCount.current >= MAX_RETRIES) {
            console.error('useViewer: Max retries reached, stopping fetch attempts');
            setLoading(false);
            setError(new Error('Failed to load profile after multiple attempts'));
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // 1. Fetch Member with timeout
            const memberPromise = supabase
                .from('members')
                .select(MEMBER_SELECT)
                .eq('id', user.id)
                .maybeSingle();

            const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Member fetch timed out')), FETCH_TIMEOUT_MS)
            );

            let memberResult;
            try {
                memberResult = await Promise.race([memberPromise, timeoutPromise]) as any;
            } catch (timeoutErr: any) {
                console.warn('useViewer: Member fetch timed out after', FETCH_TIMEOUT_MS, 'ms');
                retryCount.current += 1;
                setLoading(false);
                return;
            }

            const { data: member, error: memberError } = memberResult;

            if (memberError) {
                console.error('useViewer: Member fetch error:', memberError.message);
                retryCount.current += 1;
                throw new Error(`Failed to load member profile: ${memberError.message}`);
            }

            let loadedMember = member;

            // If member is null, ensure then retry once
            if (!loadedMember) {
                console.warn('useViewer: Member not found, re-ensuring...');
                await ensureMemberRow();

                const { data: retryData, error: retryError } = await supabase
                    .from('members')
                    .select(MEMBER_SELECT)
                    .eq('id', user.id)
                    .maybeSingle();

                if (retryError) throw new Error(`Failed to load member profile (retry): ${retryError.message}`);

                if (!retryData) {
                    throw new Error('Failed to load member profile: no member row found after ensureMemberRow retry.');
                }

                loadedMember = retryData;
            }

            // BACKFILL EMAIL IF MISSING
            if (!loadedMember.email && user.email) {
                const { error: updateError } = await supabase
                    .from('members')
                    .update({ email: user.email })
                    .eq('id', user.id);

                if (!updateError) {
                    loadedMember.email = user.email;
                }
            }

            let caregiverProfile = null;

            // 2. If role is caregiver, fetch caregiver profile
            if (loadedMember && loadedMember.role === 'caregiver') {
                const { data: profile, error: profileError } = await supabase
                    .from('caregiver_profiles')
                    .select('*')
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (profileError) throw profileError;

                if (profile) {
                    caregiverProfile = profile;
                } else {
                    console.log('useViewer: Caregiver role but no profile. Creating stub.');

                    const { data: newProfile, error: createError } = await supabase
                        .from('caregiver_profiles')
                        .insert({
                            user_id: user.id,
                            first_name: loadedMember.first_name,
                            last_name: loadedMember.last_name,
                            email: user.email,
                            zip_code: loadedMember.zip_code
                        })
                        .select('*')
                        .single();

                    if (!createError && newProfile) {
                        caregiverProfile = newProfile;
                    } else {
                        console.warn('useViewer: Insert failed or conflicted, refetching...', createError?.message);

                        const { data: retryProfile, error: retryError } = await supabase
                            .from('caregiver_profiles')
                            .select('*')
                            .eq('user_id', user.id)
                            .maybeSingle();

                        if (retryError) throw retryError;
                        if (!retryProfile) {
                            throw new Error('Caregiver profile could not be created or loaded.');
                        }
                        caregiverProfile = retryProfile;
                    }
                }
            }

            // Success — reset retry count
            retryCount.current = 0;
            setViewer({ member: loadedMember, caregiverProfile, user });

        } catch (err: any) {
            console.error('useViewer: Error fetching viewer:', err);
            setError(err);
            setViewer(null);
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Initial Mount Effect — only depends on user identity
    useEffect(() => {
        let mounted = true;

        const init = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            if (mounted) {
                retryCount.current = 0; // Reset on new user
                await refresh();
            }
        };

        init();

        return () => {
            mounted = false;
        };
    }, [user?.id]); // Only re-run when auth user ID changes

    return { viewer, loading, error, refresh };
}
